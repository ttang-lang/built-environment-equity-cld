"""Exercise straight-line CLD rendering and the local route editor in Chrome.

Uses actual mouse input for bend editing; no credentials or live user profile.
The semantic inspector is shared with the independent model audit.
"""
import asyncio
import base64
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
sys.path.insert(0,str(OUT))
from check_model_rendering_integrity import AUDIT_JS
from check_svg_rendering import JUNCTION_JS

MODEL=json.loads((ROOT/'model.json').read_text(encoding='utf-8'))
HASHES={name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in ['model.json','model.js']}
REPORT={'scope':'Straight-line rendering, editable presentation layout, model fidelity and SVG export; not empirical causal validation.','checks':[],'modelHashesBefore':HASHES,'screenshots':[]}

def check(name,passed,details=None):
    row={'name':name,'passed':bool(passed)}
    if details is not None:row['details']=details
    REPORT['checks'].append(row)
    if not passed:print('FAIL',name,json.dumps(details,ensure_ascii=False)[:2500],flush=True)

def good(row):
    return row['nodeIdsMatch'] and row['edgeIdsMatch'] and not row['nodeMismatches'] and not row['edgeMismatches']

def compact(row):
    return {key:value for key,value in row.items() if key!='edgeRows'}

STRAIGHT_JS=r'''(()=>{
 const paths=[...document.querySelectorAll('#graph .edge-visual')];
 return {count:paths.length,curves:paths.filter(p=>/[CQAST]/i.test(p.getAttribute('d'))).map(p=>p.closest('[data-edge]').dataset.edge),invalid:paths.filter(p=>!/^M [-+\d.eE]+ [-+\d.eE]+(?: L [-+\d.eE]+ [-+\d.eE]+)+$/.test(p.getAttribute('d'))).map(p=>p.closest('[data-edge]').dataset.edge)};
})()'''

BADGE_JS=r'''(()=>{
 const svg=document.getElementById('graph'),badge=svg.querySelector('.loop-badge');if(!badge)return [];
 const circle=badge.querySelector('circle'),caption=badge.querySelector('.loop-center-caption'),bbox=caption.getBBox(),root=svg.querySelector('#viewport'),inv=root.getCTM().inverse(),point=(el,p)=>new DOMPoint(p.x,p.y).matrixTransform(el.getCTM()).matrixTransform(inv),center=point(circle,{x:0,y:0}),a=point(caption,{x:bbox.x,y:bbox.y}),z=point(caption,{x:bbox.x+bbox.width,y:bbox.y+bbox.height}),radius=circle.r.baseVal.value+3,hits=[];
 for(const g of svg.querySelectorAll('[data-edge]')){const p=g.querySelector('.edge-visual'),length=p.getTotalLength();for(let d=0;d<=length;d+=1){const q=point(p,p.getPointAtLength(d));if(Math.hypot(q.x-center.x,q.y-center.y)<radius||(q.x>a.x-2&&q.x<z.x+2&&q.y>a.y-2&&q.y<z.y+2)){hits.push(g.dataset.edge);break;}}}
 return hits;
})()'''

