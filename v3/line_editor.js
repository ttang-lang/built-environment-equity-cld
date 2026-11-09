/* Local publication layout editor. Drawing coordinates never modify causal data. */
(() => {
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const copy=value=>JSON.parse(JSON.stringify(value));
  const clampPoint=p=>({x:Math.max(-20000,Math.min(20000,p.x)),y:Math.max(-20000,Math.min(20000,p.y))});
  const svgEl=(tag,attrs,parent)=>{const el=document.createElementNS(NS,tag);for(const [key,value] of Object.entries(attrs))el.setAttribute(key,value);parent.append(el);return el;};
  function create(adapter){
    const {model,svg,viewport}=adapter;
    const edges=new Map(model.edges.map(e=>[e.id,e]));
    const viewEdges=new Map([['overview',new Set(edges.keys())],...model.loops.map(l=>['loop:'+l.id,new Set(l.edges)])]);
    const topology=JSON.stringify([model.nodes.map(n=>n.id),model.edges.map(e=>[e.id,e.source,e.target,e.polarity]),model.loops.map(l=>[l.id,l.edges])]);
    let hash=2166136261;for(let i=0;i<topology.length;i++){hash^=topology.charCodeAt(i);hash=Math.imul(hash,16777619);}
    const fingerprint=(hash>>>0).toString(16),storageKey='cld-line-layout-v1:'+model.version+':'+fingerprint;
    let views={},enabled=false,context={viewKey:'overview',routes:new Map(),selectedEdge:null,scale:1},drag=null,selectedPoint=null;
    let undoStack=[],redoStack=[],frame=0,ignoreClicksUntil=0,renderKey='',saved=true,storageAvailable=true;
    const bar=document.createElement('div');bar.className='line-editor';bar.setAttribute('aria-label','Line layout editor');
    bar.innerHTML=`<div class="line-editor-main"><button id="lineEditToggle" type="button" aria-pressed="false" aria-controls="lineEditTools">Edit lines</button><span class="line-editor-summary">Straight segments · editable bends</span><span id="lineEditorStatus" role="status" aria-live="polite">Layout changes stay in this browser.</span></div><div id="lineEditTools" class="line-editor-tools" hidden><div class="line-editor-actions"><button id="lineUndo" type="button" title="Undo the last layout change (Ctrl+Z)">Undo</button><button id="lineRedo" type="button" title="Redo the last layout change (Ctrl+Shift+Z)">Redo</button><button id="lineReset" type="button" title="Restore the selected link's automatic route">Reset link</button><button id="lineSave" type="button">Save layout</button><button id="lineLoad" type="button">Load layout</button><label class="line-snap"><input id="lineSnap" type="checkbox" checked> Snap to grid</label><input id="lineLayoutFile" type="file" accept=".json,application/json" hidden></div><p class="line-editor-help">Select a line. Drag a filled handle to move a bend; drag a hollow handle to add one. Select a bend and press Delete to remove it. Arrow keys move a selected bend; Shift moves farther.</p></div>`;
    const after=adapter.toolbarAfter||adapter.container.querySelector('.canvas-topbar');
    if(after)after.after(bar);else adapter.container.prepend(bar);
    const $=id=>bar.querySelector('#'+id);
    const layer=svgEl('g',{'class':'line-edit-layer','data-line-editor':'true','aria-label':'Selected line layout controls'},viewport);
    const notify=message=>adapter.toast?.(message);
    function layoutDocument(){return {format:'cld-line-layout',schemaVersion:1,modelVersion:model.version,topology:fingerprint,views:copy(views)};}
    function validate(value){
      if(!value||typeof value!=='object'||Array.isArray(value)||value.format!=='cld-line-layout'||value.schemaVersion!==1)throw new Error('Choose a CLD line-layout JSON file.');
      if(value.modelVersion!==model.version||value.topology!==fingerprint)throw new Error('This layout belongs to a different model version.');
      if(!value.views||typeof value.views!=='object'||Array.isArray(value.views))throw new Error('The layout must contain view-specific routes.');
      const next={};
      for(const [view,routes]of Object.entries(value.views)){
        if(!viewEdges.has(view)||!routes||typeof routes!=='object'||Array.isArray(routes))throw new Error('The layout contains an unknown view.');
        next[view]={};
        for(const [id,points]of Object.entries(routes)){
          if(!viewEdges.get(view).has(id)||!Array.isArray(points)||points.length>64)throw new Error('The layout contains an invalid link or too many bends.');
          next[view][id]=points.map(p=>{if(!p||typeof p.x!=='number'||typeof p.y!=='number'||!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>20000||Math.abs(p.y)>20000)throw new Error('Bend coordinates must be finite and within the drawing area.');return {x:p.x,y:p.y};});
        }
      }
      return next;
    }
    try{const raw=localStorage.getItem(storageKey);if(raw)views=validate(JSON.parse(raw));}catch{storageAvailable=false;}
    function persist(){try{localStorage.setItem(storageKey,JSON.stringify(layoutDocument()));saved=true;storageAvailable=true;}catch{saved=false;storageAvailable=false;}updateControls();}
    function snapshot(){return JSON.stringify(views);}
    function record(before){if(before===snapshot())return;undoStack.push(before);if(undoStack.length>80)undoStack.shift();redoStack=[];persist();}
    function refresh(){renderKey='';adapter.refresh();}
    function refreshSoon(){if(frame)return;frame=requestAnimationFrame(()=>{frame=0;refresh();});}
    function flush(){if(frame){cancelAnimationFrame(frame);frame=0;}refresh();}
    function currentRoute(){return context.routes.get(context.selectedEdge);}
    function updateControls(){
      $('lineEditToggle').setAttribute('aria-pressed',String(enabled));$('lineEditToggle').textContent=enabled?'Done editing':'Edit lines';$('lineEditTools').hidden=!enabled;bar.classList.toggle('is-editing',enabled);svg.classList.toggle('is-editing-lines',enabled);
      $('lineUndo').disabled=!undoStack.length||!!drag;$('lineRedo').disabled=!redoStack.length||!!drag;
      $('lineReset').disabled=!context.selectedEdge||!Object.prototype.hasOwnProperty.call(views[context.viewKey]||{},context.selectedEdge)||!!drag;
      $('lineSave').disabled=!!drag;$('lineLoad').disabled=!!drag;
      const route=currentRoute(),collisions=route?.nodeCrossings||[];
      let text=storageAvailable&&saved?'Saved in this browser.':'Use Save layout to keep a copy.';
      if(enabled){text=context.selectedEdge?`${context.selectedEdge} · ${context.viewKey==='overview'?'Full system':context.viewKey.replace('loop:','Loop ')} · ${text}`:'Select a line to adjust its bends.';}
      if(enabled&&route&&(route.manualInvalid||collisions.length))text+=` Route overlaps ${collisions.length?'a variable box':'a protected area'}; move the bend to clear it.`;
      $('lineEditorStatus').textContent=text;$('lineEditorStatus').classList.toggle('has-warning',!!(enabled&&route&&(route.manualInvalid||collisions.length)));
    }
    function pointAtEvent(ev){const m=viewport.getScreenCTM();if(!m)return null;const p=new DOMPoint(ev.clientX,ev.clientY).matrixTransform(m.inverse());const snap=$('lineSnap').checked&&!ev.altKey;return {x:snap?Math.round(p.x/4)*4:p.x,y:snap?Math.round(p.y/4)*4:p.y};}
    function putPoints(view,id,points){views[view]??={};views[view][id]=copy(points);saved=false;}
    function finishDrag(cancel=false){
      if(!drag)return;const d=drag;drag=null;
      if(cancel){views=JSON.parse(d.before);saved=d.savedBefore;}else record(d.before);
      ignoreClicksUntil=performance.now()+300;
      try{if(svg.hasPointerCapture(d.pointerId))svg.releasePointerCapture(d.pointerId);}catch{}
      svg.classList.remove('is-dragging-line');flush();updateControls();
      if(!cancel&&enabled&&selectedPoint!==null)layer.querySelector(`[data-waypoint-index="${selectedPoint}"]`)?.focus({preventScroll:true});
    }
    function setEnabled(value){if(drag)finishDrag(true);enabled=!!value;if(!enabled)selectedPoint=null;renderKey='';updateControls();adapter.onEnabledChange?.(enabled);render(context);}
    function selectEdge(id){if(!edges.has(id))return;selectedPoint=null;adapter.selectEdge(id);}
    function makeHandle(point,attrs,title,filled){
      const r=(filled?5:4)/Math.max(.12,context.scale||1);
      const el=svgEl('circle',{cx:point.x,cy:point.y,r,'class':filled?'line-bend-handle':'line-add-handle',tabindex:'0',role:'button','aria-label':title,...attrs},layer);
      svgEl('title',{},el).textContent=title;return el;
    }
    function render(next){
      if(drag&&next.viewKey!==drag.viewKey)finishDrag(true);
      if(context.viewKey!==next.viewKey||context.selectedEdge!==next.selectedEdge)selectedPoint=null;
      context=next;updateControls();
      const route=currentRoute(),points=route?.editablePoints||[],key=JSON.stringify([enabled,context.viewKey,context.selectedEdge,route?.d,points,context.scale,selectedPoint]);
      if(key===renderKey)return;renderKey=key;
      const active=document.activeElement,restore=active?.closest?.('.line-edit-layer')?{point:active.getAttribute('data-waypoint-index'),insert:active.getAttribute('data-insert-index')}:null;
      layer.replaceChildren();viewport.append(layer);
      if(!enabled||!route||!context.selectedEdge)return;
      const vertices=route.vertices||[],indices=route.editableVertexIndices||[];
      // Interior segments alone are editable: the two short endpoint guards keep
      // arrowheads attached to their original variables while bends are moved.
      for(let i=1;i<vertices.length-2;i++){
        const a=vertices[i],b=vertices[i+1];if(Math.hypot(b.x-a.x,b.y-a.y)*(context.scale||1)<22)continue;
        const insertion=indices.filter(index=>index<=i).length;
        makeHandle({x:(a.x+b.x)/2,y:(a.y+b.y)/2},{'data-edge-id':context.selectedEdge,'data-insert-index':insertion,'data-segment-index':i},`Add a bend to ${context.selectedEdge}: drag this handle or press Enter`,false);
      }
      points.forEach((p,i)=>{const el=makeHandle(p,{'data-edge-id':context.selectedEdge,'data-waypoint-index':i,'aria-pressed':String(selectedPoint===i)},`Bend ${i+1} of ${context.selectedEdge}: drag or use arrow keys; Delete removes it`,true);if(selectedPoint===i)el.classList.add('is-selected');});
      if(restore&&!drag){const selector=restore.point!==null?`[data-waypoint-index="${restore.point}"]`:`[data-insert-index="${restore.insert}"]`;layer.querySelector(selector)?.focus({preventScroll:true});}
    }
    function changePoint(index,point,remove=false){
      const route=currentRoute();if(!route)return;const pts=copy(route.editablePoints||[]);if(index<0||index>=pts.length)return;
      const before=snapshot();if(remove){pts.splice(index,1);selectedPoint=null;}else pts[index]=clampPoint(point);
      putPoints(context.viewKey,context.selectedEdge,pts);record(before);refresh();
      if(!remove)layer.querySelector(`[data-waypoint-index="${index}"]`)?.focus({preventScroll:true});
    }
    svg.addEventListener('pointerdown',ev=>{
      const handle=ev.target.closest?.('.line-bend-handle,.line-add-handle');if(!enabled||!handle||ev.button!==0)return;
      ev.preventDefault();ev.stopImmediatePropagation();
      const p=pointAtEvent(ev),route=currentRoute();if(!p||!route)return;
      const before=snapshot(),points=copy(route.editablePoints||[]);let index=Number(handle.getAttribute('data-waypoint-index'));
      const insert=handle.hasAttribute('data-insert-index');
      if(insert){if(points.length>=64){notify('A link can have up to 64 bends. Remove one before adding another.');return;}index=Number(handle.getAttribute('data-insert-index'));points.splice(index,0,{x:Number(handle.getAttribute('cx')),y:Number(handle.getAttribute('cy'))});}
      selectedPoint=index;drag={before,savedBefore:saved,points,index,start:p,origin:copy(points[index]),viewKey:context.viewKey,edgeId:context.selectedEdge,pointerId:ev.pointerId,insert,moved:false};
      svg.setPointerCapture(ev.pointerId);svg.classList.add('is-dragging-line');
      if(insert)putPoints(drag.viewKey,drag.edgeId,points);
      renderKey='';if(insert)refresh();else render(context);
    },true);
    svg.addEventListener('pointermove',ev=>{
      if(!drag||ev.pointerId!==drag.pointerId)return;ev.preventDefault();ev.stopImmediatePropagation();
      const p=pointAtEvent(ev);if(!p)return;
      const dx=p.x-drag.start.x,dy=p.y-drag.start.y;drag.moved ||= Math.hypot(dx,dy)>1;
      const points=copy(drag.points);points[drag.index]=clampPoint({x:drag.origin.x+dx,y:drag.origin.y+dy});
      putPoints(drag.viewKey,drag.edgeId,points);refreshSoon();
    },true);
    for(const type of ['pointerup','pointercancel'])svg.addEventListener(type,ev=>{if(!drag||ev.pointerId!==drag.pointerId)return;ev.preventDefault();ev.stopImmediatePropagation();finishDrag(type==='pointercancel');},true);
    svg.addEventListener('lostpointercapture',()=>{if(drag)finishDrag(true);},true);
    svg.addEventListener('click',ev=>{if(ev.target.closest?.('.line-edit-layer')||performance.now()<ignoreClicksUntil){ev.preventDefault();ev.stopImmediatePropagation();}},true);
    svg.addEventListener('keydown',ev=>{
      if(!enabled)return;const handle=ev.target.closest?.('.line-bend-handle,.line-add-handle');if(!handle)return;
      const index=handle.hasAttribute('data-waypoint-index')?Number(handle.getAttribute('data-waypoint-index')):null;
      const used=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Delete','Backspace','Enter',' ','Escape'].includes(ev.key);if(!used)return;
      ev.preventDefault();ev.stopImmediatePropagation();
      if(ev.key==='Escape'){if(drag)finishDrag(true);else {selectedPoint=null;svg.focus({preventScroll:true});renderKey='';render(context);}return;}
      if(index!==null){
        selectedPoint=index;const p=currentRoute()?.editablePoints?.[index];if(!p)return;
        if(ev.key==='Delete'||ev.key==='Backspace')changePoint(index,null,true);
        else if(ev.key.startsWith('Arrow')){const n=ev.shiftKey?20:4;changePoint(index,{x:p.x+(ev.key==='ArrowRight'?n:ev.key==='ArrowLeft'?-n:0),y:p.y+(ev.key==='ArrowDown'?n:ev.key==='ArrowUp'?-n:0)});}
        else {renderKey='';render(context);}
      }else if(ev.key==='Enter'||ev.key===' '){
        const pts=copy(currentRoute()?.editablePoints||[]);if(pts.length>=64)return;const at=Number(handle.getAttribute('data-insert-index')),before=snapshot();pts.splice(at,0,{x:Number(handle.getAttribute('cx')),y:Number(handle.getAttribute('cy'))});selectedPoint=at;putPoints(context.viewKey,context.selectedEdge,pts);record(before);refresh();layer.querySelector(`[data-waypoint-index="${at}"]`)?.focus({preventScroll:true});
      }
    },true);
    function undo(){if(drag)finishDrag(true);if(!undoStack.length)return;redoStack.push(snapshot());views=JSON.parse(undoStack.pop());selectedPoint=null;persist();refresh();}
    function redo(){if(drag)finishDrag(true);if(!redoStack.length)return;undoStack.push(snapshot());views=JSON.parse(redoStack.pop());selectedPoint=null;persist();refresh();}
    function resetSelected(){if(drag)finishDrag(true);const v=views[context.viewKey],id=context.selectedEdge;if(!v||!Object.prototype.hasOwnProperty.call(v,id))return;const before=snapshot();delete v[id];if(!Object.keys(v).length)delete views[context.viewKey];selectedPoint=null;record(before);refresh();notify('Selected link restored. Undo is available.');}
    function importLayout(value){const next=validate(value);if(drag)finishDrag(true);const before=snapshot();views=next;selectedPoint=null;record(before);refresh();notify('Line layout loaded. Causal data are unchanged.');return true;}
    $('lineEditToggle').addEventListener('click',()=>setEnabled(!enabled));$('lineUndo').addEventListener('click',undo);$('lineRedo').addEventListener('click',redo);$('lineReset').addEventListener('click',resetSelected);
    $('lineSave').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(layoutDocument(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='built-environment-equity-line-layout.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);notify('Layout downloaded. Load this file to restore your bends in another browser.');});
    $('lineLoad').addEventListener('click',()=>$('lineLayoutFile').click());
    $('lineLayoutFile').addEventListener('change',async ev=>{const file=ev.target.files?.[0];if(!file)return;try{if(file.size>1000000)throw new Error('Choose a layout file smaller than 1 MB.');importLayout(JSON.parse(await file.text()));}catch(error){notify(error.message||'The layout could not be loaded.');}finally{ev.target.value='';}});
    document.addEventListener('keydown',ev=>{
      if(!enabled||['INPUT','TEXTAREA','SELECT'].includes(ev.target.tagName)||ev.target.isContentEditable)return;
      if(ev.key==='Escape'&&drag){ev.preventDefault();ev.stopImmediatePropagation();finishDrag(true);return;}
      if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='z'){ev.preventDefault();ev.stopImmediatePropagation();ev.shiftKey?redo():undo();}
      else if((ev.ctrlKey||ev.metaKey)&&ev.key.toLowerCase()==='y'){ev.preventDefault();ev.stopImmediatePropagation();redo();}
    },true);
    updateControls();
    return Object.freeze({getWaypoints:view=>copy(views[view]||{}),render,setEnabled,isEnabled:()=>enabled,selectEdge,exportLayout:layoutDocument,importLayout,undo,redo,resetSelected,storageKey});
  }
  window.CLD_LINE_EDITOR=Object.freeze({create});
})();
