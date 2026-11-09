"""Audit CLD model/export integrity against the recorded pre-presentation model."""
import csv
import hashlib
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASELINE = {
    'model.json': '1995f1dd8bb50dbc513025ad0a2a9d93c4965e1ee508d97fdc0228e605c68b2b',
    'model.js': '67aff2c0f61f2d6830284ab7820c790ae5d16f1fc39bb431c38f384956571764',
}
report = {'checkedAt': datetime.now(timezone.utc).isoformat(), 'scope': 'Data consistency and preservation through drawing changes; not a new assessment of empirical causal validity.', 'checks': [], 'fileHashes': {}, 'csvComparisons': {}, 'loops': []}

def check(name, ok, details=None):
    row = {'name': name, 'passed': bool(ok)}
    if details is not None:
        row['details'] = details
    report['checks'].append(row)

model = json.loads((ROOT/'model.json').read_text(encoding='utf-8'))
for name, expected in BASELINE.items():
    actual = hashlib.sha256((ROOT/name).read_bytes()).hexdigest()
    report['fileHashes'][name] = {'current': actual, 'recordedBeforeDrawingChanges': expected}
    check(name + ': byte-identical to pre-drawing baseline', actual == expected)
baseline_report = json.loads((ROOT/'validation.json').read_text(encoding='utf-8'))
check('Independent structural-validation record matches current model hash', baseline_report['modelSha256'] == report['fileHashes']['model.json']['current'])
wrapped = (ROOT/'model.js').read_text(encoding='utf-8').strip()
prefix = 'window.CLD_MODEL = '
assert wrapped.startswith(prefix) and wrapped.endswith(';')
browser_model = json.loads(wrapped[len(prefix):-1])
check('Browser-bundled model exactly matches canonical JSON', browser_model == model)

def cell(value):
    if value is None:
        return ''
    if isinstance(value, list):
        return ' | '.join(map(str, value))
    return str(value)

exports = [('variables.csv','nodes'), ('causal_links.csv','edges'), ('feedback_loops.csv','loops'), ('sources.csv','sources'), ('evidence_anchors.csv','anchors')]
for filename, key in exports:
    expected = {item['id']: item for item in model[key]}
    with (ROOT/filename).open(encoding='utf-8-sig', newline='') as handle:
        rows = list(csv.DictReader(handle))
    ids = [row['id'] for row in rows]
    missing = sorted(set(expected)-set(ids))
    extra = sorted(set(ids)-set(expected))
    duplicates = [i for i,count in Counter(ids).items() if count > 1]
    differences = []
    for row in rows:
        if row['id'] not in expected:
            continue
        original = expected[row['id']]
        for field, value in row.items():
            wanted = cell(original.get(field))
            if value != wanted:
                differences.append({'id': row['id'], 'field': field, 'model': wanted, 'csv': value})
    detail = {'rows': len(rows), 'missingIds': missing, 'unexpectedIds': extra, 'duplicateIds': duplicates, 'fieldDifferences': differences}
    report['csvComparisons'][filename] = detail
    check(filename + ': every exported field matches model', not (missing or extra or duplicates or differences), detail)

nodes = {n['id']: n for n in model['nodes']}
edges = {e['id']: e for e in model['edges']}
anchors = {a['id']: a for a in model['anchors']}
sources = {s['id']: s for s in model['sources']}
groups = {g['id'] for g in model['groups']}
for key in ['nodes', 'edges', 'loops', 'anchors', 'sources', 'groups']:
    ids = [r['id'] for r in model[key]]
    check(key + ': identifiers unique', len(ids) == len(set(ids)))
bad_nodes = [n['id'] for n in nodes.values() if n['group'] not in groups or not n['label'] or not n['definition']]
bad_edges = [e['id'] for e in edges.values() if e['source'] not in nodes or e['target'] not in nodes or e['source']==e['target'] or e['polarity'] not in [-1,1] or not isinstance(e.get('delay'), bool)]
pairs = [(e['source'],e['target']) for e in edges.values()]
check('All variable labels, definitions and groups valid', not bad_nodes, bad_nodes)
check('All directed links have valid distinct endpoints, signs and delay flags', not bad_edges, bad_edges)
check('No duplicated directed links', len(pairs)==len(set(pairs)))
missing_anchors = [{'edge':e['id'],'anchor':a} for e in edges.values() for a in e.get('evidence',[]) if a not in anchors]
invalid_sources = [a['id'] for a in anchors.values() if a['sourceId'] not in sources]
unsupported = [e['id'] for e in edges.values() if not e.get('evidence') and not (e['status']=='definition' and e.get('derivation'))]
check('Every evidence anchor and source reference resolves', not missing_anchors and not invalid_sources, {'missingAnchors': missing_anchors, 'invalidSources': invalid_sources})
check('Every relationship has evidence or an explicit algebraic derivation', not unsupported, unsupported)

for loop in model['loops']:
    route = [edges[e] for e in loop['edges'] if e in edges]
    closed = len(route)==len(loop['edges']) and len(route)>1 and all(e['target']==route[(i+1)%len(route)]['source'] for i,e in enumerate(route))
    negatives = sum(e['polarity'] < 0 for e in route)
    computed = 'B' if negatives%2 else 'R'
    members = [e['source'] for e in route]
    valid_members = len(members)==len(set(members)) and set(members)==set(loop['nodes']) and len(loop['nodes'])==len(members)
    detail = {'id': loop['id'], 'name': loop['name'], 'edges': loop['edges'], 'nodes': loop['nodes'], 'closed': closed, 'negativeLinks': negatives, 'declaredType': loop['type'], 'computedType': computed, 'membershipMatches': valid_members}
    report['loops'].append(detail)
    check(loop['id'] + ': closed cycle, memberships and sign parity correct', closed and valid_members and computed==loop['type'] and negatives==loop['negativeLinks'] and loop['polarityProduct']==(-1 if negatives%2 else 1), detail)

report['modelVersion'] = model['version']
report['counts'] = {'variables':len(nodes), 'links':len(edges), 'loops':len(model['loops']), 'reinforcing':sum(l['type']=='R' for l in model['loops']), 'balancing':sum(l['type']=='B' for l in model['loops']), 'sources':len(sources), 'anchors':len(anchors), 'delayedLinks':sum(e['delay'] for e in edges.values())}
report['passed'] = all(c['passed'] for c in report['checks'])
report['failedChecks'] = [c for c in report['checks'] if not c['passed']]
(ROOT/'qa/model_data_integrity.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({'passed':report['passed'], 'counts':report['counts'], 'checks':len(report['checks']), 'failedChecks':report['failedChecks']},ensure_ascii=False,indent=2))