class Browser:
    def __init__(self,ws):self.ws=ws;self.seq=0;self.exceptions=[]
    async def call(self,method,params=None):
        self.seq+=1;mid=self.seq
        await self.ws.send(json.dumps({'id':mid,'method':method,'params':params or {}}))
        while True:
            result=json.loads(await self.ws.recv())
            if result.get('method')=='Runtime.exceptionThrown':self.exceptions.append(result['params'])
            if result.get('id')==mid:
                if result.get('error'):raise RuntimeError(result['error'])
                return result.get('result',{})
    async def ev(self,js):
        result=await self.call('Runtime.evaluate',{'expression':js,'returnByValue':True,'awaitPromise':True})
        if result.get('exceptionDetails'):raise RuntimeError(result['exceptionDetails'])
        return result.get('result',{}).get('value')
    async def settle(self):
        await self.ev('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
        await asyncio.sleep(.1)
    async def screenshot(self,name):
        result=await self.call('Page.captureScreenshot',{'format':'png','captureBeyondViewport':False})
        (OUT/name).write_bytes(base64.b64decode(result['data']));REPORT['screenshots'].append(name)
    async def ready(self):
        for _ in range(300):
            if await self.ev('!!window.CLD_ATLAS'):break
            await asyncio.sleep(.1)
        else:raise RuntimeError('App did not load: '+json.dumps(self.exceptions))
        await self.ev('document.fonts.ready');await self.settle()
        await self.ev(AUDIT_JS.replace('MODEL_DATA',json.dumps(MODEL)))
    async def drag(self,start,end):
        await self.call('Input.dispatchMouseEvent',{'type':'mouseMoved','x':start['x'],'y':start['y']})
        await self.call('Input.dispatchMouseEvent',{'type':'mousePressed','x':start['x'],'y':start['y'],'button':'left','buttons':1,'clickCount':1})
        for step in range(1,9):
            t=step/8
            await self.call('Input.dispatchMouseEvent',{'type':'mouseMoved','x':start['x']+(end['x']-start['x'])*t,'y':start['y']+(end['y']-start['y'])*t,'button':'left','buttons':1})
        await self.call('Input.dispatchMouseEvent',{'type':'mouseReleased','x':end['x'],'y':end['y'],'button':'left','buttons':0,'clickCount':1})
        await self.settle()

async def semantic_checks(browser):
    b=browser
    ns=[n['id'] for n in MODEL['nodes']];es=[e['id'] for e in MODEL['edges']]
    await b.ev('CLD_ATLAS.overview()');await b.settle()
    report=await b.ev('__qaModelIntegrity.inspect(document.getElementById("graph"),'+json.dumps(ns)+','+json.dumps(es)+')')
    check('Overview retains35 variables,77 actual endpoints,signs,delays and evidence styles',good(report),compact(report))
    straight=await b.ev(STRAIGHT_JS)
    check('All77 overview routes contain straight line segments only',straight['count']==77 and not straight['curves'] and not straight['invalid'],straight)
    check('All six thematic regions retained',await b.ev('document.querySelectorAll("#graph .graph-group").length')==6)
    gutters=await b.ev('''(()=>{const r=Object.fromEntries([...document.querySelectorAll('#graph .graph-group')].map(g=>{const b=g.querySelector('rect').getBBox();return [g.dataset.group,{left:b.x,right:b.x+b.width,top:b.y,bottom:b.y+b.height}];}));return [r.housing.top-r.governance.bottom,r.mobility.top-r.housing.bottom,r.place.top-r.mobility.bottom,r.health.top-r.place.bottom,r.equity.left-r.housing.right,r.equity.left-r.mobility.right];})()''')
    check('All six adjacent region gutters remain96 units',all(abs(gap-96)<.01 for gap in gutters),gutters)
    junction=await b.ev(JUNCTION_JS.replace('MODEL_DATA',json.dumps(MODEL)))
    check('Automatic arrowheads are aligned and remain outside every polarity and delay label',not junction['headOverlaps'] and not junction['tailOverlaps'] and not junction['markerAlignment'] and not junction['shaftExposure'],{k:junction[k] for k in ['headOverlaps','tailOverlaps','markerAlignment','shaftExposure']})
    stats=await b.ev('CLD_ATLAS.validate()')
    check('Automatic routes avoid all variable cards and region headings',not stats['geometry']['nodeCrossings'] and not stats['geometry']['obstacleCrossings'],stats['geometry'])
    check('All10 feedback loops remain closed with original parity',all(x['closed'] and x['computedType']==x['declaredType'] for x in stats['loopChecks']),stats['loopChecks'])
    clicks=await b.ev('__qaModelIntegrity.clicks()')
    check('All77 evidence panels retain the correct sources,targets,signs,rationales and citations',not clicks['mismatches'],clicks)
    await b.ev('CLD_ATLAS.overview()');await b.settle()
    full=await b.ev('__qaModelIntegrity.freshExport(true,'+json.dumps(ns)+','+json.dumps(es)+')')
    check('Fresh full SVG retains model semantics',good(full),compact(full))
    REPORT['loops']=[]
    for loop in MODEL['loops']:
        await b.ev('CLD_ATLAS.selectLoop('+json.dumps(loop['id'])+');CLD_ATLAS.setLoopView(true)')
        live=await b.ev('__qaModelIntegrity.inspect(document.getElementById("graph"),'+json.dumps(loop['nodes'])+','+json.dumps(loop['edges'])+')')
        straight=await b.ev(STRAIGHT_JS)
        exported=await b.ev('__qaModelIntegrity.freshExport(false,'+json.dumps(loop['nodes'])+','+json.dumps(loop['edges'])+')')
        svg=await b.ev('''(()=>{const d=new DOMParser().parseFromString(CLD_ATLAS.buildExportSvg({fullSystem:false}),'image/svg+xml');return {curves:[...d.querySelectorAll('.edge-visual')].filter(p=>/[CQAST]/i.test(p.getAttribute('d'))).length,handles:d.querySelectorAll('.line-bend-handle,.line-add-handle').length};})()''')
        row={'loop':loop['id'],'live':compact(live),'export':compact(exported),'straight':straight,'svg':svg}
        REPORT['loops'].append(row)
        check(loop['id']+': live and SVG loop retain all semantics using straight segments',good(live) and good(exported) and not straight['curves'] and not straight['invalid'] and not svg['curves'] and not svg['handles'],row)
        badge_hits=await b.ev(BADGE_JS)
        check(loop['id']+': loop badge and caption do not obscure an arrow',not badge_hits,badge_hits)
    await b.ev('CLD_ATLAS.setLoopView(false);CLD_ATLAS.overview()');await b.settle()

async def editor_checks(browser):
    b=browser
    baseline=await b.ev('CLD_ATLAS.getLineLayout()')
    check('Line editing starts disabled and has no saved custom routes in a fresh profile',not await b.ev('CLD_ATLAS.getViewState().lineEditing') and not baseline['views'])
    await b.ev("document.getElementById('lineEditToggle').click();CLD_ATLAS.selectEdge('E04');if(CLD_ATLAS.getViewState().explorerOpen)document.getElementById('toggleExplorer').click();CLD_ATLAS.fitCurrent()")
    await b.settle()
    check('Edit lines toolbar opens and selected link exposes draggable bends',await b.ev("CLD_ATLAS.getViewState().lineEditing&&!document.getElementById('lineEditTools').hidden&&document.querySelectorAll('.line-bend-handle[data-edge-id=E04]').length>0"))
    original=await b.ev("document.querySelector('#graph [data-edge=E04] .edge-visual').getAttribute('d')")
    other_paths=await b.ev("Object.fromEntries([...document.querySelectorAll('#graph [data-edge]:not([data-edge=E04])')].map(g=>[g.dataset.edge,g.querySelector('.edge-visual').getAttribute('d')]))")
    async def pick_handle(kind='line-bend-handle'):
        return await b.ev('''(()=>{const r=document.getElementById('graph').getBoundingClientRect(),v=document.getElementById('viewport'),nodes=[...document.querySelectorAll('#graph [data-node] .node-box')].map(n=>{const q=n.getBoundingClientRect();return {left:q.left,right:q.right,top:q.top,bottom:q.bottom};}),items=[...document.querySelectorAll('.HANDLE')].map(h=>{const q=new DOMPoint(+h.getAttribute('cx'),+h.getAttribute('cy')).matrixTransform(h.getScreenCTM());return {x:q.x,y:q.y,index:h.getAttribute('data-waypoint-index'),insert:h.getAttribute('data-insert-index'),world:{x:+h.getAttribute('cx'),y:+h.getAttribute('cy')},clearance:Math.min(...nodes.map(n=>Math.hypot(Math.max(n.left-q.x,0,q.x-n.right),Math.max(n.top-q.y,0,q.y-n.bottom))))};}).filter(q=>q.x>r.left+25&&q.x<r.right-25&&q.y>r.top+25&&q.y<r.bottom-60);return items.sort((a,b)=>b.clearance-a.clearance)[0]||null;})()'''.replace('HANDLE',kind))
    handle=await pick_handle()
    if not handle:raise RuntimeError('No accessible E04 bend handle')
    oldscale=await b.ev('CLD_ATLAS.getViewState().scale')
    import math
    await b.call('Input.dispatchMouseEvent',{'type':'mouseWheel','x':handle['x'],'y':handle['y'],'deltaX':0,'deltaY':-math.log(1/oldscale)/.0015})
    await b.settle()
    handle=await b.ev('''(()=>{const h=document.querySelector('.line-bend-handle[data-waypoint-index="'''+str(handle['index'])+'''"]'),p=new DOMPoint(+h.getAttribute('cx'),+h.getAttribute('cy')).matrixTransform(h.getScreenCTM());return {x:p.x,y:p.y,index:h.getAttribute('data-waypoint-index')};})()''')
    before_scale=await b.ev('CLD_ATLAS.getViewState().scale')
    before_transform=await b.ev("document.getElementById('viewport').getAttribute('transform')")
    await b.drag(handle,{'x':handle['x']-28,'y':handle['y']+16})
    changed=await b.ev("document.querySelector('#graph [data-edge=E04] .edge-visual').getAttribute('d')")
    layout=await b.ev('CLD_ATLAS.getLineLayout()')
    check('Real pointer drag at100% changes selected line without panning the map',abs(before_scale-1)<.01 and changed!=original and bool(layout['views'].get('overview',{}).get('E04')) and await b.ev("document.getElementById('viewport').getAttribute('transform')")==before_transform,{'scale':before_scale,'handle':handle,'changed':changed!=original})
    check('Dragging one line does not change other line paths',await b.ev("Object.fromEntries([...document.querySelectorAll('#graph [data-edge]:not([data-edge=E04])')].map(g=>[g.dataset.edge,g.querySelector('.edge-visual').getAttribute('d')]))")==other_paths)
    await b.ev("document.getElementById('lineUndo').click()")
    check('Undo restores exact automatic route',await b.ev("document.querySelector('#graph [data-edge=E04] .edge-visual').getAttribute('d')")==original)
    await b.ev("document.getElementById('lineRedo').click()")
    check('Redo restores exact manually edited route',await b.ev("document.querySelector('#graph [data-edge=E04] .edge-visual').getAttribute('d')")==changed)
    await b.call('Input.dispatchMouseEvent',{'type':'mouseWheel','x':handle['x'],'y':handle['y'],'deltaX':0,'deltaY':-math.log(1.75)/.0015})
    await b.settle()
    handle=await pick_handle()
    if not handle:raise RuntimeError('No bend handle visible after zoom')
    before=await b.ev('CLD_ATLAS.getLineLayout()');before_transform=await b.ev("document.getElementById('viewport').getAttribute('transform')")
    await b.drag(handle,{'x':handle['x']-21,'y':handle['y']+21})
    layout=await b.ev('CLD_ATLAS.getLineLayout()');changed=await b.ev("document.querySelector('#graph [data-edge=E04] .edge-visual').getAttribute('d')")
    check('Real bend dragging also works at175% with correct world coordinates',layout!=before and abs(await b.ev('CLD_ATLAS.getViewState().scale')-1.75)<.01 and await b.ev("document.getElementById('viewport').getAttribute('transform')")==before_transform)
    await b.screenshot('line_editor_detail_175.png')
    await b.ev('CLD_ATLAS.fitCurrent()');await b.settle()
    add=await pick_handle('line-add-handle')
    if add:
        before_count=len(layout['views']['overview']['E04'])
        await b.drag(add,{'x':add['x']-12,'y':add['y']+12})
        inserted=await b.ev('CLD_ATLAS.getLineLayout()')
        check('Dragging a hollow midpoint adds a new bend',len(inserted['views']['overview']['E04'])==before_count+1)
        await b.ev('CLD_ATLAS.undoLineEdit()')
        check('Added bend is undoable',await b.ev('CLD_ATLAS.getLineLayout()')==layout)
    else:check('A segment midpoint is available for insertion',False)
    await b.screenshot('line_editor_active.png')
    keyboard_handle=await pick_handle()
    if keyboard_handle:
        await b.drag(keyboard_handle,keyboard_handle)
        prior=await b.ev('CLD_ATLAS.getLineLayout()');prior_transform=await b.ev("document.getElementById('viewport').getAttribute('transform')")
        await b.call('Input.dispatchKeyEvent',{'type':'keyDown','key':'ArrowRight','code':'ArrowRight','windowsVirtualKeyCode':39})
        await b.call('Input.dispatchKeyEvent',{'type':'keyUp','key':'ArrowRight','code':'ArrowRight','windowsVirtualKeyCode':39})
        moved=await b.ev('CLD_ATLAS.getLineLayout()');idx=int(keyboard_handle['index'])
        check('Clicked bend receives keyboard focus and arrow keys move it without panning',moved['views']['overview']['E04'][idx]['x']==prior['views']['overview']['E04'][idx]['x']+4 and await b.ev("document.getElementById('viewport').getAttribute('transform')")==prior_transform)
        await b.ev('CLD_ATLAS.undoLineEdit()')
        keyboard_handle=await pick_handle();await b.drag(keyboard_handle,keyboard_handle)
        prior=await b.ev('CLD_ATLAS.getLineLayout()')
        await b.call('Input.dispatchKeyEvent',{'type':'keyDown','key':'Delete','code':'Delete','windowsVirtualKeyCode':46})
        await b.call('Input.dispatchKeyEvent',{'type':'keyUp','key':'Delete','code':'Delete','windowsVirtualKeyCode':46})
        deleted=await b.ev('CLD_ATLAS.getLineLayout()')
        check('Click then Delete removes a bend and supports Undo',len(deleted['views']['overview']['E04'])==len(prior['views']['overview']['E04'])-1)
        await b.ev('CLD_ATLAS.undoLineEdit()')
        check('Undo deletion restores saved route exactly',await b.ev('CLD_ATLAS.getLineLayout()')==layout)
    else:check('A bend is available for keyboard editing',False)
    ns=[n['id'] for n in MODEL['nodes']];es=[e['id'] for e in MODEL['edges']]
    live=await b.ev('__qaModelIntegrity.inspect(document.getElementById("graph"),'+json.dumps(ns)+','+json.dumps(es)+')')
    check('Manual route keeps original variables,arrow direction,polarity and delay',good(live),compact(live))
    export=await b.ev('''(()=>{const xml=CLD_ATLAS.buildExportSvg({fullSystem:true}),d=new DOMParser().parseFromString(xml,'image/svg+xml');return {source:xml,path:d.querySelector('[data-edge=E04] .edge-visual').getAttribute('d'),handles:d.querySelectorAll('[data-line-editor],.line-bend-handle,.line-add-handle').length,curves:[...d.querySelectorAll('.edge-visual')].filter(p=>/[CQAST]/i.test(p.getAttribute('d'))).length};})()''')
    (OUT/'straight_edited_system.svg').write_text(export.pop('source'),encoding='utf-8')
    check('SVG includes manually adjusted route without handles or curves',export['path']==changed and export['handles']==0 and export['curves']==0,export)
    saved_dir=Path(tempfile.mkdtemp(prefix='cld-layout-download-'))
    await b.call('Browser.setDownloadBehavior',{'behavior':'allow','downloadPath':str(saved_dir),'eventsEnabled':True})
    await b.ev("document.getElementById('lineSave').click()")
    saved_path=saved_dir/'built-environment-equity-line-layout.json'
    for _ in range(60):
        if saved_path.exists():break
        await asyncio.sleep(.1)
    check('Save layout downloads a portable JSON with exact edits',saved_path.exists() and json.loads(saved_path.read_text(encoding='utf-8'))==layout)
    await b.ev("document.getElementById('lineReset').click()")
    check('Reset link restores automatic route',await b.ev("document.querySelector('#graph [data-edge=E04] .edge-visual').getAttribute('d')")==original)
    doc=await b.call('DOM.getDocument');file_input=await b.call('DOM.querySelector',{'nodeId':doc['root']['nodeId'],'selector':'#lineLayoutFile'})
    await b.call('DOM.setFileInputFiles',{'nodeId':file_input['nodeId'],'files':[str(saved_path)]})
    await b.settle()
    check('Load layout restores the downloaded route',await b.ev('CLD_ATLAS.getLineLayout()')==layout and await b.ev("document.querySelector('#graph [data-edge=E04] .edge-visual').getAttribute('d')")==changed)
    rejected=await b.ev('''(()=>{const before=JSON.stringify(CLD_ATLAS.getLineLayout()),bad=CLD_ATLAS.getLineLayout();bad.views.overview.UNKNOWN=[{x:1,y:1}];let rejected=false;try{CLD_ATLAS.importLineLayout(bad);}catch{rejected=true;}return rejected&&before===JSON.stringify(CLD_ATLAS.getLineLayout());})()''')
    check('Unknown-link layout is rejected without changing existing edits',rejected)
    await b.call('Page.reload',{'ignoreCache':True});await asyncio.sleep(.2);await b.ready()
    await b.ev("CLD_ATLAS.overview();CLD_ATLAS.selectEdge('E04')");await b.settle()
    check('Local browser edits survive a page reload',await b.ev('CLD_ATLAS.getLineLayout()')==layout and await b.ev("document.querySelector('#graph [data-edge=E04] .edge-visual').getAttribute('d')")==changed)
    await b.ev("CLD_ATLAS.selectLoop('R2');CLD_ATLAS.setLoopView(true);CLD_ATLAS.setLineEditing(true)")
    loop_edge=next(loop for loop in MODEL['loops'] if loop['id']=='R2')['edges'][0]
    await b.ev('CLD_ATLAS.selectEdge('+json.dumps(loop_edge)+');CLD_ATLAS.fitCurrent()');await b.settle()
    handle=await pick_handle() or await pick_handle('line-add-handle')
    if handle:
        await b.drag(handle,{'x':handle['x']+16,'y':handle['y']-12})
        loop_layout=await b.ev('CLD_ATLAS.getLineLayout()')
        check('Isolated loop and full-system edits are stored separately',loop_layout['views'].get('overview')==layout['views']['overview'] and loop_edge in loop_layout['views'].get('loop:R2',{}))
        badge_hits=await b.ev(BADGE_JS)
        check('Edited two-node loop keeps badge clear of its arrows',not badge_hits,badge_hits)
        await b.screenshot('line_editor_loop_r2.png')
    else:check('Isolated loop provides editable bend or midpoint handles',False,await b.ev("({bends:document.querySelectorAll('.line-bend-handle').length,midpoints:document.querySelectorAll('.line-add-handle').length,state:CLD_ATLAS.getViewState()})"))
    await b.ev('CLD_ATLAS.setLineEditing(false);CLD_ATLAS.setLoopView(false);CLD_ATLAS.overview()');await b.settle()
    check('Finishing editing hides all editing handles',await b.ev("document.querySelectorAll('.line-bend-handle,.line-add-handle').length")==0)
    await b.ev("CLD_ATLAS.selectEdge('E04')")
    check('Evidence details remain available after editing',await b.ev("document.getElementById('inspectorContent').innerText.includes('E04')&&CLD_ATLAS.getViewState().inspectorOpen"))

async def capture_default_export(b):
    source=await b.ev('CLD_ATLAS.buildExportSvg({fullSystem:true})')
    export_path=OUT/'straight_full_system.svg';export_path.write_text(source,encoding='utf-8')
    await b.call('Page.navigate',{'url':export_path.as_uri()})
    for _ in range(100):
        if await b.ev("document.documentElement.tagName.toLowerCase()==='svg'"):break
        await asyncio.sleep(.1)
    await b.ev('document.fonts.ready')
    size=await b.ev('({width:document.documentElement.width.baseVal.value,height:document.documentElement.height.baseVal.value})')
    await b.call('Emulation.setDeviceMetricsOverride',{'width':int(size['width']),'height':int(size['height']),'deviceScaleFactor':1,'mobile':False})
    await b.settle();await b.screenshot('straight_full_system.png')
    crop=await b.ev('''(()=>{const s=document.documentElement,g=s.querySelector('[data-export-diagram]'),v=s.viewBox.baseVal,b=g.getBBox(),t=g.transform.baseVal.consolidate().matrix,clipped=[];for(const el of s.querySelectorAll('text')){if(el.closest('defs'))continue;const r=el.getBoundingClientRect(),sr=s.getBoundingClientRect();if(r.x<sr.x-.5||r.y<sr.y-.5||r.right>sr.right+.5||r.bottom>sr.bottom+.5)clipped.push(el.textContent);}return {left:b.x+t.e,right:v.width-b.x-t.e-b.width,clippedText:clipped,width:v.width,height:v.height};})()''')
    check('Standalone full SVG has tight20-unit side margins and no clipped text',18<=crop['left']<=22 and 18<=crop['right']<=22 and not crop['clippedText'],crop)
    REPORT['exportSize']=size
    await b.call('Emulation.setDeviceMetricsOverride',{'width':1680,'height':1050,'deviceScaleFactor':1,'mobile':False})
    await b.call('Page.navigate',{'url':(ROOT/'index.html').as_uri()});await b.ready()

async def run(port):
    for _ in range(80):
        try:target=next(t for t in requests.get(f'http://127.0.0.1:{port}/json',timeout=1).json() if t['type']=='page');break
        except (requests.RequestException,StopIteration):await asyncio.sleep(.2)
    else:raise RuntimeError('Chrome did not start')
    async with websockets.connect(target['webSocketDebuggerUrl'],max_size=50_000_000) as ws:
        b=Browser(ws)
        await b.call('Page.enable');await b.call('Runtime.enable')
        await b.call('Emulation.setDeviceMetricsOverride',{'width':1680,'height':1050,'deviceScaleFactor':1,'mobile':False})
        await b.call('Page.navigate',{'url':(ROOT/'index.html').as_uri()})
        await b.ready()
        check('Runtime model matches canonical model before edits',await b.ev('CLD_MODEL')==MODEL)
        await semantic_checks(b)
        await capture_default_export(b)
        await editor_checks(b)
        check('Runtime model matches canonical model after edits',await b.ev('CLD_MODEL')==MODEL)
        check('No JavaScript runtime exceptions',not b.exceptions,b.exceptions)
        await b.call('Browser.close')

def main():
    with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
    profile=Path(tempfile.mkdtemp(prefix='cld-line-editor-qa-'))
    browser=subprocess.Popen([os.environ.get('CLD_CHROME',r'C:\Program Files\Google\Chrome\Application\chrome.exe'),'--headless=new','--no-sandbox','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-allow-origins=*',f'--remote-debugging-port={port}',f'--user-data-dir={profile}','about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
    try:asyncio.run(run(port))
    except Exception as exc:check('Line editor audit completed',False,repr(exc))
    finally:
        if browser.poll() is None:
            browser.terminate()
            try:browser.wait(timeout=5)
            except subprocess.TimeoutExpired:browser.kill()
        REPORT['modelHashesAfter']={name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in HASHES}
        REPORT['sourceHashes']={name:hashlib.sha256((ROOT/name).read_bytes()).hexdigest() for name in ['app.js','graph_geometry.js','line_editor.js','line_editor.css','index.html','presentation.css','app.css']}
        check('Both model source files remain byte-identical',REPORT['modelHashesAfter']==HASHES)
        REPORT['passed']=all(row['passed'] for row in REPORT['checks'])
        REPORT['failedChecks']=[row['name'] for row in REPORT['checks'] if not row['passed']]
        (OUT/'line_editor_validation.json').write_text(json.dumps(REPORT,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print(json.dumps({'passed':REPORT['passed'],'checks':len(REPORT['checks']),'failedChecks':REPORT['failedChecks'],'report':str(OUT/'line_editor_validation.json')},indent=2))
    return 0 if REPORT['passed'] else 1

if __name__=='__main__':raise SystemExit(main())
