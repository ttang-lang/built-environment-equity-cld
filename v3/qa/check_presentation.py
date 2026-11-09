"""Local Chrome checks for the static CLD presentation; no app dependencies/build.

Run with a Python environment containing requests and websockets. The browser is
launched headlessly using a dedicated temporary profile and closed on completion.
Reports and screenshots are saved next to this script.
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

sys.stdout.reconfigure(encoding="utf-8")
OUT = Path(__file__).resolve().parent
ROOT = OUT.parent
MODEL_BYTES = (ROOT / "model.json").read_bytes()
MODEL = json.loads(MODEL_BYTES.decode("utf-8"))
REPORT = {
    "modelVersion": MODEL["version"],
    "modelSha256": hashlib.sha256(MODEL_BYTES).hexdigest(),
    "checks": [],
    "diagnostics": {},
    "screenshots": [],
    "limitations": "Browser interaction and presentation checks; not empirical causal validation. Fullscreen is checked in headless Chrome, with a simulated API rejection for the fallback.",
}


def check(name, passed, details=None):
    row = {"name": name, "passed": bool(passed)}
    if details is not None:
        row["details"] = details
    REPORT["checks"].append(row)
    if not passed:
        print("FAIL", name, json.dumps(details, ensure_ascii=False)[:1500])


async def run(port):
    target = None
    for _ in range(80):
        try:
            entries = requests.get(f"http://127.0.0.1:{port}/json", timeout=1).json()
            target = next(t for t in entries if t["type"] == "page")
            break
        except (requests.RequestException, StopIteration):
            await asyncio.sleep(.2)
    if target is None:
        raise RuntimeError("Chrome DevTools endpoint did not become ready")

    async with websockets.connect(target["webSocketDebuggerUrl"], max_size=40_000_000) as ws:
        seq = 0
        exceptions = []

        async def call(method, params=None):
            nonlocal seq
            seq += 1
            this_id = seq
            await ws.send(json.dumps({"id": this_id, "method": method, "params": params or {}}))
            while True:
                message = json.loads(await ws.recv())
                if message.get("method") == "Runtime.exceptionThrown":
                    exceptions.append(message["params"])
                if message.get("id") == this_id:
                    if "error" in message:
                        raise RuntimeError(message["error"])
                    return message.get("result", {})

        async def ev(expression, gesture=False):
            result = await call("Runtime.evaluate", {
                "expression": expression, "returnByValue": True,
                "awaitPromise": True, "userGesture": gesture,
            })
            if result.get("exceptionDetails"):
                raise RuntimeError(result["exceptionDetails"])
            return result.get("result", {}).get("value")

        async def settle():
            await asyncio.sleep(.32)

        async def screenshot(name):
            shot = await call("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": False})
            (OUT / name).write_bytes(base64.b64decode(shot["data"]))
            REPORT["screenshots"].append(name)

        async def viewport(width, height, mobile=False):
            await call("Emulation.setDeviceMetricsOverride", {
                "width": width, "height": height, "deviceScaleFactor": 1, "mobile": mobile,
            })
            await settle()

        async def click(selector):
            point = await ev("""(s=>{const e=document.querySelector(s);if(!e)return null;
              const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})(""" + json.dumps(selector) + ")")
            if point is None:
                raise RuntimeError("Missing click target " + selector)
            for kind in ["mousePressed", "mouseReleased"]:
                await call("Input.dispatchMouseEvent", {"type": kind, "button": "left", "clickCount": 1, **point})
            await settle()

        async def fullscreen_active():
            return await ev("document.fullscreenElement===document.getElementById('workspace') || document.getElementById('workspace').classList.contains('is-fullscreen')")

        async def export_check(full, expected_nodes, expected_edges, title, expected_groups=0):
            state_before = await ev("JSON.stringify(CLD_ATLAS.getViewState())")
            result = await ev("""(()=>{const s=CLD_ATLAS.buildExportSvg({fullSystem:""" + str(full).lower() + """});
              if(typeof s!=='string')return {valid:false,type:typeof s};
              const d=new DOMParser().parseFromString(s,'image/svg+xml');
              const root=d.documentElement, text=root.textContent;
              return {valid:!d.querySelector('parsererror'),nodes:d.querySelectorAll('[data-node],.node').length,
                edges:d.querySelectorAll('[data-edge],.graph-edge').length,groups:d.querySelectorAll('.graph-group').length,
                viewBox:root.getAttribute('viewBox'),width:root.getAttribute('width'),height:root.getAttribute('height'),
                hasSigns:text.includes('+')&&text.includes('−'),
                hasLegend:/same.direction/i.test(text)&&/opposite.direction/i.test(text),
                hasEvidenceLegend:/inferred|conditional|hypothes/i.test(text),
                hasDelayLegend:/delay/i.test(text),length:s.length};})()""")
            state_after = await ev("JSON.stringify(CLD_ATLAS.getViewState())")
            check(title, result.get("valid") and result.get("nodes") == expected_nodes and result.get("edges") == expected_edges and result.get("groups") == expected_groups and result.get("hasSigns") and result.get("hasLegend") and result.get("hasEvidenceLegend") and result.get("hasDelayLegend") and state_before == state_after, result)

        await call("Page.enable")
        await call("Runtime.enable")
        await call("Network.enable")
        await call("Network.setCacheDisabled", {"cacheDisabled": True})
        await viewport(1680, 1050)
        await call("Page.navigate", {"url": (ROOT / "index.html").as_uri()})
        for _ in range(160):
            if await ev("!!window.CLD_ATLAS && !!window.CLD_GEOMETRY && typeof CLD_ATLAS.getViewState==='function'"):
                break
            await asyncio.sleep(.2)
        else:
            raise RuntimeError("The revised app API did not initialize")
        await settle()

        structure = await ev("CLD_ATLAS.validate()")
        REPORT["diagnostics"]["initialStructure"] = structure
        check("Local-file initial full-system rendering", structure.get("renderedNodes") == len(MODEL["nodes"]) and structure.get("renderedEdges") == len(MODEL["edges"]), structure)
        check("Loop closure and polarity", all(l["closed"] and l["computedType"] == l["declaredType"] for l in structure["loopChecks"]))
        check("Evidence and endpoint references", not structure["missingAnchors"] and not structure["missingEndpoints"])
        await screenshot("overview_1680.png")

        geometry = await ev("""(()=>{
          const boxes=[...document.querySelectorAll('[data-node]')].map(g=>{const r=g.querySelector('.node-box').getBBox();const t=g.transform.baseVal.consolidate().matrix;return {id:g.dataset.node,x:t.e+r.x,y:t.f+r.y,w:r.width,h:r.height};});
          const overlaps=[];for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y)overlaps.push([a.id,b.id]);}
          const modelNodes=new Map(CLD_MODEL.nodes.map(n=>[n.id,n]));
          window.__qaOverviewPositions=Object.fromEntries(boxes.map(b=>[b.id,{x:b.x+b.w/2,y:b.y+b.h/2}]));
          const relativePositionIssues=[],groupTranslations={};
          for(const b of boxes){const n=modelNodes.get(b.id);if(['V32','V33','V34'].includes(n.id))continue;const shift={x:b.x+b.w/2-n.x,y:b.y+b.h/2-n.y};const ref=groupTranslations[n.group]??(groupTranslations[n.group]=shift);if(Math.abs(shift.x-ref.x)>.01||Math.abs(shift.y-ref.y)>.01)relativePositionIssues.push(n.id);}
          const regions=[...document.querySelectorAll('.graph-group')].map(g=>{const r=g.querySelector('rect').getBBox();return {id:g.dataset.group,x:r.x,y:r.y,w:r.width,h:r.height,heading:g.querySelector('text')?.textContent};});
          const regionOverlaps=[],containmentIssues=[],headingIssues=[];
          for(let i=0;i<regions.length;i++)for(let j=i+1;j<regions.length;j++){const a=regions[i],b=regions[j];if(a.x<b.x+b.w-.5&&a.x+a.w>b.x+.5&&a.y<b.y+b.h-.5&&a.y+a.h>b.y+.5)regionOverlaps.push([a.id,b.id]);}
          for(const b of boxes){const r=regions.find(r=>r.id===modelNodes.get(b.id).group);if(!r||b.x<r.x-.5||b.y<r.y-.5||b.x+b.w>r.x+r.w+.5||b.y+b.h>r.y+r.h+.5)containmentIssues.push(b.id);}
          for(const group of CLD_MODEL.groups){const r=regions.find(r=>r.id===group.id);if(!r||r.heading?.toLowerCase()!==group.label.toLowerCase())headingIssues.push(group.id);}
          const rm=new Map(regions.map(r=>[r.id,r])),order=['governance','housing','mobility','place','health'],regionGaps=[];
          for(let i=1;i<order.length;i++){const a=rm.get(order[i-1]),b=rm.get(order[i]);regionGaps.push({from:a.id,to:b.id,axis:'y',gap:b.y-a.y-a.h});}
          for(const id of ['housing','mobility']){const a=rm.get(id),b=rm.get('equity');regionGaps.push({from:id,to:'equity',axis:'x',gap:b.x-a.x-a.w});}
          const pos=window.__qaOverviewPositions,alignmentIssues=[];
          if(Math.abs(pos.V33.y-pos.V06.y)>.01)alignmentIssues.push('V33 housing row');
          if(Math.abs(pos.V34.y-pos.V18.y)>.01)alignmentIssues.push('V34 mobility row');
          if(Math.abs(pos.V32.x-pos.V33.x)>.01||Math.abs(pos.V32.x-pos.V34.x)>.01||Math.abs(pos.V32.y-pos.V23.y)>.01)alignmentIssues.push('V32 right column / health row');
          const titleBoxes=[...document.querySelectorAll('.group-label')].map(t=>{const r=t.getBBox();return {id:t.closest('.graph-group').dataset.group,x:r.x,y:r.y,w:r.width,h:r.height};});
          const pathIssues=[],crossings=[],titleCrossings=[],labelIssues=[],endpointIssues=[];
          const edges=new Map(CLD_MODEL.edges.map(e=>[e.id,e]));
          for(const g of document.querySelectorAll('[data-edge]')){const p=g.querySelector('.edge-visual'),d=p.getAttribute('d'),e=edges.get(g.dataset.edge);let length=p.getTotalLength();
            if(!Number.isFinite(length)||length<=0||/NaN|Infinity/.test(d)||!/[CQcq]/.test(d))pathIssues.push(g.dataset.edge);
            for(let s=8;s<length-8;s+=7){const q=p.getPointAtLength(s),hit=boxes.find(b=>b.id!==e.source&&b.id!==e.target&&q.x>b.x+3&&q.x<b.x+b.w-3&&q.y>b.y+3&&q.y<b.y+b.h-3);if(hit){crossings.push({edge:e.id,node:hit.id});break;}}
            for(let s=8;s<length-8;s+=7){const q=p.getPointAtLength(s),hit=titleBoxes.find(b=>q.x>b.x&&q.x<b.x+b.w&&q.y>b.y&&q.y<b.y+b.h);if(hit){titleCrossings.push({edge:e.id,group:hit.id});break;}}
            const q=p.getPointAtLength(length),b=boxes.find(b=>b.id===e.target);const dx=Math.max(b.x-q.x,0,q.x-b.x-b.w),dy=Math.max(b.y-q.y,0,q.y-b.y-b.h);if(Math.hypot(dx,dy)>24)endpointIssues.push(e.id);
          }
          const luminance=rgb=>{const v=rgb.match(/[\\d.]+/g).slice(0,3).map(Number).map(x=>{x/=255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4});return .2126*v[0]+.7152*v[1]+.0722*v[2]};
          const contrasts=[],sizes=[];
          for(const g of document.querySelectorAll('[data-node]')){const n=g.querySelector('.node-label'),b=g.querySelector('.node-box').getBBox(),r=n.getBBox(),css=getComputedStyle(n);if(r.x<b.x-1||r.y<b.y-1||r.x+r.width>b.x+b.width+1||r.y+r.height>b.y+b.height+1)labelIssues.push(g.dataset.node);contrasts.push((1.05)/(luminance(css.fill)+.05));sizes.push(parseFloat(css.fontSize));}
          return {overlaps,relativePositionIssues,groupTranslations,regionGaps,alignmentIssues,regions,regionOverlaps,containmentIssues,headingIssues,pathIssues,crossings,titleCrossings,labelIssues,endpointIssues,minimumLabelContrast:Math.min(...contrasts),minimumLabelFontSize:Math.min(...sizes)};
        })()""")
        REPORT["diagnostics"]["overviewGeometry"] = geometry
        check("No overlapping variable blocks", not geometry["overlaps"], geometry["overlaps"])
        check("Within-region relative positions preserved", not geometry["relativePositionIssues"], {k:geometry[k] for k in ['relativePositionIssues','groupTranslations']})
        check("Themed regions have equal 96-unit gutters in established order", len(geometry['regionGaps'])==6 and all(abs(g['gap']-96)<.01 for g in geometry['regionGaps']),geometry['regionGaps'])
        check("Outcome nodes and rightmost health node retain row-column alignment",not geometry['alignmentIssues'],geometry['alignmentIssues'])
        check("Six original themed regions and headings retained", len(geometry["regions"])==6 and not geometry["headingIssues"], geometry["headingIssues"])
        check("Themed regions contain their original members without overlap", not geometry["containmentIssues"] and not geometry["regionOverlaps"], {k:geometry[k] for k in ['containmentIssues','regionOverlaps']})
        check("All relationships use finite curved paths", not geometry["pathIssues"], geometry["pathIssues"])
        check("Routes avoid unrelated node interiors", not geometry["crossings"], geometry["crossings"])
        check("Routes avoid themed-region headings", not geometry["titleCrossings"], geometry["titleCrossings"])
        check("Arrow endpoints connect to target blocks", not geometry["endpointIssues"], geometry["endpointIssues"])
        check("Node labels fit their blocks", not geometry["labelIssues"], geometry["labelIssues"])
        check("Node-label contrast and base size", geometry["minimumLabelContrast"] >= 4.5 and geometry["minimumLabelFontSize"] >= 15, {k:geometry[k] for k in ["minimumLabelContrast","minimumLabelFontSize"]})

        reachable = await ev("""(()=>{const missed=[];for(const g of document.querySelectorAll('[data-edge]')){const p=g.querySelector('.edge-visual');let found=false;for(let f=.02;f<.99;f+=.015){const point=p.getPointAtLength(p.getTotalLength()*f),q=new DOMPoint(point.x,point.y).matrixTransform(p.getScreenCTM());if(document.elementFromPoint(q.x,q.y)?.closest('[data-edge]')?.dataset.edge===g.dataset.edge){found=true;break;}}if(!found)missed.push(g.dataset.edge);}return {total:document.querySelectorAll('[data-edge]').length,missed};})()""")
        check("Every overview arrow has a pointer-reachable segment", not reachable["missed"], reachable)
        await click("#actualSize")
        check("100% control restores true scale", abs((await ev("CLD_ATLAS.getViewState().scale"))-1)<.001)
        await click("#zoomIn")
        check("Zoom in control increases scale", (await ev("CLD_ATLAS.getViewState().scale"))>1)
        await click("#zoomOut")
        check("Zoom out control reverses zoom in", abs((await ev("CLD_ATLAS.getViewState().scale"))-1)<.001)
        await click("#fitAll")
        check("Fit view restores automatic fitting", await ev("CLD_ATLAS.getViewState().autoFit"))

        interactions = await ev("""(()=>{const failures=[];for(const e of CLD_MODEL.edges){const g=document.querySelector('[data-edge="'+e.id+'"]');if(!g){failures.push(e.id+': missing');continue;}g.dispatchEvent(new MouseEvent('click',{bubbles:true}));const p=document.getElementById('inspectorContent');if(!p.textContent.includes(e.id)|| (e.status==='definition'?!p.textContent.includes(e.derivation):!p.querySelector('.evidence-card')))failures.push(e.id+': details');}return {arrows:CLD_MODEL.edges.length,failures};})()""")
        check("Every arrow opens explanation and evidence", not interactions["failures"], interactions)
        for loop in MODEL["loops"]:
            await ev("CLD_ATLAS.selectLoop(" + json.dumps(loop["id"]) + ")")
            await settle()
            context = await ev("""(()=>{const positions=window.__qaOverviewPositions,moved=[];for(const g of document.querySelectorAll('[data-node]')){const r=g.querySelector('.node-box').getBBox(),t=g.transform.baseVal.consolidate().matrix,n=positions[g.dataset.node];if(Math.abs(t.e+r.x+r.width/2-n.x)>.01||Math.abs(t.f+r.y+r.height/2-n.y)>.01)moved.push(g.dataset.node);}return {nodes:document.querySelectorAll('[data-node]').length,edges:document.querySelectorAll('[data-edge]').length,groups:document.querySelectorAll('.graph-group').length,moved,mode:CLD_ATLAS.getViewState().mode}})()""")
            check("Default grouped context for " + loop['id'],context['nodes']==35 and context['edges']==77 and context['groups']==6 and not context['moved'] and context['mode']=='overview',context)
            await ev('CLD_ATLAS.setLoopView(true)')
            await settle()
            result = await ev("""(()=>{const p=document.getElementById('inspectorContent');return {nodes:[...document.querySelectorAll('[data-node]')].map(x=>x.dataset.node),edges:[...document.querySelectorAll('[data-edge]')].map(x=>x.dataset.edge),text:p.textContent,state:CLD_ATLAS.getViewState()};})()""")
            check("Isolated " + loop["id"] + " path and evidence", set(result["nodes"]) == set(loop["nodes"]) and set(result["edges"]) == set(loop["edges"]) and loop["evidenceCategory"] in result["text"] and "path closes" in result["text"].lower(), {"nodes":result["nodes"],"edges":result["edges"],"state":result["state"]})
            await ev('CLD_ATLAS.setLoopView(false)')
        await ev('CLD_ATLAS.setLoopView(true)')
        await ev("CLD_ATLAS.selectLoop('R2')")
        await settle()
        reciprocal = await ev("""(()=>{const p=[...document.querySelectorAll('.edge-visual')];const a=p[0].getPointAtLength(p[0].getTotalLength()/2),b=p[1].getPointAtLength(p[1].getTotalLength()/2);return Math.hypot(a.x-b.x,a.y-b.y)})()""")
        check("Reciprocal arrows have separate curves", reciprocal > 20, {"midpointSeparation":reciprocal})
        await ev("CLD_ATLAS.selectLoop('R3')")
        await settle()
        await screenshot("isolated_loop_r3.png")
        await export_check(False, 5, 5, "Current-loop SVG export")
        await export_check(True, 35, 77, "Full-system SVG export from loop view",expected_groups=6)
        await click("#loopViewToggle")
        check("Loop context toggle reveals the full system", await ev("document.querySelectorAll('[data-node]').length===35&&document.querySelectorAll('[data-edge]').length===77"))
        await click("#loopViewToggle")
        check("Loop context toggle restores isolated loop", await ev("document.querySelectorAll('[data-node]').length===5&&document.querySelectorAll('[data-edge]').length===5"))

        point = await ev("""(()=>{const el=document.querySelector('.edge-visual');for(let f=.1;f<.95;f+=.04){const p=el.getPointAtLength(el.getTotalLength()*f),q=new DOMPoint(p.x,p.y).matrixTransform(el.getScreenCTM());const top=document.elementFromPoint(q.x,q.y)?.closest('[data-edge]');if(top?.dataset.edge===el.closest('[data-edge]').dataset.edge)return {x:q.x,y:q.y,id:top.dataset.edge};}return null})()""")
        check("Foreground curve has a real pointer hit target", point is not None, point)
        if point:
            for kind in ["mousePressed", "mouseReleased"]:
                await call("Input.dispatchMouseEvent", {"type":kind,"button":"left","clickCount":1,"x":point["x"],"y":point["y"]})
            check("Real curve click opens its relationship", await ev("document.getElementById('inspectorContent').textContent.includes("+json.dumps(point["id"])+")"))

        await ev("CLD_ATLAS.setLoopView(false);CLD_ATLAS.overview()")
        await settle()
        panel_state = await ev("({explorer:document.getElementById('workspace').classList.contains('explorer-collapsed'),inspector:document.getElementById('workspace').classList.contains('inspector-collapsed')})")
        await click("#fullscreenButton")
        check("Fullscreen control activates browser or fallback fullscreen", await fullscreen_active())
        bounds = await ev("""(()=>{const w=document.getElementById('workspace').getBoundingClientRect(),g=document.getElementById('graphWrap').getBoundingClientRect();const label=document.querySelector('.node-label'),matrix=label.getScreenCTM();return {width:innerWidth,height:innerHeight,workspace:{x:w.x,y:w.y,width:w.width,height:w.height},canvas:{x:g.x,y:g.y,width:g.width,height:g.height},labelPixels:parseFloat(getComputedStyle(label).fontSize)*Math.hypot(matrix.a,matrix.b),panelsCollapsed:document.getElementById('workspace').classList.contains('explorer-collapsed')&&document.getElementById('workspace').classList.contains('inspector-collapsed'),native:!!document.fullscreenElement};})()""")
        REPORT["diagnostics"]["fullscreen"] = bounds
        check("Fullscreen maximizes diagram and initially hides panels", bounds["panelsCollapsed"] and bounds["canvas"]["width"] >= bounds["width"]*.90 and bounds["workspace"]["height"] >= bounds["height"]*.98, bounds)
        await screenshot("fullscreen_system.png")
        await click("#toggleExplorer")
        check("Explorer remains accessible in fullscreen", await ev("getComputedStyle(document.querySelector('.explorer')).display!=='none' && document.querySelector('.explorer').getBoundingClientRect().width>100"))
        await click("#toggleInspector")
        check("Inspector remains accessible in fullscreen", await ev("getComputedStyle(document.querySelector('.inspector')).display!=='none' && document.querySelector('.inspector').getBoundingClientRect().width>100"))
        for kind in ["keyDown", "keyUp"]:
            await call("Input.dispatchKeyEvent", {"type":kind,"key":"Escape","code":"Escape","windowsVirtualKeyCode":27})
        await settle()
        escaped = not await fullscreen_active()
        check("Escape exits fullscreen", escaped)
        if not escaped:
            await ev("CLD_ATLAS.toggleFullscreen()", gesture=True)
            await settle()
        after = await ev("({explorer:document.getElementById('workspace').classList.contains('explorer-collapsed'),inspector:document.getElementById('workspace').classList.contains('inspector-collapsed')})")
        check("Leaving fullscreen restores previous panel state", panel_state == after, {"before":panel_state,"after":after})

        await ev("window.__qaNativeFullscreen=document.getElementById('workspace').requestFullscreen;document.getElementById('workspace').requestFullscreen=()=>Promise.reject(new Error('QA simulated unavailable fullscreen'))")
        await ev("CLD_ATLAS.toggleFullscreen()", gesture=True)
        await settle()
        check("Fullscreen has a usable API-rejection fallback", await ev("document.getElementById('workspace').classList.contains('is-fullscreen')"))
        if await fullscreen_active():
            await ev("CLD_ATLAS.toggleFullscreen()", gesture=True)
            await settle()
        await ev("document.getElementById('workspace').requestFullscreen=window.__qaNativeFullscreen;delete window.__qaNativeFullscreen")

        for width,height,mobile in [(1366,768,False),(390,844,True)]:
            await viewport(width,height,mobile)
            await ev("CLD_ATLAS.overview()")
            await settle()
            fit = await ev("""(()=>{const w=document.getElementById('workspace').getBoundingClientRect(),g=document.getElementById('graphWrap').getBoundingClientRect(),t=document.getElementById('fullscreenButton').getBoundingClientRect(),label=document.querySelector('.node-label'),matrix=label.getScreenCTM();return {viewport:innerWidth,pageWidth:document.documentElement.scrollWidth,canvas:{width:g.width,height:g.height},scale:CLD_ATLAS.getViewState().scale,labelPixels:parseFloat(getComputedStyle(label).fontSize)*Math.hypot(matrix.a,matrix.b),fullscreenControl:{x:t.x,y:t.y,right:t.right,bottom:t.bottom}}})()""")
            check(f"Responsive layout {width}x{height}", fit["pageWidth"] <= fit["viewport"]+1 and fit["canvas"]["width"] > 100 and fit["canvas"]["height"] > 200 and fit["fullscreenControl"]["x"] >= 0 and fit["fullscreenControl"]["right"] <= fit["viewport"]+1, fit)
            await screenshot(f"overview_{width}.png")
            if width==1366:
                await click("#fullscreenButton")
                full = await ev("""(()=>{const g=document.getElementById('graphWrap').getBoundingClientRect(),label=document.querySelector('.node-label'),matrix=label.getScreenCTM();return {canvas:{width:g.width,height:g.height},scale:CLD_ATLAS.getViewState().scale,labelPixels:parseFloat(getComputedStyle(label).fontSize)*Math.hypot(matrix.a,matrix.b),fullscreen:!!document.fullscreenElement||document.getElementById('workspace').classList.contains('is-fullscreen')};})()""")
                REPORT['diagnostics']['laptop1366x768']={'normal':fit,'fullscreen':full}
                check('Short-height laptop diagram uses available screen area',fit['canvas']['height']>450 and full['fullscreen'] and full['canvas']['height']>=fit['canvas']['height'] and full['scale']>=fit['scale'],{'normal':fit,'fullscreen':full,'layout':'Themed regions use uniform gutters'})
                await screenshot('fullscreen_1366.png')
                await click("#fullscreenButton")
            await ev("CLD_ATLAS.selectLoop('B5')")
            await settle()
            check(f"Loop remains inspectable in grouped context at {width}px", await ev("document.getElementById('inspectorContent').textContent.includes('Active-travel exposure constraint') && document.querySelectorAll('[data-node]').length===35 && document.querySelectorAll('.graph-group').length===6"))
            await screenshot(f"loop_{width}.png")

        check("Runtime JavaScript exceptions", not exceptions, exceptions)
        check("Scientific model data and file unchanged during presentation QA", (ROOT/'model.json').read_bytes() == MODEL_BYTES and await ev('CLD_MODEL')==MODEL)
        REPORT["diagnostics"]["finalViewState"] = await ev("CLD_ATLAS.getViewState()")
        await call("Browser.close")


def main():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1",0))
        port=sock.getsockname()[1]
    profile=Path(tempfile.mkdtemp(prefix="cld-presentation-qa-"))
    executable=os.environ.get("CLD_CHROME",r"C:\Program Files\Google\Chrome\Application\chrome.exe")
    process=subprocess.Popen([executable,"--headless=new","--no-sandbox","--disable-gpu","--no-first-run","--no-default-browser-check","--remote-allow-origins=*",f"--remote-debugging-port={port}",f"--user-data-dir={profile}","--window-size=1680,1050","about:blank"],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,creationflags=getattr(subprocess,"CREATE_NO_WINDOW",0))
    try:
        asyncio.run(run(port))
    except Exception as exc:
        check("QA completed",False,repr(exc))
    finally:
        if process.poll() is None:
            process.terminate()
            try:process.wait(timeout=5)
            except subprocess.TimeoutExpired:process.kill()
        REPORT["passed"]=all(row["passed"] for row in REPORT["checks"])
        REPORT["failedChecks"]=[row["name"] for row in REPORT["checks"] if not row["passed"]]
        (OUT/"presentation_validation.json").write_text(json.dumps(REPORT,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        print(json.dumps({"passed":REPORT["passed"],"checks":len(REPORT["checks"]),"failedChecks":REPORT["failedChecks"],"report":str(OUT/"presentation_validation.json")},ensure_ascii=False,indent=2))
    return 0 if REPORT["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
