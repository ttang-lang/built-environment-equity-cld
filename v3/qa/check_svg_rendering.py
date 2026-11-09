"""Render standalone SVG exports and inspect crop, fonts and arrow junctions.

The exported documents are loaded in Chrome, not merely parsed as XML. Native
100% and 200% SVG sizes are captured around real arrow endpoints. These checks
complement check_presentation.py; they are not empirical causal validation.
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
MODEL=json.loads((ROOT/'model.json').read_text(encoding='utf-8'))
REPORT={'checks':[],'documents':{},'screenshots':[],
        'modelSha256':hashlib.sha256((ROOT/'model.json').read_bytes()).hexdigest(),
        'method':'Actual standalone SVG rendered in Chrome at native100% and200%; diagram bounds, node fonts, marker placement and label occlusion inspected.'}

def check(name,passed,details=None):
    row={'name':name,'passed':bool(passed)}
    if details is not None:row['details']=details
    REPORT['checks'].append(row)
    if not passed:print('FAIL',name,json.dumps(details,ensure_ascii=False)[:1800],flush=True)


JUNCTION_JS=r'''(()=>{
 const svg=document.querySelector('#graph')||document.documentElement,space=svg.querySelector('#viewport')||svg,inv=space.getCTM().inverse(),model=MODEL_DATA;
 const rootPoint=(el,p)=>new DOMPoint(p.x,p.y).matrixTransform(el.getCTM()).matrixTransform(inv);
 const distance=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)};
 const inTriangle=(p,a,b,c)=>{const cross=(u,v,w)=>(u.x-w.x)*(v.y-w.y)-(v.x-w.x)*(u.y-w.y);const x=cross(p,a,b),y=cross(p,b,c),z=cross(p,c,a);return !(Math.min(x,y,z)<0&&Math.max(x,y,z)>0)};
 const circles=[...svg.querySelectorAll('.polarity-bg')].map(c=>{const p=rootPoint(c,{x:c.cx.baseVal.value,y:c.cy.baseVal.value}),m=inv.multiply(c.getCTM());return {owner:c.closest('[data-edge]').dataset.edge,kind:c.classList.contains('delay-bg')?'delay':'polarity',x:p.x,y:p.y,r:c.r.baseVal.value*Math.hypot(m.a,m.b)};});
 const headOverlaps=[],tailOverlaps=[],gaps=[],markerAlignment=[],shaftExposure=[],terminalIssues=[],scaling=[],endpointData={};
 for(const g of svg.querySelectorAll('[data-edge]')){
  const p=g.querySelector('.edge-visual'),L=p.getTotalLength(),end=p.getPointAtLength(L),near=p.getPointAtLength(Math.max(0,L-.05));
  const dx=end.x-near.x,dy=end.y-near.y,n=Math.hypot(dx,dy)||1,t={x:dx/n,y:dy/n};
  const id=g.dataset.edge,e=model.edges.find(e=>e.id===id),markerId=p.getAttribute('marker-end').match(/#([^)'"\s]+)/)[1],marker=document.getElementById(markerId),b=marker.querySelector('path').getBBox();
  const ref={x:marker.refX.baseVal.value,y:marker.refY.baseVal.value},units=marker.getAttribute('markerUnits')==='strokeWidth'?parseFloat(getComputedStyle(p).strokeWidth):1;
  const triangle=[{x:b.x,y:b.y},{x:b.x+b.width,y:b.y+b.height/2},{x:b.x,y:b.y+b.height}].map(q=>{const x=(q.x-ref.x)*units,y=(q.y-ref.y)*units;return rootPoint(p,{x:end.x+x*t.x-y*t.y,y:end.y+x*t.y+y*t.x});});
  const tip=triangle[1],rootEnd=rootPoint(p,end),projection=Math.hypot(tip.x-rootEnd.x,tip.y-rootEnd.y);if(Math.abs(projection-6)>.1)markerAlignment.push({id,projection});
  const box=svg.querySelector('[data-node="'+e.target+'"] .node-box'),bb=box.getBBox(),a=rootPoint(box,{x:bb.x,y:bb.y}),z=rootPoint(box,{x:bb.x+bb.width,y:bb.y+bb.height});
  const gap=Math.hypot(Math.max(a.x-tip.x,0,tip.x-z.x),Math.max(a.y-tip.y,0,tip.y-z.y));gaps.push({id,gap});
  const tail=[];for(let s=Math.max(0,L-7);s<=L;s+=.5)tail.push(rootPoint(p,p.getPointAtLength(s)));tail.push(rootEnd,tip);
  for(const c of circles){const d=inTriangle(c,...triangle)?0:Math.min(distance(c,triangle[0],triangle[1]),distance(c,triangle[1],triangle[2]),distance(c,triangle[2],triangle[0]));if(d<c.r-.2)headOverlaps.push({edge:id,labelEdge:c.owner,kind:c.kind,depth:c.r-d});let min=Infinity;for(let j=1;j<tail.length;j++)min=Math.min(min,distance(c,tail[j-1],tail[j]));if(min<c.r-.2)tailOverlaps.push({edge:id,labelEdge:c.owner,kind:c.kind,depth:c.r-min});}
  const terminal=g.querySelector('.edge-terminal'),ts=terminal&&getComputedStyle(terminal),dash=ts?.strokeDasharray.split(/[ ,]+/).map(parseFloat),offset=parseFloat(ts?.strokeDashoffset);
  if(!terminal||terminal.getAttribute('d')!==p.getAttribute('d')||!dash||Math.abs(dash[0]-L)>.5||Math.abs(offset+L-18)>.5)terminalIssues.push(id);
  const cs=getComputedStyle(p),screen=p.getScreenCTM(),scale=Math.hypot(screen.a,screen.b),stroke=parseFloat(cs.strokeWidth)*(cs.vectorEffect==='non-scaling-stroke'?1:scale),head=b.width*units*scale;
  const radius=parseFloat(cs.strokeWidth)/2;for(let i=0;i<32;i++){const angle=i*Math.PI/16,q=rootPoint(p,{x:end.x+Math.cos(angle)*radius,y:end.y+Math.sin(angle)*radius});if(!inTriangle(q,...triangle)){shaftExposure.push({id,stroke:cs.strokeWidth,projection});break;}}
  scaling.push({id,scale,vectorEffect:cs.vectorEffect,headPixels:head,shaftPixels:stroke,ratio:head/stroke});
  endpointData[id]={x:tip.x,y:tip.y,gap,projection,headTriangle:triangle};
 }
 return {headOverlaps,tailOverlaps,markerAlignment,shaftExposure,terminalIssues,maximumTipGap:Math.max(...gaps.map(g=>g.gap)),tipGaps:gaps,scaling,endpointData};
})()'''


async def run(port):
    for _ in range(80):
        try:
            target=next(t for t in requests.get(f'http://127.0.0.1:{port}/json',timeout=1).json() if t['type']=='page');break
        except (requests.RequestException,StopIteration):await asyncio.sleep(.2)
    else:raise RuntimeError('Chrome not ready')
    async with websockets.connect(target['webSocketDebuggerUrl'],max_size=40_000_000) as ws:
        seq=0
        exceptions=[]
        async def call(method,params=None):
            nonlocal seq
            seq+=1;mid=seq
            await ws.send(json.dumps({'id':mid,'method':method,'params':params or {}}))
            while True:
                r=json.loads(await ws.recv())
                if r.get('method')=='Runtime.exceptionThrown':exceptions.append(r.get('params',{}))
                if r.get('id')==mid:
                    if r.get('error'):raise RuntimeError(r['error'])
                    return r.get('result',{})
        async def ev(js):
            r=await call('Runtime.evaluate',{'expression':js,'returnByValue':True,'awaitPromise':True})
            if r.get('exceptionDetails'):raise RuntimeError(r['exceptionDetails'])
            return r.get('result',{}).get('value')
        async def viewport(w,h):
            await call('Emulation.setDeviceMetricsOverride',{'width':int(w),'height':int(h),'deviceScaleFactor':1,'mobile':False})
            await asyncio.sleep(.1)
        async def screenshot(name,clip=None,beyond=True):
            params={'format':'png','captureBeyondViewport':beyond}
            if clip:params['clip']=clip
            r=await call('Page.captureScreenshot',params);(OUT/name).write_bytes(base64.b64decode(r['data']));REPORT['screenshots'].append(name)
        async def navigate(path,condition):
            await call('Page.navigate',{'url':path.as_uri()})
            for _ in range(300):
                if await ev(condition):break
                await asyncio.sleep(.1)
            else:
                REPORT['runtimeExceptions']=exceptions
                REPORT['notReadyDocument']=await ev('({url:location.href,ready:document.readyState,title:document.title,text:document.body?.innerText.slice(0,800)})')
                raise RuntimeError('Page not ready: '+str(path)+'; exceptions='+json.dumps(exceptions))
            await ev('document.fonts.ready');await asyncio.sleep(.1)
        async def fonts():
            doc=await call('DOM.getDocument');node=await call('DOM.querySelector',{'nodeId':doc['root']['nodeId'],'selector':'.node-label tspan'})
            return {'computed':await ev("getComputedStyle(document.querySelector('.node-label')).fontFamily"),'platform':await call('CSS.getPlatformFontsForNode',{'nodeId':node['nodeId']})}

        await call('Page.enable');await call('Runtime.enable');await call('DOM.enable');await call('CSS.enable')
        await viewport(1680,1050)
        await navigate(ROOT/'index.html','!!window.CLD_ATLAS')
        REPORT['liveFonts']=await fonts()
        REPORT['liveArrowStates']={}
        for arrow_state in ['normal','selected','hovered','keyboard_focus']:
            await ev("CLD_ATLAS.overview()")
            if arrow_state=='selected':await ev("CLD_ATLAS.selectEdge('E43')")
            if arrow_state=='hovered':await ev("document.querySelector('[data-edge=E43]').dispatchEvent(new PointerEvent('pointerenter'))")
            focus_node=None
            if arrow_state=='keyboard_focus':
                doc=await call('DOM.getDocument');focus_node=await call('DOM.querySelector',{'nodeId':doc['root']['nodeId'],'selector':'[data-edge=E43]'})
                await call('CSS.forcePseudoState',{'nodeId':focus_node['nodeId'],'forcedPseudoClasses':['focus-visible']})
            await ev('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
            scale=4 if arrow_state=='keyboard_focus' else 2
            # Inspect the actual styled SVG; focus uses the thickest 4.4-unit stroke.
            await ev("""(()=>{const z="""+str(scale)+""",p=document.querySelector('[data-edge=E43] .edge-visual'),q=p.getPointAtLength(p.getTotalLength()),s=document.getElementById('graph'),r=s.getBoundingClientRect();document.getElementById('viewport').setAttribute('transform',`translate(${r.width/2-z*q.x} ${r.height/2-z*q.y}) scale(${z})`);})()""")
            data=await ev(JUNCTION_JS.replace('MODEL_DATA',json.dumps(MODEL)))
            REPORT['liveArrowStates'][arrow_state]=data
            check(f'live {arrow_state}: shaft cap remains inside arrowhead',not data['shaftExposure'],data['shaftExposure'])
            q=await ev("""(()=>{const p=document.querySelector('[data-edge=E43] .edge-visual'),e=p.getPointAtLength(p.getTotalLength()),q=new DOMPoint(e.x,e.y).matrixTransform(p.getScreenCTM());return {x:q.x,y:q.y}})()""")
            await screenshot(f'arrow_live_{arrow_state}_{scale*100}.png',{'x':max(0,q['x']-220),'y':max(0,q['y']-190),'width':440,'height':380,'scale':1},beyond=False)
            captured_scale=await ev("Math.hypot(document.querySelector('[data-edge=E43] .edge-visual').getScreenCTM().a,document.querySelector('[data-edge=E43] .edge-visual').getScreenCTM().b)")
            check(f'live {arrow_state}: screenshot preserves intended enlargement',abs(captured_scale-scale)<.01,{'requestedScale':scale,'actualScale':captured_scale})
            if focus_node:await call('CSS.forcePseudoState',{'nodeId':focus_node['nodeId'],'forcedPseudoClasses':[]})
        await ev("CLD_ATLAS.overview()")
        exports={}
        exports['full']=await ev('CLD_ATLAS.buildExportSvg({fullSystem:true})')
        await ev("CLD_ATLAS.selectLoop('R2');CLD_ATLAS.setLoopView(true)")
        exports['r2']=await ev('CLD_ATLAS.buildExportSvg({fullSystem:false})')
        for name,source in exports.items():
            path=OUT/f'export_final_{name}.svg';path.write_text(source,encoding='utf-8')
            await navigate(path,"document.documentElement.tagName.toLowerCase()==='svg'&&!!document.querySelector('[data-node]')")
            size=await ev('({width:document.documentElement.width.baseVal.value,height:document.documentElement.height.baseVal.value})')
            await viewport(size['width'],size['height'])
            crop=await ev('''(()=>{const s=document.documentElement,g=s.querySelector('[data-export-diagram]'),v=s.viewBox.baseVal,b=g.getBBox(),t=g.transform.baseVal.consolidate().matrix;const clipped=[];for(const el of s.querySelectorAll('text')){if(el.closest('defs'))continue;const r=el.getBoundingClientRect(),sr=s.getBoundingClientRect();if(r.x<sr.x-.5||r.y<sr.y-.5||r.right>sr.right+.5||r.bottom>sr.bottom+.5)clipped.push(el.textContent);}const rootText=[...s.children].filter(x=>x.tagName==='text'),last=rootText.at(-1).getBBox();return {viewBox:{x:v.x,y:v.y,width:v.width,height:v.height},graph:{x:b.x+t.e,y:b.y+t.f,width:b.width,height:b.height},leftMargin:b.x+t.e,rightMargin:v.width-b.x-t.e-b.width,bottomMargin:v.height-last.y-last.height,clippedText:clipped,nodes:s.querySelectorAll('[data-node]').length,edges:s.querySelectorAll('[data-edge]').length,groups:s.querySelectorAll('.graph-group').length}})()''')
            actualFonts=await fonts()
            expected=35 if name=='full' else 2
            check(f'{name}: complete standalone SVG',crop['nodes']==expected and crop['edges']==(77 if name=='full' else 2) and crop['groups']==(6 if name=='full' else 0),crop)
            check(f'{name}: tight crop and unclipped text',crop['viewBox']['x']==0 and crop['viewBox']['y']==0 and 18<=crop['leftMargin']<=22 and 18<=crop['rightMargin']<=22 and 8<=crop['bottomMargin']<=35 and not crop['clippedText'],crop)
            liveNames={x['familyName'] for x in REPORT['liveFonts']['platform']['fonts']};exportNames={x['familyName'] for x in actualFonts['platform']['fonts']}
            check(f'{name}: actual node font matches live app',liveNames==exportNames and bool(exportNames),actualFonts)
            await screenshot(f'export_final_{name}_100.png')
            doc={'crop':crop,'fonts':actualFonts,'zooms':{}}
            for scale in [1,2]:
                await ev('document.documentElement.setAttribute("width",'+str(size['width']*scale)+');document.documentElement.setAttribute("height",'+str(size['height']*scale)+')')
                await viewport(1680,1050)
                data=await ev(JUNCTION_JS.replace('MODEL_DATA',json.dumps(MODEL)))
                doc['zooms'][str(scale)]=data
                edge='E43' if name=='full' else 'E38'
                q=await ev('''(()=>{const p=document.querySelector('[data-edge="'''+edge+'''"] .edge-visual'),x=p.getPointAtLength(p.getTotalLength()),q=new DOMPoint(x.x,x.y).matrixTransform(p.getScreenCTM());return {x:q.x,y:q.y}})()''')
                await screenshot(f'export_final_{name}_{edge}_{scale*100}.png',{'x':max(0,q['x']-220),'y':max(0,q['y']-190),'width':440,'height':380,'scale':1})
            data=doc['zooms']['1']
            check(f'{name}: marker tips project six units beyond trimmed shaft',not data['markerAlignment'],data['markerAlignment'])
            check(f'{name}: arrow tips approach target boundaries at0.8units',all(abs(g['gap']-.8)<.12 for g in data['tipGaps']),{'maximumTipGap':data['maximumTipGap'],'outliers':[g for g in data['tipGaps'] if abs(g['gap']-.8)>=.12]})
            check(f'{name}: shaft caps remain inside arrowheads',not data['shaftExposure'],data['shaftExposure'])
            check(f'{name}: labels clear every arrowhead',not data['headOverlaps'],data['headOverlaps'])
            check(f'{name}: labels clear every arrowhead base section',not data['tailOverlaps'],data['tailOverlaps'])
            check(f'{name}: solid terminal follows the same curve',not data['terminalIssues'],data['terminalIssues'])
            ratios1={x['id']:x['ratio'] for x in doc['zooms']['1']['scaling']};ratios2={x['id']:x['ratio'] for x in doc['zooms']['2']['scaling']}
            check(f'{name}: head-to-shaft proportions stay stable at200%',all(abs(ratios1[k]-ratios2[k])<.01 for k in ratios1),{'ratioAt100':list(ratios1.values())[:3],'ratioAt200':list(ratios2.values())[:3]})
            REPORT['documents'][name]=doc
        await call('Browser.close')


def main():
    with socket.socket() as sock:sock.bind(('127.0.0.1',0));port=sock.getsockname()[1]
    profile=Path(tempfile.mkdtemp(prefix='cld-svg-qa-'))
    browser=subprocess.Popen([os.environ.get('CLD_CHROME',r'C:\Program Files\Google\Chrome\Application\chrome.exe'),'--headless=new','--no-sandbox','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-allow-origins=*',f'--remote-debugging-port={port}',f'--user-data-dir={profile}','about:blank'],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=getattr(subprocess,'CREATE_NO_WINDOW',0))
    try:asyncio.run(run(port))
    except Exception as exc:check('Focused SVG QA completed',False,repr(exc))
    finally:
        if browser.poll() is None:
            browser.terminate()
            try:browser.wait(timeout=5)
            except subprocess.TimeoutExpired:browser.kill()
        REPORT['passed']=all(x['passed'] for x in REPORT['checks']);REPORT['failedChecks']=[x['name'] for x in REPORT['checks'] if not x['passed']]
        (OUT/'svg_rendering_validation.json').write_text(json.dumps(REPORT,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        print(json.dumps({'passed':REPORT['passed'],'checks':len(REPORT['checks']),'failedChecks':REPORT['failedChecks'],'report':str(OUT/'svg_rendering_validation.json')},indent=2))
    return 0 if REPORT['passed'] else 1


if __name__=='__main__':raise SystemExit(main())
