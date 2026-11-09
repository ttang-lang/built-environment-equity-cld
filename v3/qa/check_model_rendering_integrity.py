"""Audit model-to-rendering fidelity in live Chrome and fresh SVG exports.

This checks whether presentation changes altered the displayed model. It does
not establish whether the literature supports its causal assumptions.
"""
import asyncio
import hashlib
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile

import requests
import websockets

sys.stdout.reconfigure(encoding='utf-8')
OUT=Path(__file__).resolve().parent
ROOT=OUT.parent
MODEL_BYTES=(ROOT/'model.json').read_bytes()
MODEL=json.loads(MODEL_BYTES.decode('utf-8'))
FILES=['model.json','model.js']
HASHES={name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in FILES}
REPORT={'scope':'Rendering fidelity to the current model; not new scientific or causal validation.',
        'modelVersion':MODEL['version'],'modelHashesBefore':HASHES,'checks':[],
        'overview':{},'clickEvidence':{},'loops':[],'exports':[]}

def check(name,passed,details=None):
    row={'name':name,'passed':bool(passed)}
    if details is not None:row['details']=details
    REPORT['checks'].append(row)
    if not passed:print('MISMATCH',name,json.dumps(details,ensure_ascii=False)[:3000],flush=True)


AUDIT_JS=r'''(()=>{
 const model=MODEL_DATA,nodes=new Map(model.nodes.map(n=>[n.id,n])),edges=new Map(model.edges.map(e=>[e.id,e]));
 const norm=s=>String(s??'').replace(/\s+/g,' ').trim();
 const same=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
 const sorted=a=>[...a].sort();
 const polarity=e=>Number(e.polarity)<0?'−':'+';
 function inspect(svg,nodeIds,edgeIds){
  const space=svg.querySelector('#viewport')||svg.querySelector('[data-export-diagram]')||svg,inv=space.getCTM().inverse();
  const pt=(el,p)=>new DOMPoint(p.x,p.y).matrixTransform(el.getCTM()).matrixTransform(inv);
  const boxes=[...svg.querySelectorAll('[data-node]')].map(g=>{const el=g.querySelector('.node-box'),b=el.getBBox(),a=pt(el,{x:b.x,y:b.y}),z=pt(el,{x:b.x+b.width,y:b.y+b.height});return {id:g.dataset.node,left:a.x,top:a.y,right:z.x,bottom:z.y,g};});
  const nearestPoint=(p,b)=>({x:Math.max(b.left,Math.min(b.right,p.x)),y:Math.max(b.top,Math.min(b.bottom,p.y))});
  const distance=(p,b)=>{const q=nearestPoint(p,b);return Math.hypot(q.x-p.x,q.y-p.y);};
  const nearest=p=>boxes.map(b=>({id:b.id,gap:distance(p,b)})).sort((a,b)=>a.gap-b.gap)[0];
  const regions=[...svg.querySelectorAll('.graph-group')].map(g=>{const el=g.querySelector('.group-background'),b=el.getBBox(),a=pt(el,{x:b.x,y:b.y}),z=pt(el,{x:b.x+b.width,y:b.y+b.height});return {id:g.dataset.group,left:a.x,top:a.y,right:z.x,bottom:z.y};});
  const actualNodeIds=boxes.map(b=>b.id),actualEdgeIds=[...svg.querySelectorAll('[data-edge]')].map(g=>g.dataset.edge),nodeMismatches=[],edgeMismatches=[],edgeRows=[];
  for(const b of boxes){const n=nodes.get(b.id),issues=[];if(!n){nodeMismatches.push({id:b.id,issues:['Unexpected node ID']});continue;}
   const label=norm([...b.g.querySelectorAll('.node-label tspan')].map(t=>t.textContent).join(' ')),renderedId=norm(b.g.querySelector('.node-id')?.textContent);
   if(label!==norm(n.label))issues.push('Label differs from model');if(/[\u3400-\u9fff]/.test(label))issues.push('Non-English CJK label');if(renderedId!==n.id)issues.push('Printed node ID differs');
   const region=regions.filter(r=>(b.left+b.right)/2>=r.left&&(b.left+b.right)/2<=r.right&&(b.top+b.bottom)/2>=r.top&&(b.top+b.bottom)/2<=r.bottom).map(r=>r.id);
   if(regions.length&&!same(region,[n.group]))issues.push('Wrong thematic region');
   const group=model.groups.find(g=>g.id===n.group),rgb=getComputedStyle(b.g.querySelector('.node-stripe')).fill.match(/[\d.]+/g)?.slice(0,3).map(Number),hex=group.color.replace('#',''),expectedRgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));
   if(!rgb||!same(rgb,expectedRgb))issues.push('Wrong thematic stripe color');
   if(issues.length)nodeMismatches.push({id:n.id,expectedLabel:n.label,renderedLabel:label,expectedGroup:n.group,renderedRegions:region,issues});
  }
  for(const g of svg.querySelectorAll('[data-edge]')){const id=g.dataset.edge,e=edges.get(id),issues=[];if(!e){edgeMismatches.push({id,issues:['Unexpected edge ID']});continue;}
   const p=g.querySelector('.edge-visual'),length=p.getTotalLength(),startLocal=p.getPointAtLength(0),end=p.getPointAtLength(length),before=p.getPointAtLength(Math.max(0,length-.1)),d={x:end.x-before.x,y:end.y-before.y},dn=Math.hypot(d.x,d.y),t={x:d.x/dn,y:d.y/dn};
   const markerId=p.getAttribute('marker-end')?.match(/#([^)'"\s]+)/)?.[1],marker=svg.querySelector('#'+markerId);
   if(!marker){edgeMismatches.push({id,issues:['Missing marker']});continue;}
   if(marker.getAttribute('orient')!=='auto')issues.push('Marker does not follow the actual path direction');
   const mb=marker.querySelector('path').getBBox(),unit=marker.getAttribute('markerUnits')==='strokeWidth'?parseFloat(getComputedStyle(p).strokeWidth):1,forward=(mb.x+mb.width-marker.refX.baseVal.value)*unit,side=(mb.y+mb.height/2-marker.refY.baseVal.value)*unit;
   const start=pt(p,startLocal),tip=pt(p,{x:end.x+t.x*forward-t.y*side,y:end.y+t.y*forward+t.x*side}),rootEnd=pt(p,end),actualSource=nearest(start),actualTarget=nearest(tip),targetBox=boxes.find(b=>b.id===e.target),targetPoint=nearestPoint(tip,targetBox),approach={x:tip.x-rootEnd.x,y:tip.y-rootEnd.y},toTarget={x:targetPoint.x-tip.x,y:targetPoint.y-tip.y},approachCos=(approach.x*toTarget.x+approach.y*toTarget.y)/(Math.hypot(approach.x,approach.y)*Math.hypot(toTarget.x,toTarget.y));
   if(actualSource.id!==e.source)issues.push('Actual start is closest to wrong source card');if(actualSource.gap>6)issues.push('Source endpoint detached');
   const an=Math.hypot(approach.x,approach.y),ray={x:approach.x/an,y:approach.y/an};let entry=0,exit=12;
   for(const [axis,lower,upper]of [['x','left','right'],['y','top','bottom']]){if(Math.abs(ray[axis])<1e-8){if(tip[axis]<targetBox[lower]||tip[axis]>targetBox[upper])exit=-1;}else{const a=(targetBox[lower]-tip[axis])/ray[axis],b=(targetBox[upper]-tip[axis])/ray[axis];entry=Math.max(entry,Math.min(a,b));exit=Math.min(exit,Math.max(a,b));}}
   const tipRayEntersTarget=entry<=exit&&exit>=0&&entry<12;
   if(actualTarget.id!==e.target)issues.push('Projected marker tip is closest to wrong target card');if(actualTarget.gap>1.1)issues.push('Target endpoint detached');if(!Number.isFinite(approachCos)||approachCos<=0||!tipRayEntersTarget)issues.push('Arrowhead forward ray misses target');
   const sign=norm(g.querySelector('.edge-sign')?.textContent),delay=g.querySelectorAll('.edge-delay').length,delayText=norm(g.querySelector('.edge-delay')?.textContent),dash=getComputedStyle(p).strokeDasharray,dashes=dash==='none'?[]:dash.split(/[ ,]+/).map(parseFloat),wanted=e.status==='reported'?[]:e.status==='indicator'?[2,6]:[7,5];
   if(sign!==polarity(e))issues.push('Wrong rendered polarity');if(delay!==(e.delay?1:0)||(e.delay&&delayText!=='∥'))issues.push('Wrong delay notation');if(!same(dashes,wanted))issues.push('Line style differs from evidence status');
   const badgeOffsets=[];for(const c of g.querySelectorAll('.polarity-bg')){const q=new DOMPoint(c.cx.baseVal.value,c.cy.baseVal.value).matrixTransform(c.getCTM()).matrixTransform(p.getCTM().inverse());let best=Infinity,at=0;for(let s=0;s<=length;s+=5){const a=p.getPointAtLength(s),d=Math.hypot(a.x-q.x,a.y-q.y);if(d<best){best=d;at=s;}}for(let s=Math.max(0,at-6);s<=Math.min(length,at+6);s+=.2){const a=p.getPointAtLength(s);best=Math.min(best,Math.hypot(a.x-q.x,a.y-q.y));}const kind=c.classList.contains('delay-bg')?'delay':'polarity';badgeOffsets.push({kind,distance:+best.toFixed(4)});if(best>1)issues.push(kind+' badge is off its own arrow curve');}
   const row={id,expectedSource:e.source,actualSource:actualSource.id,sourceGap:+actualSource.gap.toFixed(4),expectedTarget:e.target,actualTarget:actualTarget.id,targetGap:+actualTarget.gap.toFixed(4),approachCos:+approachCos.toFixed(5),tipRayEntersTarget,sign,delay:!!delay,status:e.status,lineStyle:dash,badgeOffsets};
   edgeRows.push(row);if(issues.length)edgeMismatches.push({...row,issues});
  }
  const loopBadges=[...svg.querySelectorAll('[data-loop]')].map(g=>({id:g.dataset.loop,label:norm(g.querySelector('text')?.textContent),type:norm(g.querySelector('.loop-center-caption')?.textContent)}));
  return {nodeCount:actualNodeIds.length,edgeCount:actualEdgeIds.length,nodeIdsMatch:same(sorted(actualNodeIds),sorted(nodeIds)),edgeIdsMatch:same(sorted(actualEdgeIds),sorted(edgeIds)),nodeMismatches,edgeMismatches,edgeRows,loopBadges};
 }
 function freshExport(full,nodeIds,edgeIds){
  const source=CLD_ATLAS.buildExportSvg({fullSystem:full}),doc=new DOMParser().parseFromString(source,'image/svg+xml');if(doc.querySelector('parsererror'))throw new Error('Export XML invalid');
  const host=document.createElement('div');host.style.cssText='position:fixed;left:-30000px;top:0;visibility:hidden;pointer-events:none';document.body.append(host);host.append(doc.documentElement);
  try{return inspect(host.querySelector('svg'),nodeIds,edgeIds);}finally{host.remove();}
 }
 function clicks(){
  CLD_ATLAS.overview();const mismatches=[];
  for(const e of model.edges){const g=document.querySelector('#graph [data-edge="'+e.id+'"]');g.dispatchEvent(new MouseEvent('click',{bubbles:true}));const p=document.getElementById('inspectorContent'),issues=[],state=CLD_ATLAS.getViewState(),heading=norm(p.querySelector('.detail-edge-heading')?.textContent),ids=[...p.querySelectorAll('[data-select-node]')].map(el=>el.dataset.selectNode),lead=norm(p.querySelector('.lead')?.textContent),cards=[...p.querySelectorAll('.evidence-card')],anchorIds=cards.map(c=>norm(c.querySelectorAll('.evidence-top span')[1]?.textContent));
   if(state.selectedType!=='edge'||state.selectedId!==e.id||!norm(p.querySelector('.detail-kicker')?.textContent).includes(e.id))issues.push('Click selects wrong edge');
   if(!same(ids,[e.source,e.target])||!heading.includes(nodes.get(e.source).label)||!heading.includes(nodes.get(e.target).label))issues.push('Inspector source/target mismatch');
   if(norm(p.querySelector('.detail-edge-heading .sign')?.textContent)!==polarity(e))issues.push('Inspector polarity mismatch');
   if(lead!==norm(e.rationale||e.explanation||''))issues.push('Inspector rationale mismatch');
   if(!same(sorted(anchorIds),sorted([...new Set(e.evidence||[])])))issues.push('Evidence anchor IDs mismatch');
   for(const c of cards){const spans=c.querySelectorAll('.evidence-top span'),id=norm(spans[1]?.textContent),a=model.anchors.find(a=>a.id===id);if(!a||norm(spans[0]?.textContent)!==a.sourceId||norm(spans[2]?.textContent)!==norm(a.locator||'')||norm(c.querySelector('p')?.textContent)!==norm(a.paraphrase||a.text||a.excerpt||''))issues.push('Evidence content/locator mismatch: '+id);}
   if(e.derivation&&!norm(p.textContent).includes(norm(e.derivation)))issues.push('Definitional derivation missing');
   if(issues.length)mismatches.push({id:e.id,expectedSource:e.source,expectedTarget:e.target,actualNodeButtons:ids,expectedAnchors:e.evidence||[],actualAnchors:anchorIds,issues});
  }
  return {edgesClicked:model.edges.length,mismatches};
 }
 window.__qaModelIntegrity={inspect,freshExport,clicks};return true;
})()'''


