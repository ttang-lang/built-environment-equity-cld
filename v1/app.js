/* Causal Atlas: a local, evidence-linked graph with presentation and loop views. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const M = window.CLD_MODEL, G = window.CLD_GEOMETRY;
  if (!M?.nodes?.length || !G) {
    $('emptyModel').hidden = false;
    $('viewTitle').textContent = 'Model unavailable';
    $('inspectorContent').innerHTML = '<section class="inspector-section"><h2>Open the complete package</h2><p>Keep model.js, graph_geometry.js, app.js and both stylesheets beside index.html.</p></section>';
    return;
  }
  const nodes=M.nodes, edges=M.edges||[], loops=M.loops||[], sources=M.sources||[], anchors=M.anchors||[];
  const W=224, H=88, dimensions={width:W,height:H};
  const overviewNodes=G.layout(nodes,M.groups||[],dimensions);
  let nodeMap=new Map(overviewNodes.map(n=>[n.id,n]));
  const edgeMap=new Map(edges.map(e=>[e.id,e])), loopMap=new Map(loops.map(l=>[l.id,l]));
  const sourceMap=new Map(sources.map(s=>[s.id,s])), anchorMap=new Map(anchors.map(a=>[a.id,a]));
  const groupMap=new Map((M.groups||[]).map(g=>[g.id,g]));
  const statusNames={reported:'Source-reported mechanism',association:'Association-based hypothesis',synthesis:'Cross-source synthesis',policy:'Conditional policy response',indicator:'Disparity indicator',definition:'Algebraic definition'};
  const state={tab:'loops',query:'',selectedType:null,selectedId:null,focusedLoop:null,mode:'overview',loopView:false,scale:1,tx:0,ty:0,drag:null,explorerOpen:innerWidth>760,inspectorOpen:false,fullscreen:false,fullscreenNative:false,fullscreenPanels:null,autoFit:true};
  let allNodes=overviewNodes, visibleEdges=edges, routes=new Map(), overviewRoutes=null, bounds=null, toastTimer, resizeFrame;
  let lastViewport={width:0,height:0}, suppressClickUntil=0;
  const nodeEls=new Map(), edgeEls=new Map(), badgeEls=new Map();
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const str=x=>Array.isArray(x)?x.join(', '):String(x??'');
  const label=id=>nodeMap.get(id)?.label||id;
  const sign=e=>Number(e.polarity)<0?'−':'+';
  const negative=e=>Number(e.polarity)<0;
  const status=e=>statusNames[e.status]||e.status||'Modelled relationship';
  const color=e=>e.status==='indicator'?'#65716d':negative(e)?'#9b5d12':'#17675f';
  const marker=e=>e.status==='indicator'?'neutral':negative(e)?'negative':'positive';
  const svgEl=(tag,attrs={},parent)=>{const el=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);if(parent)parent.append(el);return el;};
  const safeUrl=value=>{if(!value||typeof value!=='string')return '';try{const u=new URL(value,location.href);return ['https:','http:','file:'].includes(u.protocol)&&!value.includes('javascript:')?u.href:'';}catch{return '';}};
  const link=(url,text,cls='')=>{const u=safeUrl(url);return u?`<a class="${esc(cls)}" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(text)} ↗</a>`:'';};
  const loopEdges=l=>(l.edges||[]).map(id=>edgeMap.get(id)).filter(Boolean);
  const loopNodes=l=>[...new Set(l.nodes||loopEdges(l).flatMap(e=>[e.source,e.target]))];
  const nodeLoops=id=>loops.filter(l=>loopNodes(l).includes(id));
  const edgeLoops=id=>loops.filter(l=>(l.edges||[]).includes(id));
  const signedLoop=l=>{const es=loopEdges(l),negatives=es.filter(negative).length;return {negatives,product:negatives%2?'−':'+',type:negatives%2?'B':'R',edges:es};};
  const isClosedLoop=l=>{const es=loopEdges(l);return es.length>1&&es.every((e,i)=>e.target===es[(i+1)%es.length].source);};

  $('nodeCount').textContent=nodes.length;$('edgeCount').textContent=edges.length;$('loopCount').textContent=loops.length;
  $('loopTabCount').textContent=loops.length;$('edgeTabCount').textContent=edges.length;$('sourceCount').textContent=sources.length;
  $('introDescription').textContent='Explore the themed system map and follow its feedback loops.';
  $('footerVersion').textContent=`Conceptual model ${M.version} · Evidence and assumptions remain inspectable`;
  document.title=(M.meta?.title||'Built Environment Equity')+' · Causal Atlas';
  $('categoryKey').innerHTML=(M.groups||[]).map(g=>`<span><i style="background:${esc(g.color)}"></i>${esc(g.label)}</span>`).join('');

  const measure=document.createElement('canvas').getContext('2d');
  function wrapLabel(text){
    measure.font='600 18px "Segoe UI", Arial, sans-serif';
    const lines=[];let line='';
    for(const word of String(text).split(/\s+/)){
      const next=line?line+' '+word:word;
      if(line&&measure.measureText(next).width>W-30){lines.push(line);line=word;}else line=next;
    }
    if(line)lines.push(line);return lines;
  }
  function activateSvg(el,fn){
    el.addEventListener('click',ev=>{if(performance.now()<suppressClickUntil)return;ev.stopPropagation();fn();});
    el.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();ev.stopPropagation();fn();}});
  }
  function groupRegions(ns){
    return (M.groups||[]).map(g=>{
      const members=ns.filter(n=>n.group===g.id);if(!members.length)return null;
      const left=Math.min(...members.map(n=>n.x))-W/2-14;
      const right=Math.max(...members.map(n=>n.x))+W/2+14;
      const top=Math.min(...members.map(n=>n.y))-H/2-38;
      const bottom=Math.max(...members.map(n=>n.y))+H/2+18;
      return {...g,left,right,top,bottom,width:right-left,height:bottom-top};
    }).filter(Boolean);
  }
  const overviewGroups=groupRegions(overviewNodes);
  const groupObstacles=overviewGroups.map(g=>({id:'group-title-'+g.id,left:g.left+8,right:g.left+8+Math.min(230,g.width-20),top:g.top+6,bottom:g.top+28}));
  function drawGroups(regions,layer){
    for(const g of regions){
      const el=svgEl('g',{'class':'graph-group','data-group':g.id,'aria-label':g.label},layer);
      svgEl('rect',{'class':'group-background',x:g.left,y:g.top,width:g.width,height:g.height,rx:18,fill:g.color,stroke:g.color},el);
      svgEl('text',{'class':'group-label',x:g.left+12,y:g.top+21},el).textContent=g.label.toUpperCase();
    }
  }
  function graphBounds(ns,rs,regions=[]){
    const xs=ns.flatMap(n=>[n.x-W/2,n.x+W/2]),ys=ns.flatMap(n=>[n.y-H/2,n.y+H/2]);
    for(const r of rs.values())for(const p of r.points||[]){xs.push(p.x);ys.push(p.y);}
    for(const g of regions){xs.push(g.left,g.right);ys.push(g.top,g.bottom);}
    return {minX:Math.min(...xs)-36,maxX:Math.max(...xs)+36,minY:Math.min(...ys)-36,maxY:Math.max(...ys)+36};
  }
  function drawDiagram(ns,es,rs,layers,{interactive=true,activeLoop=null,regions=[]}={}){
    if(regions.length&&layers.group)drawGroups(regions,layers.group);
    // Put broad invisible hit bands behind every visible curve. A later edge's
    // hit band must not intercept a click directly on an earlier visible arrow.
    const hitLayer=interactive?svgEl('g',{'class':'edge-hit-layer','aria-hidden':'true'},layers.edge):null;
    for(const e of es){
      const route=rs.get(e.id);if(!route)continue;
      const el=svgEl('g',{'class':`graph-edge ${!['reported','indicator'].includes(e.status)?'edge-hypothesis':''} ${e.status==='indicator'?'edge-indicator':''}`,'data-edge':e.id},layers.edge);
      if(interactive){el.setAttribute('tabindex','0');el.setAttribute('role','button');el.setAttribute('aria-label',`${e.id}: ${label(e.source)} ${sign(e)} to ${label(e.target)}. Open evidence.`);}
      svgEl('title',{},el).textContent=`${e.id} · ${label(e.source)} → ${label(e.target)} (${sign(e)}). ${status(e)}.`;
      const hit=interactive?svgEl('path',{d:route.d,'class':'edge-hit','data-edge-hit':e.id},hitLayer):null;
      const path=svgEl('path',{d:route.d,'class':'edge-visual',stroke:color(e),'marker-end':`url(#arrow-${marker(e)})`},el);
      if(e.status==='indicator')path.style.strokeDasharray='2 6';
      // Keep the painted shaft inside the triangle, even with a thick rounded
      // hover/focus stroke. The marker projects 6 units (tip x=10, refX=4) past
      // this shortened path, placing its tip at the router's target point.
      const fullLength=path.getTotalLength();
      const shaftEnd=path.getPointAtLength(Math.max(0,fullLength-6));
      const finalLine=/ L [-+\d.eE]+ [-+\d.eE]+\s*$/;
      if(!finalLine.test(route.d))throw new Error('Arrow route requires a straight terminal: '+e.id);
      const shaftD=route.d.replace(finalLine,` L ${shaftEnd.x} ${shaftEnd.y}`);
      path.setAttribute('d',shaftD);
      const length=path.getTotalLength();
      // Dashed/dotted evidence styles end in a continuous shaft under the head.
      const terminal=svgEl('path',{d:shaftD,'class':'edge-terminal',stroke:color(e),
        'stroke-dasharray':`${length} ${length}`,
        'stroke-dashoffset':-Math.max(0,length-18),'aria-hidden':'true'},el);
      el.insertBefore(terminal,path);
      const p=route.signPoint||path.getPointAtLength(Math.max(12,length-38));
      svgEl('circle',{cx:p.x,cy:p.y,r:12,'class':'polarity-bg'},el);
      svgEl('text',{x:p.x,y:p.y+.5,'text-anchor':'middle','dominant-baseline':'middle',fill:color(e),'class':'edge-sign'},el).textContent=sign(e);
      if(e.delay){const d=route.delayPoint||path.getPointAtLength(length*.48);svgEl('circle',{cx:d.x,cy:d.y,r:11,'class':'polarity-bg delay-bg'},el);svgEl('text',{x:d.x,y:d.y+.5,'text-anchor':'middle','dominant-baseline':'middle','class':'edge-delay'},el).textContent='∥';}
      if(interactive){
        activateSvg(el,()=>selectEdge(e.id));activateSvg(hit,()=>selectEdge(e.id));
        edgeEls.set(e.id,{el,path,hit});
        for(const target of [el,hit]){
          target.addEventListener('pointerenter',()=>el.classList.add('is-hovered'));
          target.addEventListener('pointerleave',()=>el.classList.remove('is-hovered'));
        }
      }
    }
    for(const n of ns){
      const g=groupMap.get(n.group),el=svgEl('g',{'class':'node',transform:`translate(${n.x-W/2} ${n.y-H/2})`,'data-node':n.id},layers.node);
      if(interactive){el.setAttribute('tabindex','0');el.setAttribute('role','button');el.setAttribute('aria-label',`${n.id}: ${n.label}. Open definition and connections.`);}
      svgEl('rect',{width:W,height:H,rx:10,'class':'node-box'},el);
      svgEl('rect',{x:0,y:14,width:4,height:H-28,rx:2,'class':'node-stripe',fill:g?.color||'#3e7b83',style:`fill:${g?.color||'#3e7b83'}`},el);
      svgEl('text',{x:14,y:17,'class':'node-id'},el).textContent=n.id;
      const lines=wrapLabel(n.label),lineHeight=20,baseY=55-(lines.length-1)*lineHeight/2;
      const text=svgEl('text',{x:W/2,y:baseY,'text-anchor':'middle','class':'node-label',style:'font-size:18px'},el);
      lines.forEach((line,i)=>svgEl('tspan',{x:W/2,dy:i?lineHeight:0},text).textContent=line);
      svgEl('title',{},el).textContent=n.definition||n.label;
      if(interactive){activateSvg(el,()=>selectNode(n.id));nodeEls.set(n.id,el);}
    }
    if(activeLoop){
      const x=ns.reduce((s,n)=>s+n.x,0)/ns.length,y=ns.reduce((s,n)=>s+n.y,0)/ns.length;
      const el=svgEl('g',{'class':'loop-badge',transform:`translate(${x} ${y})`,'data-loop':activeLoop.id},layers.badge);
      if(interactive){el.setAttribute('tabindex','0');el.setAttribute('role','button');el.setAttribute('aria-label',`${activeLoop.id}: ${activeLoop.name}. Read loop evidence.`);}
      svgEl('circle',{r:31,fill:activeLoop.type==='B'?'#9b651f':'#246d5d'},el);
      svgEl('text',{x:0,y:1},el).textContent=activeLoop.id;
      svgEl('text',{x:0,y:55,'class':'loop-center-caption',style:'fill:#354b51;font:600 14px "Segoe UI",Arial,sans-serif'},el).textContent=activeLoop.type==='R'?'Reinforcing':'Balancing';
      if(interactive){activateSvg(el,()=>selectLoop(activeLoop.id,false));badgeEls.set(activeLoop.id,el);}
    }
  }
  function renderGraph(){
    const focused=loopMap.get(state.focusedLoop);
    state.mode=focused&&state.loopView?'loop':'overview';
    allNodes=state.mode==='loop'?G.layoutLoop(focused,overviewNodes,dimensions):overviewNodes;
    visibleEdges=state.mode==='loop'?loopEdges(focused):edges;
    nodeMap=new Map(overviewNodes.map(n=>[n.id,n]));for(const n of allNodes)nodeMap.set(n.id,n);
    routes=state.mode==='overview'?(overviewRoutes??=G.routeEdges(allNodes,visibleEdges,{...dimensions,mode:'overview',obstacles:groupObstacles})):G.routeEdges(allNodes,visibleEdges,{...dimensions,mode:'loop'});
    bounds=graphBounds(allNodes,routes,state.mode==='overview'?overviewGroups:[]);
    for(const id of ['groupLayer','edgeLayer','nodeLayer','badgeLayer'])$(id).replaceChildren();
    nodeEls.clear();edgeEls.clear();badgeEls.clear();
    drawDiagram(allNodes,visibleEdges,routes,{group:$('groupLayer'),edge:$('edgeLayer'),node:$('nodeLayer'),badge:$('badgeLayer')},{activeLoop:state.mode==='loop'?focused:null,regions:state.mode==='overview'?overviewGroups:[]});
    $('graphWrap').classList.toggle('isolated-loop',state.mode==='loop');
    $('categoryKey').hidden=state.mode==='loop';
  }

  function renderLists(){
    const q=state.query.trim().toLowerCase();
    const matches=(...parts)=>!q||parts.some(p=>str(p).toLowerCase().includes(q));
    $('loopList').innerHTML=['R','B'].map(type=>{const ls=loops.filter(l=>l.type===type&&matches(l.id,l.name,l.mechanism,...loopNodes(l).map(label)));if(!ls.length)return '';return `<div class="section-label">${type==='R'?'Reinforcing feedback':'Balancing feedback'}</div>`+ls.map(l=>`<button class="loop-card ${state.focusedLoop===l.id?'active':''}" data-select-loop="${esc(l.id)}" aria-pressed="${state.focusedLoop===l.id}"><div class="loop-card-top"><span class="loop-id ${esc(l.type)}">${esc(l.id)}</span><span class="loop-name">${esc(l.name)}</span></div><div class="loop-meta">${esc(l.evidenceCategory||'Conceptual mechanism')}<br>${loopNodes(l).length} variables · ${loopEdges(l).filter(e=>!['reported','indicator'].includes(e.status)).length} inferred / conditional links</div></button>`).join('');}).join('')||'<div class="empty-result">No matching loops.<br>Try a variable or mechanism.</div>';
    const es=edges.filter(e=>matches(e.id,label(e.source),label(e.target),e.rationale,status(e)));
    $('edgeList').innerHTML=es.map(e=>`<button class="edge-card ${state.selectedType==='edge'&&state.selectedId===e.id?'active':''}" data-select-edge="${esc(e.id)}"><div class="edge-title">${esc(label(e.source))} <span class="edge-arrow ${negative(e)?'negative':'positive'}">→ <b>${sign(e)}</b></span> ${esc(label(e.target))}</div><div class="edge-meta">${esc(e.id)} · ${esc(status(e))}</div></button>`).join('')||'<div class="empty-result">No matching relationships.</div>';
    const ns=nodes.filter(n=>matches(n.id,n.label,n.definition,n.domains));
    $('nodeList').innerHTML=ns.map(n=>`<button class="variable-card ${state.selectedType==='node'&&state.selectedId===n.id?'active':''}" data-select-node="${esc(n.id)}"><span class="variable-id">${esc(n.id)}</span><span class="variable-name">${esc(n.label)}</span></button>`).join('')||'<div class="empty-result">No matching variables.</div>';
  }
  const sourcesFor = (ids) => [...new Set(ids.map(id=>anchorMap.get(id)?.sourceId).filter(Boolean))];
  const evidenceIds = (es) => [...new Set(es.flatMap(e=>e.evidence||[]))];
  function evidenceHtml(ids){if(!ids?.length)return '<div class="evidence-empty">This relationship is a modelling assumption. It should be tested before the diagram is used for policy decisions.</div>';
    return [...new Set(ids)].map(id=>{const a=anchorMap.get(id);if(!a)return `<div class="evidence-empty">Evidence anchor ${esc(id)} is not available in this package.</div>`;const s=sourceMap.get(a.sourceId);return `<article class="evidence-card"><div class="evidence-top"><span class="source-code">${esc(a.sourceId)}</span><span>${esc(id)}</span><span>${esc(a.locator||'')}</span></div><p>${esc(a.paraphrase||a.text||a.excerpt||'')}</p>${a.quote?`<p>“${esc(a.quote)}”</p>`:''}<div class="evidence-source">${esc(s?.authors||'')} (${esc(s?.year||'')})${s?.title?` · ${esc(s.title)}`:''}</div>${link(a.url||s?.url||s?.fullTextUrl||(s?.doi?'https://doi.org/'+s.doi:''),'Open source','evidence-link')}</article>`;}).join('');
  }
  const assumptionHtml = (items) => items?.length ? `<ul class="assumption-list">${items.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>` : '<p>No additional loop-specific assumption is recorded. Link-level uncertainty still applies.</p>';
  const relatedLoopsHtml = (ls) => ls.length?ls.map(l=>`<button class="related-button" data-select-loop="${esc(l.id)}"><strong>${esc(l.id)}</strong> · ${esc(l.name)} <span aria-hidden="true">↗</span></button>`).join(''):'<p>This relationship participates in the full graph; it is not part of a highlighted loop.</p>';
  function backHtml(){const l=loopMap.get(state.focusedLoop);return l?`<button class="back-to-loop" data-select-loop="${esc(l.id)}">← Back to ${esc(l.id)} · ${esc(l.name)}</button>`:'';}
  function panel(html){$('inspectorContent').innerHTML=html;$('inspector').scrollTop=0;setPanel('inspector',true);}
  function showLoop(l){const s=signedLoop(l),es=s.edges,ids=evidenceIds(es),sourceIds=sourcesFor(ids),closed=isClosedLoop(l);
    const path=es.map((e,i)=>`<div class="path-step"><span class="path-step-number">${i+1}</span><div><button data-select-edge="${esc(e.id)}">${esc(label(e.source))} <span class="step-sign sign ${negative(e)?'negative':'positive'}">${sign(e)}</span> → ${esc(label(e.target))}</button><div class="path-edge-explanation">${esc(e.id)} · ${esc(status(e))}</div></div></div>`).join('');
    panel(`<section class="inspector-section"><div class="detail-kicker"><span class="loop-id ${esc(l.type)}">${esc(l.id)}</span> ${l.type==='B'?'BALANCING':'REINFORCING'} FEEDBACK</div><h2>${esc(l.name)}</h2><p class="lead">${esc(l.mechanism||l.description||'')}</p><div class="chip-row"><span class="chip ${l.type==='B'?'amber':'teal'}">${l.type==='B'?'Counteracts change':'Amplifies change'}</span>${l.evidenceCategory?`<span class="chip">${esc(l.evidenceCategory)}</span>`:''}<span class="chip">${es.length} causal links</span><span class="chip">${sourceIds.length} sources</span>${es.some(e=>e.delay)||l.delay?'<span class="chip">Includes a delay</span>':''}</div>${l.equityEffect?`<div class="effect-note"><strong>IMPLICATION FOR EQUITY</strong>${esc(l.equityEffect)}</div>`:''}</section><section class="inspector-section"><h3>Follow the closed path</h3>${path}<div class="parity-box"><strong>${s.negatives} negative ${s.negatives===1?'link':'links'} → product ${s.product} → ${s.type==='R'?'reinforcing':'balancing'}.</strong><br>${closed?'The path closes: the last relationship returns to the first variable.':'Loop closure requires review.'} Signs test structural polarity; they do not prove causation.</div></section><section class="inspector-section"><h3>Loop basis &amp; assumptions</h3>${l.evidenceCategory?`<span class="chip amber">${esc(l.evidenceCategory)}</span><p>${esc(l.reviewNote||'')}</p>`:''}${l.basis?`<p class="mechanism-note">${esc(l.basis)}</p>`:''}${assumptionHtml(l.assumptions)}</section><section class="inspector-section"><h3>Trace the evidence <span class="count-pill">${ids.length}</span></h3><p>These anchors support individual links. The complete feedback loop is a conceptual synthesis unless the source explicitly describes it.</p>${evidenceHtml(ids)}</section>`);
  }
  function showEdge(e){const src=nodeMap.get(e.source),tgt=nodeMap.get(e.target),ids=e.evidence||[];
    panel(`<section class="inspector-section">${backHtml()}<div class="detail-kicker">RELATIONSHIP ${esc(e.id)}</div><h2 class="detail-edge-heading">${esc(src?.label||e.source)}<br><span class="sign ${negative(e)?'negative':'positive'}">${sign(e)}</span> → ${esc(tgt?.label||e.target)}</h2><div class="direction-description ${negative(e)?'negative':''}"><span class="sign ${negative(e)?'negative':'positive'}">${sign(e)}</span><span>${negative(e)?'An increase in the source is hypothesised to decrease the target; a decrease is hypothesised to increase it.':'An increase in the source is hypothesised to increase the target; a decrease is hypothesised to decrease it.'}<br>Other things equal. The sign does not mean good or bad.</span></div><p class="lead">${esc(e.rationale||e.explanation||'')}</p><div class="chip-row"><span class="chip ${e.status==='reported'?'teal':'amber'}">${esc(status(e))}</span>${e.delay?'<span class="chip">Delayed effect ∥</span>':''}</div>${e.scope?`<p class="mechanism-note">${esc(e.scope)}</p>`:''}${e.assumptions?.length?`<div style="margin-top:16px">${assumptionHtml(e.assumptions)}</div>`:''}</section><section class="inspector-section"><h3>Why this arrow is in the model</h3>${e.derivation?`<p class="mechanism-note">${esc(e.derivation)}</p><p>${esc(e.evidenceBasis||'')}</p>`:evidenceHtml(ids)}</section><section class="inspector-section"><h3>Highlighted feedback loops</h3>${relatedLoopsHtml(edgeLoops(e.id))}</section><section class="inspector-section"><h3>Inspect the variables</h3><button class="related-button" data-select-node="${esc(e.source)}">${esc(e.source)} · ${esc(src?.label||e.source)} ↗</button><button class="related-button" data-select-node="${esc(e.target)}">${esc(e.target)} · ${esc(tgt?.label||e.target)} ↗</button></section>`);
  }
  function showNode(n){const incoming=edges.filter(e=>e.target===n.id),outgoing=edges.filter(e=>e.source===n.id),g=groupMap.get(n.group);
    const rel=(es,inbound)=>es.length?es.map(e=>`<button class="related-button" data-select-edge="${esc(e.id)}"><span class="sign ${negative(e)?'negative':'positive'}">${sign(e)}</span> ${esc(label(inbound?e.source:e.target))}<br><span class="muted">${esc(e.id)} · ${esc(status(e))}</span></button>`).join(''):'<p>No relationship is recorded in this direction.</p>';
    panel(`<section class="inspector-section">${backHtml()}<div class="detail-kicker">VARIABLE ${esc(n.id)}</div><h2>${esc(n.label)}</h2><p class="lead">${esc(n.definition||'')}</p><div class="chip-row">${g?`<span class="chip">${esc(g.label)}</span>`:''}${(n.domains||[]).map(d=>`<span class="chip">${esc(d)}</span>`).join('')}</div>${n.measurementNote?`<h3>Measurement boundary</h3><p class="mechanism-note">${esc(n.measurementNote)}</p>`:''}${n.note?`<p class="mechanism-note">${esc(n.note)}</p>`:''}</section>${["V33","V34"].includes(n.id)?populationHtml():''}<section class="inspector-section"><h3>What influences this variable <span class="count-pill">${incoming.length}</span></h3>${rel(incoming,true)}</section><section class="inspector-section"><h3>What this variable influences <span class="count-pill">${outgoing.length}</span></h3>${rel(outgoing,false)}</section><section class="inspector-section"><h3>Highlighted feedback loops</h3>${relatedLoopsHtml(nodeLoops(n.id))}</section>`);
  }
  function showSources(){
    state.selectedType='sources';state.selectedId=null;renderLists();updateGraph();
    panel(`<section class="inspector-section"><div class="detail-kicker">SOURCE LIBRARY · ${sources.length} RECORDS</div><h2>From papers to paths</h2><p class="lead">Every arrow has a stable ID and an explanation. Evidence anchors identify the source and location; inferred links remain explicitly labelled.</p><p>Page references follow the locator recorded for each anchor. A source supporting one mechanism does not validate every link or the whole model.</p></section><section class="inspector-section">${sources.map(s=>`<article class="source-item"><span class="source-code">${esc(s.id)}</span> <span class="muted">${esc(s.year||'')}</span><h4>${esc(s.title)}</h4><p>${esc(str(s.authors))}${s.journal?`<br><em>${esc(s.journal)}</em>`:''}${s.citation?`<br>${esc(s.citation)}`:''}</p><div class="source-links">${link(s.url||(s.doi?'https://doi.org/'+s.doi:''),'Publication')}${s.fullTextUrl&&s.fullTextUrl!==s.url?link(s.fullTextUrl,'Full text'):''}</div>${s.doi?`<p>DOI: ${esc(s.doi)}</p>`:''}${s.access?`<p><strong>Evidence access:</strong> ${esc(s.access)}</p>`:''}${s.note?`<p class="mechanism-note">${esc(s.note)}</p>`:''}</article>`).join('')}</section><section class="inspector-section"><h3>Download the evidence register</h3><p>Inspect every source-to-arrow connection outside this interface.</p><a class="evidence-link" href="evidence_anchors.csv" download>Evidence anchors as CSV ↓</a></section>`);
  }
  function populationHtml(){
    const p=M.meta?.population;if(!p)return '';
    return `<section class="inspector-section population-guide"><h3>Who is this model about?</h3><p><strong>${esc(p.term)}</strong><br>${esc(p.definition)}</p><p>${esc(p.studyGroup)}</p><p><strong>Possible study populations</strong></p>${assumptionHtml(p.examples)}<p>${esc(p.exampleNote)}</p><p><strong>${esc(p.referenceTerm)}</strong><br>${esc(p.referenceDefinition)}</p><p class="mechanism-note">${esc(p.cohortRule)}</p><h3>How to read the two gaps</h3><p>${esc(p.gapInterpretation)}</p></section>`;
  }
  function showMethod(){
    state.selectedType='method';state.selectedId=null;renderLists();updateGraph();const meta=M.meta||{};
    const asArray=value=>Array.isArray(value)?value:value?[value]:[];
    const limitations=[...asArray(meta.limitations),...asArray(M.modelNotes)];
    const p=M.provenance||{};
    const provenanceHtml=M.provenance?`<section class="inspector-section"><h3>Model provenance</h3><p><strong>Modelling brief:</strong> ${esc(p.brief||p.ppt?.filename||(typeof p.ppt==='string'?p.ppt:'User-supplied presentation'))}</p>${p.slides?`<p>${esc(p.slides)}</p>`:''}${p.sourceSelection?`<p>${esc(p.sourceSelection)}</p>`:''}${p.targetVariables?`<p>${esc(p.targetVariables)}</p>`:''}${p.verifiedOn?`<p><strong>Sources checked:</strong> ${esc(p.verifiedOn)}</p>`:''}${p.note?`<p>${esc(p.note)}</p>`:''}${p.corrections?.length?`<h3 style="margin-top:20px">Brief reconciliation</h3>${assumptionHtml(p.corrections)}`:''}${meta.validationStatus?`<p class="mechanism-note">${esc(meta.validationStatus)}</p>`:''}</section>`:'';
    panel(`<section class="inspector-section"><div class="detail-kicker">METHOD &amp; READING GUIDE</div><h2>A map of mechanisms</h2><p class="lead">${esc(meta.problem||'Which factors create inequity in the built environment, what are their effects on people, and which feedback mechanisms increase or decrease equity?')}</p>${meta.definition?`<p>${esc(meta.definition)}</p>`:''}${meta.scope?`<p class="mechanism-note">${esc(meta.scope)}</p>`:''}</section>${populationHtml()}<section class="inspector-section"><h3>Read the notation</h3><div class="notation-item"><strong><span class="sign positive">+</span> Same direction, other things equal</strong><p>Increasing the source tends to increase the target. Decreasing the source tends to decrease the target.</p></div><div class="notation-item"><strong><span class="sign negative">−</span> Opposite direction, other things equal</strong><p>Increasing the source tends to decrease the target. Decreasing the source tends to increase the target. Polarity is separate from desirability.</p></div><div class="notation-item"><strong>R · Reinforcing feedback</strong><p>A closed path with an even number of negative arrows amplifies a change. It can sustain either improvement or deterioration.</p></div><div class="notation-item"><strong>B · Balancing feedback</strong><p>A closed path with an odd number of negative arrows counteracts a change. A balancing loop can also constrain beneficial change.</p></div><div class="notation-item"><strong>Solid, dashed, dotted &amp; delayed</strong><p>Solid arrows denote source-reported directional mechanisms. Dashed arrows identify inferred or conditional relationships, including algebraic definitions. Inspect the arrow to distinguish these evidence bases. Dotted arrows identify conditional disparity indicators. The double bar ∥ marks an expected delay, not an estimated duration.</p></div></section><section class="inspector-section"><h3>Evidence strength stays visible</h3>${Object.entries(statusNames).map(([id,name])=>`<div class="notation-item"><strong>${esc(name)}</strong><p>${esc({reported:'A directional mechanism described in the cited source. This label includes qualitative and conceptual evidence; it is not a causal-effect estimate.',association:'An observed association oriented as an explicit causal hypothesis. Reverse causation or confounding may remain.',synthesis:'A connection assembled across sources and systems reasoning. It requires empirical validation.',policy:'A possible response that operates only if the relevant institution acts, the intervention reaches residents facing disadvantage, and implementation is effective.',indicator:'A proposed relationship to a between-group prevalence gap. Thresholds, overlap and reference-group change are explicit.',definition:'An algebraic consequence of the variable definitions. Its scope and derivation are shown instead of an empirical citation.'}[id])}</p></div>`).join('')}</section>${meta.needs?.length?`<section class="inspector-section"><h3>Human needs in the system</h3><div class="needs-list">${meta.needs.map(n=>`<span>${esc(n)}</span>`).join('')}</div></section>`:''}<section class="inspector-section"><h3>Limits of interpretation</h3>${assumptionHtml(limitations.length?limitations:['This literature-informed model is a structured hypothesis, not a numerical simulation or a causal identification study.','Highlighted loops are a selected explanatory set; other closed paths may exist.','Relationships depend on population, place, institutional context and time scale.'])}</section><section class="inspector-section"><h3>Scientific review</h3><p>Variable meanings, causal directions and loop evidence categories were reviewed on 3 November 2026. This is an AI-assisted review, not independent expert validation.</p><a class="evidence-link" href="CLD_REVIEW.html" target="_blank" rel="noopener">Open the complete review ↗</a><br><a class="evidence-link" href="cld_review.json" download>Download the change ledger ↓</a></section>${provenanceHtml}`);
  }



  function updateGraph(){
    const focused=loopMap.get(state.focusedLoop);let activeEdges=null,activeNodes=null;
    if(focused){activeEdges=new Set(focused.edges);activeNodes=new Set(loopNodes(focused));}
    if(state.selectedType==='edge'){
      const e=edgeMap.get(state.selectedId);
      if(e){activeEdges=activeEdges||new Set();activeNodes=activeNodes||new Set();activeEdges.add(e.id);activeNodes.add(e.source);activeNodes.add(e.target);}
    }
    if(state.selectedType==='node'&&!focused){const id=state.selectedId;activeEdges=new Set(edges.filter(e=>e.source===id||e.target===id).map(e=>e.id));activeNodes=new Set([id,...edges.filter(e=>activeEdges.has(e.id)).flatMap(e=>[e.source,e.target])]);}
    for(const [id,{el,path,hit}]of edgeEls){
      const dim=activeEdges&&!activeEdges.has(id),e=edgeMap.get(id),selected=state.selectedType==='edge'&&state.selectedId===id;
      el.classList.toggle('dimmed',!!dim);el.classList.toggle('selected',selected);
      if(hit)hit.style.pointerEvents=dim?'none':'';
      path.setAttribute('marker-end',`url(#arrow-${dim?'muted':marker(e)})`);
      if(selected)el.parentNode.append(el);
    }
    for(const [id,el]of nodeEls){el.classList.toggle('dimmed',!!activeNodes&&!activeNodes.has(id));el.classList.toggle('active',state.selectedType==='node'&&state.selectedId===id);}
    $('viewEyebrow').textContent=focused?`${focused.id} · ${focused.type==='B'?'BALANCING':'REINFORCING'} FEEDBACK`:`COMPLETE SYSTEM MAP | ${nodes.length} VARIABLES | ${edges.length} LINKS`;
    $('viewTitle').textContent=focused?focused.name:'The connected system';
    $('viewMode').textContent=state.mode==='loop'?'Isolated loop':focused?'Loop in themed map':'Themed map';
    $('loopViewToggle').disabled=!focused;
    $('loopViewToggle').textContent=state.mode==='loop'?'Show in full system':'Isolate loop';
    $('loopViewToggle').setAttribute('aria-pressed',String(state.mode==='loop'));
    $('loopPosition').textContent=focused?`${loops.indexOf(focused)+1} / ${loops.length}`:`${loops.length} loops`;
    $('showSystem').setAttribute('aria-pressed',String(!focused));
  }
  function transform(){
    $('viewport').setAttribute('transform',`translate(${state.tx} ${state.ty}) scale(${state.scale})`);
    $('zoomLabel').textContent=Math.round(state.scale*100)+'%';
  }
  function fitCurrent(){
    if(!bounds)return;
    const r=$('graphWrap').getBoundingClientRect();if(!r.width||!r.height)return;
    const focused=state.mode==='overview'?loopMap.get(state.focusedLoop):null;
    const frame=focused?graphBounds(loopNodes(focused).map(id=>nodeMap.get(id)),new Map(focused.edges.map(id=>[id,routes.get(id)]).filter(([,r])=>r))):bounds;
    const padding=state.mode==='loop'?44:20;
    const scale=Math.min((r.width-padding)/(frame.maxX-frame.minX),(r.height-padding)/(frame.maxY-frame.minY),state.mode==='loop'?1.65:1.15);
    state.scale=Math.max(.12,scale);state.tx=r.width/2-(frame.minX+frame.maxX)/2*state.scale;state.ty=r.height/2-(frame.minY+frame.maxY)/2*state.scale;
    state.autoFit=true;lastViewport={width:r.width,height:r.height};transform();
  }
  function scheduleFit(){cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>requestAnimationFrame(fitCurrent));}
  function zoom(factor,cx,cy){
    const r=$('graphWrap').getBoundingClientRect();cx??=r.width/2;cy??=r.height/2;
    const old=state.scale,next=Math.min(3.5,Math.max(.12,old*factor));
    state.tx=cx-(cx-state.tx)*next/old;state.ty=cy-(cy-state.ty)*next/old;state.scale=next;state.autoFit=false;transform();
  }
  function syncPanels(){
    const w=$('workspace');w.classList.toggle('explorer-collapsed',!state.explorerOpen);w.classList.toggle('inspector-collapsed',!state.inspectorOpen);
    for(const [name,open,id]of [['Explorer',state.explorerOpen,'explorer'],['Inspector',state.inspectorOpen,'inspector']]){
      $('toggle'+name).setAttribute('aria-expanded',String(open));$('toggle'+name).setAttribute('aria-pressed',String(open));$(id).hidden=!open;
    }
  }
  function setPanel(name,open){
    if(name==='explorer'){state.explorerOpen=open;if(open&&innerWidth<=760)state.inspectorOpen=false;}
    else {state.inspectorOpen=open;if(open&&innerWidth<=760)state.explorerOpen=false;}
    syncPanels();
  }
  function rememberSelection(kind,id){
    try{const url=new URL(location.href);url.hash=id?`${kind}=${encodeURIComponent(id)}`:'';history.replaceState(null,'',url.href);}catch{/* The map still works if file history is restricted. */}
  }
  function selectLoop(id,doFit=true){
    const l=loopMap.get(id);if(!l)return;
    const changed=state.focusedLoop!==id||state.mode!==(state.loopView?'loop':'overview');
    state.focusedLoop=id;state.selectedType='loop';state.selectedId=id;
    showLoop(l);if(changed)renderGraph();updateGraph();renderLists();rememberSelection('loop',id);if(doFit)scheduleFit();
  }
  function selectEdge(id){
    const e=edgeMap.get(id);if(!e)return;
    if(state.mode==='loop'&&!edgeEls.has(id)){state.focusedLoop=null;renderGraph();}
    state.selectedType='edge';state.selectedId=id;showEdge(e);updateGraph();renderLists();rememberSelection('link',id);
  }
  function selectNode(id){
    const n=nodeMap.get(id);if(!n)return;
    if(state.mode==='loop'&&!nodeEls.has(id)){state.focusedLoop=null;renderGraph();}
    state.selectedType='node';state.selectedId=id;showNode(n);updateGraph();renderLists();rememberSelection('node',id);
  }
  function overview(){
    state.focusedLoop=null;showMethod();setPanel('inspector',false);
    renderGraph();updateGraph();renderLists();rememberSelection('',null);scheduleFit();
  }
  function setLoopView(isolate){state.loopView=!!isolate;if(state.focusedLoop){renderGraph();updateGraph();scheduleFit();}}
  function nextLoop(step){let i=loops.findIndex(l=>l.id===state.focusedLoop);if(i<0)i=step>0?-1:0;const l=loops[(i+step+loops.length)%loops.length];if(l)selectLoop(l.id);}
  function setTab(tab){
    state.tab=tab;state.query='';$('searchInput').value='';$('searchInput').placeholder=tab==='loops'?'Search loops…':tab==='links'?'Search relationships…':'Search variables…';
    $('explorerHint').textContent={loops:'Select a loop to highlight its path in the themed map.',links:'Every relationship is available here, even where curves cross.',variables:'Select a variable to inspect its definition and connections.'}[tab];
    for(const b of document.querySelectorAll('[data-tab]')){b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-selected',b.dataset.tab===tab);}
    $('loopList').hidden=tab!=='loops';$('edgeList').hidden=tab!=='links';$('nodeList').hidden=tab!=='variables';renderLists();
  }
  function finishFullscreen(){
    if(!state.fullscreen)return;state.fullscreen=false;state.fullscreenNative=false;
    $('workspace').classList.remove('is-fullscreen');document.body.classList.remove('has-fullscreen-map');
    if(state.fullscreenPanels){state.explorerOpen=state.fullscreenPanels.explorerOpen;state.inspectorOpen=state.fullscreenPanels.inspectorOpen;}
    state.fullscreenPanels=null;syncPanels();$('fullscreenButton').textContent='Full screen';$('fullscreenButton').setAttribute('aria-pressed','false');scheduleFit();$('fullscreenButton').focus({preventScroll:true});
  }
  async function toggleFullscreen(){
    if(state.fullscreen){
      if(document.fullscreenElement){try{await document.exitFullscreen();}catch{toast('Press Esc to exit full screen.');return;}}
      finishFullscreen();return;
    }
    state.fullscreenPanels={explorerOpen:state.explorerOpen,inspectorOpen:state.inspectorOpen};state.fullscreen=true;
    state.explorerOpen=false;state.inspectorOpen=false;syncPanels();
    $('workspace').classList.add('is-fullscreen');document.body.classList.add('has-fullscreen-map');
    $('fullscreenButton').textContent='Exit full screen';$('fullscreenButton').setAttribute('aria-pressed','true');
    if($('workspace').requestFullscreen){try{state.fullscreenNative=true;await $('workspace').requestFullscreen({navigationUI:'hide'});}catch{state.fullscreenNative=false;}}
    scheduleFit();
  }
  function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,3000);}
  function download(name,body,type){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([body],{type}));a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
  function buildExportSvg({fullSystem=false}={}){
    const focused=!fullSystem&&state.mode==='loop'?loopMap.get(state.focusedLoop):null;
    const ns=fullSystem?overviewNodes:allNodes,es=fullSystem?edges:visibleEdges;
    const rs=fullSystem&&state.mode==='loop'?(overviewRoutes??=G.routeEdges(ns,es,{...dimensions,mode:'overview',obstacles:groupObstacles})):routes;
    const regions=fullSystem||state.mode==='overview'?overviewGroups:[];
    const svg=svgEl('svg',{xmlns:NS,version:'1.1',width:1,height:1,viewBox:'0 0 1 1',role:'img','data-cld-export':'true'});
    const title=focused?`${focused.id} · ${focused.name}`:'Built environment equity · Full system';
    svgEl('title',{},svg).textContent=title;
    svgEl('desc',{},svg).textContent=`${ns.length} variables and ${es.length} signed relationships. ${focused?focused.evidenceCategory+'. ':''}Conceptual model ${M.version}. Signs indicate direction, not desirability.`;
    svg.append($('graph').querySelector('defs').cloneNode(true));
    const style=svgEl('style',{},svg);style.textContent=`
      [data-cld-export] text,[data-cld-export] .node-label,[data-cld-export] .node-id,[data-cld-export] .edge-sign,[data-cld-export] .edge-delay{font-family:"Segoe UI",Arial,sans-serif}
      [data-cld-export] .group-background{fill-opacity:.08;stroke-opacity:.28;stroke-width:1;stroke-dasharray:3 7}
      [data-cld-export] .group-label{fill:#5b716b;font-size:12px;font-weight:600;letter-spacing:1px}
      [data-cld-export] .edge-visual,[data-cld-export] .edge-terminal{fill:none;stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round;vector-effect:none}
      [data-cld-export] .edge-terminal{stroke-linecap:butt}
      [data-cld-export] .edge-hypothesis .edge-visual{stroke-dasharray:7 5}
      [data-cld-export] .edge-indicator .edge-visual{stroke-dasharray:2 6}
      [data-cld-export] .polarity-bg{fill:#fff;stroke:#c5d3cb;stroke-width:1;vector-effect:none}
      [data-cld-export] .edge-sign{font-size:19px;font-weight:800}
      [data-cld-export] .edge-delay{font-size:17px;font-weight:750;fill:#3f5f58}
      [data-cld-export] .node-box{fill:#fff;stroke:#aabeb6;stroke-width:1.45;vector-effect:none}
      [data-cld-export] .node-id{font-size:11px;font-weight:600;fill:#5e7377;letter-spacing:.55px}
      [data-cld-export] .node-label{font-size:18px;font-weight:650;fill:#17343b;letter-spacing:0}
      [data-cld-export] .loop-badge circle{stroke:#fff;stroke-width:3}
      [data-cld-export] .loop-badge text{fill:#fff;text-anchor:middle;dominant-baseline:middle;font-size:16px;font-weight:750}
    `;
    const background=svgEl('rect',{fill:'#fcfdfb'},svg);
    const graph=svgEl('g',{'data-export-diagram':'true'},svg);
    const layer={group:svgEl('g',{},graph),edge:svgEl('g',{},graph),node:svgEl('g',{},graph),badge:svgEl('g',{},graph)};
    drawDiagram(ns,es,rs,layer,{interactive:false,activeLoop:focused,regions});
    // Measure rendered paths AND labels, independent of the viewport's pan/zoom.
    // A scoped, hidden host gives SVG text real font metrics without altering UI.
    const host=document.createElement('div');
    host.style.cssText='position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none';
    host.append(svg);document.body.append(host);
    try{
      const b=graph.getBBox(),padding=20,width=Math.ceil(b.width+padding*2);
      let cursor=padding;
      function textRows(text,size,weight,lineHeight,fill){
        measure.font=`${weight} ${size}px "Segoe UI", Arial, sans-serif`;
        const lines=[];let line='';
        for(const word of text.split(/\s+/)){
          const next=line?line+' '+word:word;
          if(line&&measure.measureText(next).width>width-padding*2){lines.push(line);line=word;}else line=next;
        }
        if(line)lines.push(line);
        for(const row of lines){
          svgEl('text',{x:padding,y:cursor+size,'font-family':'Segoe UI,Arial,sans-serif','font-size':size,'font-weight':weight,fill},svg).textContent=row;
          cursor+=lineHeight;
        }
      }
      textRows(title,20,650,26,'#173c43');
      const sub=focused?`${focused.evidenceCategory} · ${ns.length} variables · ${es.length} relationships`:`${ns.length} variables · ${es.length} relationships · Six literature sources`;
      textRows(sub,12,400,18,'#42585b');
      cursor+=14;
      graph.setAttribute('transform',`translate(${padding-b.x} ${cursor-b.y})`);
      cursor+=b.height+16;
      const legend=[
        '+ Same direction     − Opposite direction     ∥ Delay (duration not estimated)',
        'Solid: source-reported     Dashed: inferred / conditional / definition     Dotted: disparity indicator',
        'R: reinforcing     B: balancing     Loop type does not determine benefit or harm.',
        `Conceptual model ${M.version}. Evidence and assumptions: see the interactive atlas.`
      ];
      legend.forEach(text=>textRows(text,12,400,18,'#354e54'));
      const height=Math.ceil(cursor+padding);
      svg.setAttribute('width',width);svg.setAttribute('height',height);
      svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
      background.setAttribute('width',width);background.setAttribute('height',height);
      return '<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(svg);
    }finally{host.remove();}
  }
  function exportSvg(fullSystem=false){const suffix=!fullSystem&&state.mode==='loop'?state.focusedLoop.toLowerCase():'full-system';download(`built-environment-equity-${suffix}.svg`,buildExportSvg({fullSystem}),'image/svg+xml');toast('Diagram exported with its legend and model version.');}

  document.addEventListener('click',ev=>{
    const loop=ev.target.closest('[data-select-loop]'),edge=ev.target.closest('[data-select-edge]'),node=ev.target.closest('[data-select-node]');
    if(loop)selectLoop(loop.dataset.selectLoop);else if(edge)selectEdge(edge.dataset.selectEdge);else if(node)selectNode(node.dataset.selectNode);
    if(!ev.target.closest('.download-wrap')){$('downloadMenu').hidden=true;$('downloadButton').setAttribute('aria-expanded','false');}
  });
  document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
  $('searchInput').addEventListener('input',ev=>{state.query=ev.target.value;renderLists();});
  for(const id of ['overviewButton','resetFocus','showSystem'])$(id).addEventListener('click',overview);
  for(const id of ['methodButton','legendButton'])$(id).addEventListener('click',showMethod);
  $('sourcesButton').addEventListener('click',showSources);
  $('toggleExplorer').addEventListener('click',()=>setPanel('explorer',!state.explorerOpen));
  $('toggleInspector').addEventListener('click',()=>setPanel('inspector',!state.inspectorOpen));
  $('fullscreenButton').addEventListener('click',toggleFullscreen);
  document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&state.fullscreenNative)finishFullscreen();else if(document.fullscreenElement===$('workspace'))scheduleFit();});
  $('loopViewToggle').addEventListener('click',()=>setLoopView(state.mode!=='loop'));
  $('previousLoop').addEventListener('click',()=>nextLoop(-1));$('nextLoop').addEventListener('click',()=>nextLoop(1));
  $('zoomIn').addEventListener('click',()=>zoom(1.25));$('zoomOut').addEventListener('click',()=>zoom(.8));
  for(const id of ['fitView','fitAll'])$(id).addEventListener('click',fitCurrent);
  $('actualSize').addEventListener('click',()=>zoom(1/state.scale));
  $('exportView').addEventListener('click',()=>exportSvg(false));
  $('downloadButton').addEventListener('click',()=>{const open=$('downloadMenu').hidden;$('downloadMenu').hidden=!open;$('downloadButton').setAttribute('aria-expanded',String(open));});
  $('exportSvg').addEventListener('click',()=>{exportSvg(true);$('downloadMenu').hidden=true;});
  $('exportJson').addEventListener('click',()=>{download('model.json',JSON.stringify(M,null,2),'application/json');$('downloadMenu').hidden=true;toast('Full model, sources and evidence exported.');});
  $('graph').addEventListener('wheel',ev=>{ev.preventDefault();const r=$('graph').getBoundingClientRect();zoom(Math.exp(-ev.deltaY*.0015),ev.clientX-r.left,ev.clientY-r.top);},{passive:false});
  const pointers=new Map();let pinch=null;
  $('graph').addEventListener('pointerdown',ev=>{
    if(ev.button!==0)return;pointers.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
    if(pointers.size===2){const [a,b]=[...pointers.values()],r=$('graph').getBoundingClientRect(),x=(a.x+b.x)/2-r.left,y=(a.y+b.y)/2-r.top;pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),scale:state.scale,worldX:(x-state.tx)/state.scale,worldY:(y-state.ty)/state.scale};state.drag=null;suppressClickUntil=performance.now()+500;}
    else state.drag={x:ev.clientX,y:ev.clientY,tx:state.tx,ty:state.ty,moved:false};
  });
  $('graph').addEventListener('pointermove',ev=>{
    if(pointers.has(ev.pointerId))pointers.set(ev.pointerId,{x:ev.clientX,y:ev.clientY});
    if(pinch&&pointers.size===2){const [a,b]=[...pointers.values()],r=$('graph').getBoundingClientRect();state.scale=Math.max(.12,Math.min(3.5,pinch.scale*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.distance)));state.tx=(a.x+b.x)/2-r.left-pinch.worldX*state.scale;state.ty=(a.y+b.y)/2-r.top-pinch.worldY*state.scale;state.autoFit=false;suppressClickUntil=performance.now()+300;transform();return;}
    if(!state.drag)return;const dx=ev.clientX-state.drag.x,dy=ev.clientY-state.drag.y;
    if(Math.hypot(dx,dy)>4&&!state.drag.moved){state.drag.moved=true;$('graph').setPointerCapture(ev.pointerId);}
    if(state.drag.moved){$('graph').classList.add('dragging');state.tx=state.drag.tx+dx;state.ty=state.drag.ty+dy;state.autoFit=false;suppressClickUntil=performance.now()+200;transform();}
  });
  const endDrag=ev=>{pointers.delete(ev.pointerId);if(pointers.size<2)pinch=null;if(state.drag?.moved)suppressClickUntil=performance.now()+200;state.drag=null;$('graph').classList.remove('dragging');};
  $('graph').addEventListener('pointerup',endDrag);$('graph').addEventListener('pointercancel',endDrag);
  document.addEventListener('keydown',ev=>{
    const typing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.activeElement?.isContentEditable;
    if(ev.key==='Escape'){$('downloadMenu').hidden=true;$('downloadButton').setAttribute('aria-expanded','false');if(state.fullscreen){ev.preventDefault();toggleFullscreen();}else if(innerWidth<=760){setPanel('explorer',false);setPanel('inspector',false);}return;}
    if(typing||ev.ctrlKey||ev.metaKey||ev.altKey)return;
    if(ev.key==='/'){ev.preventDefault();setPanel('explorer',true);$('searchInput').focus();}
    else if(ev.key.toLowerCase()==='f'){ev.preventDefault();toggleFullscreen();}
    else if(ev.key==='0'){ev.preventDefault();fitCurrent();}
    else if(ev.key==='+'||ev.key==='='){ev.preventDefault();zoom(1.25);}
    else if(ev.key==='-'){ev.preventDefault();zoom(.8);}
    else if(document.activeElement===$('graph')&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(ev.key)){ev.preventDefault();state.tx+=ev.key==='ArrowLeft'?60:ev.key==='ArrowRight'?-60:0;state.ty+=ev.key==='ArrowUp'?60:ev.key==='ArrowDown'?-60:0;state.autoFit=false;transform();}
  });
  new ResizeObserver(()=>{
    const r=$('graphWrap').getBoundingClientRect();if(!r.width||!r.height)return;
    if(state.autoFit)fitCurrent();else {state.tx+=(r.width-lastViewport.width)/2;state.ty+=(r.height-lastViewport.height)/2;lastViewport={width:r.width,height:r.height};transform();}
  }).observe($('graphWrap'));
  syncPanels();renderGraph();renderLists();
  requestAnimationFrame(()=>{
    const hash=new URLSearchParams(location.hash.slice(1));
    if(loopMap.has(hash.get('loop')))selectLoop(hash.get('loop'));
    else if(edgeMap.has(hash.get('link'))){overview();selectEdge(hash.get('link'));}
    else if(nodeMap.has(hash.get('node'))){overview();selectNode(hash.get('node'));}
    else overview();
  });
  window.CLD_ATLAS=Object.freeze({selectLoop,selectEdge,selectNode,overview,showSources,showMethod,setLoopView,toggleFullscreen,fitCurrent,buildExportSvg,
    getViewState:()=>({mode:state.mode,focusedLoop:state.focusedLoop,selectedType:state.selectedType,selectedId:state.selectedId,scale:state.scale,explorerOpen:state.explorerOpen,inspectorOpen:state.inspectorOpen,fullscreen:state.fullscreen,autoFit:state.autoFit}),
    validate:()=>({nodes:nodes.length,edges:edges.length,loops:loops.length,renderedEdges:edgeEls.size,renderedNodes:nodeEls.size,mode:state.mode,geometry:G.routeStats?.(routes),loopChecks:loops.map(l=>({id:l.id,closed:isClosedLoop(l),computedType:signedLoop(l).type,declaredType:l.type})),missingAnchors:edges.flatMap(e=>(e.evidence||[]).filter(id=>!anchorMap.has(id)).map(id=>({edge:e.id,anchor:id}))),missingEndpoints:edges.filter(e=>!nodeMap.has(e.source)||!nodeMap.has(e.target)).map(e=>e.id)})});
})();