async def run(port):
    for _ in range(80):
        try:
            target=next(t for t in requests.get(f'http://127.0.0.1:{port}/json',timeout=1).json() if t['type']=='page');break
        except (requests.RequestException,StopIteration):await asyncio.sleep(.2)
    else:raise RuntimeError('Chrome did not start')
    async with websockets.connect(target['webSocketDebuggerUrl'],max_size=40_000_000) as ws:
        seq=0;exceptions=[]
        async def call(method,params=None):
            nonlocal seq
            seq+=1;mid=seq
            await ws.send(json.dumps({'id':mid,'method':method,'params':params or {}}))
            while True:
                r=json.loads(await ws.recv())
                if r.get('method')=='Runtime.exceptionThrown':exceptions.append(r['params'])
                if r.get('id')==mid:
                    if r.get('error'):raise RuntimeError(r['error'])
                    return r.get('result',{})
        async def ev(js):
            r=await call('Runtime.evaluate',{'expression':js,'returnByValue':True,'awaitPromise':True})
            if r.get('exceptionDetails'):raise RuntimeError(r['exceptionDetails'])
            return r.get('result',{}).get('value')
        def good(r):return r['nodeIdsMatch'] and r['edgeIdsMatch'] and not r['nodeMismatches'] and not r['edgeMismatches']
        def compact(r):return {k:v for k,v in r.items() if k!='edgeRows'}
        async def inspect_live(ns,es):return await ev('__qaModelIntegrity.inspect(document.getElementById("graph"),'+json.dumps(ns)+','+json.dumps(es)+')')
        async def inspect_export(full,ns,es):return await ev('__qaModelIntegrity.freshExport('+str(full).lower()+','+json.dumps(ns)+','+json.dumps(es)+')')

        await call('Page.enable');await call('Runtime.enable')
        await call('Emulation.setDeviceMetricsOverride',{'width':1680,'height':1050,'deviceScaleFactor':1,'mobile':False})
        await call('Page.navigate',{'url':(ROOT/'index.html').as_uri()})
        for _ in range(300):
            if await ev('!!window.CLD_ATLAS'):break
            await asyncio.sleep(.1)
        else:raise RuntimeError('App not ready: '+json.dumps(exceptions))
        await ev('document.fonts.ready');await asyncio.sleep(.15)
        check('Runtime model equals model.json before audit',await ev('CLD_MODEL')==MODEL)
        await ev(AUDIT_JS.replace('MODEL_DATA',json.dumps(MODEL)))
        all_nodes=[n['id'] for n in MODEL['nodes']];all_edges=[e['id'] for e in MODEL['edges']]
        await ev('CLD_ATLAS.overview()')
        REPORT['overview']=await inspect_live(all_nodes,all_edges)
        check('Overview nodes, actual endpoints, arrow directions, signs, delays and styles match model',good(REPORT['overview']),compact(REPORT['overview']))
        REPORT['clickEvidence']=await ev('__qaModelIntegrity.clicks()')
        check('All77 arrow clicks show the correct variables, polarity, rationale and evidence',not REPORT['clickEvidence']['mismatches'],REPORT['clickEvidence'])
        await ev('CLD_ATLAS.overview()')
        full=await inspect_export(True,all_nodes,all_edges)
        REPORT['exports'].append({'id':'full-system',**compact(full)})
        check('Fresh full-system SVG preserves all model semantics',good(full),compact(full))
        edge_map={e['id']:e for e in MODEL['edges']}
        for loop in MODEL['loops']:
            await ev('CLD_ATLAS.setLoopView(false);CLD_ATLAS.selectLoop('+json.dumps(loop['id'])+')')
            row={'id':loop['id'],'declaredType':loop['type']}
            row['overviewMembership']=await ev("""(()=>{const s=document.getElementById('graph'),p=document.getElementById('inspectorContent');return {nodes:[...s.querySelectorAll('[data-node]:not(.dimmed)')].map(x=>x.dataset.node),edges:[...s.querySelectorAll('[data-edge]:not(.dimmed)')].map(x=>x.dataset.edge),path:[...p.querySelectorAll('.path-step [data-select-edge]')].map(x=>x.dataset.selectEdge),parityText:p.querySelector('.parity-box')?.textContent};})()""")
            es=[edge_map[eid] for eid in loop['edges']]
            row['closed']=all(e['target']==es[(i+1)%len(es)]['source'] for i,e in enumerate(es))
            row['negativeLinks']=sum(e['polarity']<0 for e in es)
            row['computedType']='B' if row['negativeLinks']%2 else 'R'
            context=row['overviewMembership']
            membership_ok=set(context['nodes'])==set(loop['nodes']) and set(context['edges'])==set(loop['edges']) and context['path']==loop['edges']
            parity_text=context['parityText'] or ''
            displayed_parity=f"{row['negativeLinks']} negative" in parity_text and ('product −' if row['computedType']=='B' else 'product +') in parity_text and ('balancing' if row['computedType']=='B' else 'reinforcing') in parity_text and 'The path closes' in parity_text
            check(loop['id']+': grouped loop membership, ordered path and parity match model',membership_ok and row['closed'] and row['computedType']==loop['type'] and displayed_parity,row)
            await ev('CLD_ATLAS.setLoopView(true)')
            isolated=await inspect_live(loop['nodes'],loop['edges']);row['isolated']=compact(isolated)
            actual_negatives=sum(e['sign']=='−' for e in isolated['edgeRows'])
            row['renderedType']='B' if actual_negatives%2 else 'R'
            expected_badges=[{'id':loop['id'],'label':loop['id'],'type':'Balancing' if loop['type']=='B' else 'Reinforcing'}]
            check(loop['id']+': isolated loop endpoints, polarity and membership match model',good(isolated) and row['renderedType']==loop['type'] and isolated['loopBadges']==expected_badges,compact(isolated))
            exported=await inspect_export(False,loop['nodes'],loop['edges'])
            REPORT['exports'].append({'id':loop['id'],**compact(exported)})
            check(loop['id']+': fresh loop SVG preserves model semantics',good(exported) and exported['loopBadges']==expected_badges,compact(exported))
            REPORT['loops'].append(row)
        check('No JavaScript exceptions during semantic audit',not exceptions,exceptions)
        check('Runtime model remains unchanged after all rendering and clicks',await ev('CLD_MODEL')==MODEL)
        await call('Browser.close')


def main():
    with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
    profile=Path(tempfile.mkdtemp(prefix='cld-integrity-qa-'))
    browser=subprocess.Popen([os.environ.get('CLD_CHROME',r'C:\Program Files\Google\Chrome\Application\chrome.exe'),'--headless=new','--no-sandbox','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-allow-origins=*',f'--remote-debugging-port={port}',f'--user-data-dir={profile}','about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
    try:asyncio.run(run(port))
    except Exception as exc:check('Semantic audit completed',False,repr(exc))
    finally:
        if browser.poll() is None:
            browser.terminate()
            try:browser.wait(timeout=5)
            except subprocess.TimeoutExpired:browser.kill()
        REPORT['modelHashesAfter']={name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in FILES}
        check('Both model source files unchanged by audit',REPORT['modelHashesAfter']==HASHES)
        REPORT['passed']=all(row['passed'] for row in REPORT['checks'])
        REPORT['failedChecks']=[row['name'] for row in REPORT['checks'] if not row['passed']]
        (OUT/'model_rendering_integrity.json').write_text(json.dumps(REPORT,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print(json.dumps({'passed':REPORT['passed'],'checks':len(REPORT['checks']),'failedChecks':REPORT['failedChecks'],'report':str(OUT/'model_rendering_integrity.json')},indent=2))
    return 0 if REPORT['passed'] else 1


if __name__=='__main__':raise SystemExit(main())
