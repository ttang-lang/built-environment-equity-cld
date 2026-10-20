/* Causal Atlas — buildless, local-first, evidence-linked CLD explorer. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const M = window.CLD_MODEL;
  if (!M || !Array.isArray(M.nodes) || !M.nodes.length) {
    $('emptyModel').hidden = false;
    $('viewTitle').textContent = 'Model unavailable';
    $('inspectorContent').innerHTML = '<div class="inspector-section"><h2>Open the complete package</h2><p>This page uses the accompanying model.js file. Keep all files in this folder together.</p></div>';
    return;
  }
  const nodes = M.nodes, edges = M.edges || [], loops = M.loops || [], sources = M.sources || [], anchors = M.anchors || [];
  const nodeMap = new Map(nodes.map((n, i) => [n.id, {...n, x: Number.isFinite(n.x) ? n.x : 180 + (i % 7) * 290, y: Number.isFinite(n.y) ? n.y : 130 + Math.floor(i / 7) * 170}]));
  const edgeMap = new Map(edges.map(e => [e.id, e]));
  const loopMap = new Map(loops.map(l => [l.id, l]));
  const sourceMap = new Map(sources.map(s => [s.id, s]));
  const anchorMap = new Map(anchors.map(a => [a.id, a]));
  const groupMap = new Map((M.groups || []).map(g => [g.id, g]));
  const statusNames = {reported: 'Source-reported mechanism', association: 'Association-based hypothesis', synthesis: 'Cross-source synthesis', policy: 'Conditional policy response', indicator: 'Disparity indicator'};
  const state = {tab: 'loops', query: '', selectedType: null, selectedId: null, focusedLoop: null, scale: 1, tx: 0, ty: 0, drag: null};
  const nodeEls = new Map(), edgeEls = new Map(), badgeEls = new Map(), routes = new Map();
  const W = 190, H = 66;
  let toastTimer, resizeTimer;
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const str = (x) => Array.isArray(x) ? x.join(', ') : String(x ?? '');
  const label = (id) => nodeMap.get(id)?.label || id;
  const sign = (e) => Number(e.polarity) < 0 ? '−' : '+';
  const negative = (e) => Number(e.polarity) < 0;
  const status = (e) => statusNames[e.status] || e.status || 'Modelled relationship';
  const svgEl = (tag, attrs = {}, parent) => { const el = document.createElementNS(NS, tag); for (const [k,v] of Object.entries(attrs)) el.setAttribute(k, v); if (parent) parent.append(el); return el; };
  const safeUrl = (value) => { if (!value || typeof value !== 'string') return ''; try { const u = new URL(value, location.href); return ['https:', 'http:', 'file:'].includes(u.protocol) && !String(value).includes('javascript:') ? u.href : ''; } catch { return ''; } };
  const link = (url, text, cls = '') => { const u = safeUrl(url); return u ? `<a class="${esc(cls)}" href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(text)} ↗</a>` : ''; };
  const loopEdges = (loop) => (loop.edges || []).map(id => edgeMap.get(id)).filter(Boolean);
  const loopNodes = (loop) => [...new Set(loop.nodes || loopEdges(loop).flatMap(e => [e.source,e.target]))];
  const nodeLoops = (id) => loops.filter(l => loopNodes(l).includes(id));
  const edgeLoops = (id) => loops.filter(l => (l.edges || []).includes(id));
  const signedLoop = (l) => { const es = loopEdges(l), negatives = es.filter(negative).length; return {negatives, product: negatives % 2 ? '−' : '+', type: negatives % 2 ? 'B' : 'R', edges: es}; };
  const isClosedLoop = (l) => { const es = loopEdges(l); return es.length > 1 && es.every((e,i) => e.target === es[(i+1)%es.length].source); };

  $('nodeCount').textContent = nodes.length;
  $('edgeCount').textContent = edges.length;
  $('loopCount').textContent = loops.length;
  $('loopTabCount').textContent = loops.length;
  $('edgeTabCount').textContent = edges.length;
  $('sourceCount').textContent = sources.length;
  if (M.meta?.subtitle) $('introDescription').textContent = M.meta.subtitle;
  document.title = (M.meta?.title || 'Built Environment Equity') + ' · Causal Atlas';

  // Route arrows around every variable box on an orthogonal occupancy grid.
  // A shared congestion cost spreads nearby arrows while preserving the same graph.
  class Heap {
    constructor(){this.a=[];}
    push(v){let i=this.a.push(v)-1;while(i){const p=(i-1)>>1;if(this.a[p].f<=v.f)break;this.a[i]=this.a[p];i=p;}this.a[i]=v;}
    pop(){if(!this.a.length)return null;const top=this.a[0],last=this.a.pop();if(this.a.length){let i=0;while(true){let l=i*2+1,r=l+1;if(l>=this.a.length)break;let c=r<this.a.length&&this.a[r].f<this.a[l].f?r:l;if(this.a[c].f>=last.f)break;this.a[i]=this.a[c];i=c;}this.a[i]=last;}return top;}
  }
  const GRID = 22;
  const allNodes = [...nodeMap.values()];
  const bounds = {minX: Math.min(...allNodes.map(n => n.x)) - 220, maxX: Math.max(...allNodes.map(n => n.x)) + 220, minY: Math.min(...allNodes.map(n => n.y)) - 180, maxY: Math.max(...allNodes.map(n => n.y)) + 180};
  const originX = Math.floor(bounds.minX / GRID) * GRID, originY = Math.floor(bounds.minY / GRID) * GRID;
  const cols = Math.ceil((bounds.maxX-originX)/GRID)+1, rows = Math.ceil((bounds.maxY-originY)/GRID)+1;
  const blocked = new Uint8Array(cols*rows), traffic = new Uint16Array(cols*rows);
  const gridPos = (p) => ({x: Math.max(0,Math.min(cols-1,Math.round((p.x-originX)/GRID))),y: Math.max(0,Math.min(rows-1,Math.round((p.y-originY)/GRID)))});
  const pixelPos = (p) => ({x:originX+p.x*GRID,y:originY+p.y*GRID});
  for(const n of allNodes){for(let gy=0;gy<rows;gy++){const y=originY+gy*GRID;if(Math.abs(y-n.y)>H/2+12)continue;for(let gx=0;gx<cols;gx++){const x=originX+gx*GRID;if(Math.abs(x-n.x)<=W/2+12)blocked[gy*cols+gx]=1;}}}
  const ports = (n, incoming=false) => {
    // Separate entry and exit lanes prevent reciprocal arrows from sharing
    // an entire clickable segment next to a node.
    const sideOffset=incoming?15:-15, endOffset=incoming?35:-35;
    return [
      {side:'e',a:{x:n.x+W/2+2,y:n.y+sideOffset},b:{x:n.x+W/2+34,y:n.y+sideOffset}},
      {side:'w',a:{x:n.x-W/2-2,y:n.y+sideOffset},b:{x:n.x-W/2-34,y:n.y+sideOffset}},
      {side:'s',a:{x:n.x+endOffset,y:n.y+H/2+2},b:{x:n.x+endOffset,y:n.y+H/2+34}},
      {side:'n',a:{x:n.x+endOffset,y:n.y-H/2-2},b:{x:n.x+endOffset,y:n.y-H/2-34}}
    ];
  };
  function astar(start,end){
    const s=gridPos(start),t=gridPos(end),sid=s.y*cols+s.x,tid=t.y*cols+t.x;
    const heap=new Heap(),cost=new Map([[sid,0]]),from=new Map(),dirs=[[1,0],[-1,0],[0,1],[0,-1]];
    heap.push({id:sid,x:s.x,y:s.y,f:0,g:0});let count=0;
    while(heap.a.length&&count++<cols*rows*3){const cur=heap.pop();if(cur.g!==(cost.get(cur.id)??Infinity))continue;if(cur.id===tid){const path=[];let p=tid;while(p!==undefined){path.push({x:p%cols,y:Math.floor(p/cols)});p=from.get(p);}path.reverse();return {points:path.map(pixelPos),cells:path.map(p=>p.y*cols+p.x),cost:cur.g};}
      for(const [dx,dy] of dirs){const x=cur.x+dx,y=cur.y+dy,id=y*cols+x;if(x<0||x>=cols||y<0||y>=rows||(blocked[id]&&id!==sid&&id!==tid))continue;const g=cur.g+1+Math.min(traffic[id],6)*3.5;if(g<(cost.get(id)??Infinity)){cost.set(id,g);from.set(id,cur.id);heap.push({id,x,y,g,f:g+Math.abs(x-t.x)+Math.abs(y-t.y)});}}}
    return null;
  }
  const simplify = (ps) => ps.filter((p,i) => i===0||i===ps.length-1||!((ps[i-1].x===p.x&&p.x===ps[i+1].x)||(ps[i-1].y===p.y&&p.y===ps[i+1].y))).filter((p,i,a) => !i || p.x!==a[i-1].x || p.y!==a[i-1].y);
  function roundPath(ps){if(ps.length<2)return '';let d=`M ${ps[0].x} ${ps[0].y}`;for(let i=1;i<ps.length-1;i++){const a=ps[i-1],b=ps[i],c=ps[i+1],ab=Math.hypot(b.x-a.x,b.y-a.y),bc=Math.hypot(c.x-b.x,c.y-b.y),r=Math.min(8,ab/2,bc/2);if(!ab||!bc)continue;const u={x:b.x-(b.x-a.x)/ab*r,y:b.y-(b.y-a.y)/ab*r},v={x:b.x+(c.x-b.x)/bc*r,y:b.y+(c.y-b.y)/bc*r};d+=` L ${u.x} ${u.y} Q ${b.x} ${b.y} ${v.x} ${v.y}`;}return d+` L ${ps.at(-1).x} ${ps.at(-1).y}`;}
  function routeEdge(e){const a=nodeMap.get(e.source),b=nodeMap.get(e.target);if(!a||!b)return null;
    const pairs=[];for(const p of ports(a))for(const q of ports(b,true)){const distance=Math.abs(p.b.x-q.b.x)+Math.abs(p.b.y-q.b.y);const away=(p.b.x-a.x)*(b.x-a.x)+(p.b.y-a.y)*(b.y-a.y)<0?90:0;const awayQ=(q.b.x-b.x)*(a.x-b.x)+(q.b.y-b.y)*(a.y-b.y)<0?90:0;pairs.push({p,q,rank:distance+away+awayQ});}pairs.sort((x,y)=>x.rank-y.rank);
    let best=null;for(const pair of pairs.slice(0,4)){const r=astar(pair.p.b,pair.q.b);if(r&&(!best||r.cost<best.cost))best={...r,p:pair.p,q:pair.q};}
    if(!best){const p=ports(a)[0],q=ports(b,true)[1];return {d:`M ${p.a.x} ${p.a.y} C ${p.b.x+80} ${p.b.y} ${q.b.x-80} ${q.b.y} ${q.a.x} ${q.a.y}`,points:[p.a,q.a]};}
    best.cells.forEach(id=>traffic[id]++);
    const target={...best.q.a};if(best.q.side==='e')target.x+=7;if(best.q.side==='w')target.x-=7;if(best.q.side==='s')target.y+=7;if(best.q.side==='n')target.y-=7;
    const ps=simplify([best.p.a,best.p.b,...best.points,best.q.b,target]);
    return {d:roundPath(ps),points:ps};
  }
  function wrapText(text, limit=25){const words=String(text).split(/\s+/),lines=[];let line='';for(const word of words){if((line+' '+word).trim().length>limit&&line){lines.push(line);line=word;}else line=(line+' '+word).trim();}if(line)lines.push(line);return lines;}
  function activateSvg(el, fn){el.addEventListener('click',ev=>{if(state.drag?.moved)return;ev.stopPropagation();fn();});el.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();fn();}});}

  function renderGraph(){
    for(const g of M.groups || []){
      const ns=allNodes.filter(n=>n.group===g.id);if(!ns.length)continue;
      const minX=Math.min(...ns.map(n=>n.x))-W/2-24,maxX=Math.max(...ns.map(n=>n.x))+W/2+24,minY=Math.min(...ns.map(n=>n.y))-H/2-36,maxY=Math.max(...ns.map(n=>n.y))+H/2+24;
      const el=svgEl('g',{'class':'graph-group'},$('groupLayer'));
      svgEl('rect',{x:minX,y:minY,width:maxX-minX,height:maxY-minY,rx:20,fill:g.color||'#e8eee5',stroke:g.color||'#d1dfd0'},el);
      const t=svgEl('text',{x:minX+14,y:minY+17},el);t.textContent=(g.label||g.id).toUpperCase();
    }
    for(const e of edges){const route=routeEdge(e);if(!route)continue;routes.set(e.id,route);
      const color=e.status==='indicator'?'#788a80':negative(e)?'#aa6d22':'#24766f';
      const el=svgEl('g',{'class':`graph-edge ${e.status!=='reported'&&e.status!=='indicator'?'edge-hypothesis':''}`,tabindex:0,role:'button','aria-label':`${e.id}: ${label(e.source)} ${sign(e)} to ${label(e.target)}. Open explanation and evidence.`,'data-edge':e.id},$('edgeLayer'));
      const title=svgEl('title',{},el);title.textContent=`${e.id} · ${label(e.source)} → ${label(e.target)} (${sign(e)}). ${status(e)}.`;
      const hit=svgEl('path',{d:route.d,'class':'edge-hit'},el);
      const path=svgEl('path',{d:route.d,'class':'edge-visual',stroke:color,'marker-end':`url(#arrow-${e.status==='indicator'?'neutral':negative(e)?'negative':'positive'})`},el);
      if(e.status==='indicator')path.style.strokeDasharray='1 5';
      const len=path.getTotalLength();const p=path.getPointAtLength(Math.max(12,len-24));
      svgEl('circle',{cx:p.x,cy:p.y,r:10,'class':'polarity-bg'},el);
      const t=svgEl('text',{x:p.x,y:p.y+.6,'text-anchor':'middle','dominant-baseline':'middle',fill:color,'class':'edge-sign'},el);t.textContent=sign(e);
      if(e.delay){const d=path.getPointAtLength(len*.53);svgEl('circle',{cx:d.x,cy:d.y,r:10,'class':'polarity-bg'},el);const dt=svgEl('text',{x:d.x,y:d.y+1,'text-anchor':'middle','dominant-baseline':'middle','class':'edge-delay'},el);dt.textContent='∥';}
      activateSvg(el,()=>selectEdge(e.id));edgeEls.set(e.id,{el,path,hit});
    }
    for(const n of allNodes){const group=groupMap.get(n.group);const el=svgEl('g',{'class':'node',transform:`translate(${n.x-W/2} ${n.y-H/2})`,tabindex:0,role:'button','aria-label':`${n.id}: ${n.label}. Open variable details.`,'data-node':n.id},$('nodeLayer'));
      svgEl('rect',{width:W,height:H,rx:7,'class':'node-box'},el);svgEl('rect',{x:0,y:12,width:3,height:H-24,rx:1.5,'class':'node-stripe',style:`fill:${group?.color||'#78a48d'}`},el);
      const id=svgEl('text',{x:12,y:14,'class':'node-id'},el);id.textContent=n.id;
      const lines=wrapText(n.label,26),fontSize=lines.length>2?10.5:12,baseY=lines.length===1?42:lines.length===2?34:28;
      const text=svgEl('text',{x:W/2,y:baseY,'text-anchor':'middle','class':'node-label',style:`font-size:${fontSize}px`},el);
      lines.slice(0,3).forEach((line,i)=>{const t=svgEl('tspan',{x:W/2,dy:i?14:0},text);t.textContent=line;});
      const title=svgEl('title',{},el);title.textContent=n.definition||n.label;activateSvg(el,()=>selectNode(n.id));nodeEls.set(n.id,el);
    }
    loops.forEach((l,i)=>{const ns=loopNodes(l).map(id=>nodeMap.get(id)).filter(Boolean);if(!ns.length)return;let x=ns.reduce((s,n)=>s+n.x,0)/ns.length,y=ns.reduce((s,n)=>s+n.y,0)/ns.length;
      // Find an empty nearby point so the loop badge never covers a variable.
      const phase=i*.85;let placed=false;for(let radius=0;radius<230&&!placed;radius+=28){for(let k=0;k<12;k++){const a=phase+k*Math.PI/6,px=x+Math.cos(a)*radius,py=y+Math.sin(a)*radius;if(allNodes.every(n=>Math.abs(px-n.x)>W/2+24||Math.abs(py-n.y)>H/2+24)){x=px;y=py;placed=true;break;}}}
      const el=svgEl('g',{'class':'loop-badge',transform:`translate(${x} ${y})`,tabindex:0,role:'button','aria-label':`${l.id}: ${l.name}. Inspect ${l.type==='B'?'balancing':'reinforcing'} feedback.`,'data-loop':l.id},$('badgeLayer'));
      svgEl('circle',{r:21,fill:l.type==='B'?'#b8833d':'#357563'},el);const text=svgEl('text',{x:0,y:1},el);text.textContent=l.id;const title=svgEl('title',{},el);title.textContent=l.name;activateSvg(el,()=>selectLoop(l.id));badgeEls.set(l.id,el);
    });
  }

  function renderLists(){
    const q=state.query.trim().toLowerCase();
    const matches=(...parts)=>!q||parts.some(p=>str(p).toLowerCase().includes(q));
    $('loopList').innerHTML=['R','B'].map(type=>{const ls=loops.filter(l=>l.type===type&&matches(l.id,l.name,l.mechanism,...loopNodes(l).map(label)));if(!ls.length)return '';return `<div class="section-label">${type==='R'?'Reinforcing feedback':'Balancing feedback'}</div>`+ls.map(l=>`<button class="loop-card ${state.focusedLoop===l.id?'active':''}" data-select-loop="${esc(l.id)}" aria-pressed="${state.focusedLoop===l.id}"><div class="loop-card-top"><span class="loop-id ${esc(l.type)}">${esc(l.id)}</span><span class="loop-name">${esc(l.name)}</span></div><div class="loop-meta">${loopNodes(l).length} variables · ${loopEdges(l).filter(e=>!['reported','indicator'].includes(e.status)).length} inferred / conditional links</div></button>`).join('');}).join('')||'<div class="empty-result">No matching loops.<br>Try a variable or mechanism.</div>';
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
  function panel(html){$('inspectorContent').innerHTML=html;$('inspector').scrollTop=0;}
  function showLoop(l){const s=signedLoop(l),es=s.edges,ids=evidenceIds(es),sourceIds=sourcesFor(ids),closed=isClosedLoop(l);
    const path=es.map((e,i)=>`<div class="path-step"><span class="path-step-number">${i+1}</span><div><button data-select-edge="${esc(e.id)}">${esc(label(e.source))} <span class="step-sign sign ${negative(e)?'negative':'positive'}">${sign(e)}</span> → ${esc(label(e.target))}</button><div class="path-edge-explanation">${esc(e.id)} · ${esc(status(e))}</div></div></div>`).join('');
    panel(`<section class="inspector-section"><div class="detail-kicker"><span class="loop-id ${esc(l.type)}">${esc(l.id)}</span> ${l.type==='B'?'BALANCING':'REINFORCING'} FEEDBACK</div><h2>${esc(l.name)}</h2><p class="lead">${esc(l.mechanism||l.description||'')}</p><div class="chip-row"><span class="chip ${l.type==='B'?'amber':'teal'}">${l.type==='B'?'Counteracts change':'Amplifies change'}</span><span class="chip">${es.length} causal links</span><span class="chip">${sourceIds.length} sources</span>${es.some(e=>e.delay)||l.delay?'<span class="chip">Includes a delay</span>':''}</div>${l.equityEffect?`<div class="effect-note"><strong>IMPLICATION FOR EQUITY</strong>${esc(l.equityEffect)}</div>`:''}</section><section class="inspector-section"><h3>Follow the closed path</h3>${path}<div class="parity-box"><strong>${s.negatives} negative ${s.negatives===1?'link':'links'} → product ${s.product} → ${s.type==='R'?'reinforcing':'balancing'}.</strong><br>${closed?'The path closes: the last relationship returns to the first variable.':'Loop closure requires review.'} Signs test structural polarity; they do not prove causation.</div></section><section class="inspector-section"><h3>Loop basis &amp; assumptions</h3>${l.basis?`<p class="mechanism-note">${esc(l.basis)}</p>`:''}${assumptionHtml(l.assumptions)}</section><section class="inspector-section"><h3>Trace the evidence <span class="count-pill">${ids.length}</span></h3><p>These anchors support individual links. The complete feedback loop is a conceptual synthesis unless the source explicitly describes it.</p>${evidenceHtml(ids)}</section>`);
  }
  function showEdge(e){const src=nodeMap.get(e.source),tgt=nodeMap.get(e.target),ids=e.evidence||[];
    panel(`<section class="inspector-section">${backHtml()}<div class="detail-kicker">RELATIONSHIP ${esc(e.id)}</div><h2 class="detail-edge-heading">${esc(src?.label||e.source)}<br><span class="sign ${negative(e)?'negative':'positive'}">${sign(e)}</span> → ${esc(tgt?.label||e.target)}</h2><div class="direction-description ${negative(e)?'negative':''}"><span class="sign ${negative(e)?'negative':'positive'}">${sign(e)}</span><span>${negative(e)?'An increase in the source is hypothesised to decrease the target; a decrease is hypothesised to increase it.':'An increase in the source is hypothesised to increase the target; a decrease is hypothesised to decrease it.'}<br>Other things equal. The sign does not mean good or bad.</span></div><p class="lead">${esc(e.rationale||e.explanation||'')}</p><div class="chip-row"><span class="chip ${e.status==='reported'?'teal':'amber'}">${esc(status(e))}</span>${e.delay?'<span class="chip">Delayed effect ∥</span>':''}</div>${e.scope?`<p class="mechanism-note">${esc(e.scope)}</p>`:''}${e.assumptions?.length?`<div style="margin-top:16px">${assumptionHtml(e.assumptions)}</div>`:''}</section><section class="inspector-section"><h3>Why this arrow is in the model</h3>${evidenceHtml(ids)}</section><section class="inspector-section"><h3>Highlighted feedback loops</h3>${relatedLoopsHtml(edgeLoops(e.id))}</section><section class="inspector-section"><h3>Inspect the variables</h3><button class="related-button" data-select-node="${esc(e.source)}">${esc(e.source)} · ${esc(src?.label||e.source)} ↗</button><button class="related-button" data-select-node="${esc(e.target)}">${esc(e.target)} · ${esc(tgt?.label||e.target)} ↗</button></section>`);
  }
  function showNode(n){const incoming=edges.filter(e=>e.target===n.id),outgoing=edges.filter(e=>e.source===n.id),g=groupMap.get(n.group);
    const rel=(es,inbound)=>es.length?es.map(e=>`<button class="related-button" data-select-edge="${esc(e.id)}"><span class="sign ${negative(e)?'negative':'positive'}">${sign(e)}</span> ${esc(label(inbound?e.source:e.target))}<br><span class="muted">${esc(e.id)} · ${esc(status(e))}</span></button>`).join(''):'<p>No relationship is recorded in this direction.</p>';
    panel(`<section class="inspector-section">${backHtml()}<div class="detail-kicker">VARIABLE ${esc(n.id)}</div><h2>${esc(n.label)}</h2><p class="lead">${esc(n.definition||'')}</p><div class="chip-row">${g?`<span class="chip">${esc(g.label)}</span>`:''}${(n.domains||[]).map(d=>`<span class="chip">${esc(d)}</span>`).join('')}</div>${n.note?`<p class="mechanism-note">${esc(n.note)}</p>`:''}</section><section class="inspector-section"><h3>What influences this variable <span class="count-pill">${incoming.length}</span></h3>${rel(incoming,true)}</section><section class="inspector-section"><h3>What this variable influences <span class="count-pill">${outgoing.length}</span></h3>${rel(outgoing,false)}</section><section class="inspector-section"><h3>Highlighted feedback loops</h3>${relatedLoopsHtml(nodeLoops(n.id))}</section>`);
  }
  function showSources(){
    state.selectedType='sources';state.selectedId=null;renderLists();updateGraph();
    panel(`<section class="inspector-section"><div class="detail-kicker">SOURCE LIBRARY · ${sources.length} RECORDS</div><h2>From papers to paths</h2><p class="lead">Every arrow has a stable ID and an explanation. Evidence anchors identify the source and location; inferred links remain explicitly labelled.</p><p>Page references follow the locator recorded for each anchor. A source supporting one mechanism does not validate every link or the whole model.</p></section><section class="inspector-section">${sources.map(s=>`<article class="source-item"><span class="source-code">${esc(s.id)}</span> <span class="muted">${esc(s.year||'')}</span><h4>${esc(s.title)}</h4><p>${esc(str(s.authors))}${s.journal?`<br><em>${esc(s.journal)}</em>`:''}${s.citation?`<br>${esc(s.citation)}`:''}</p><div class="source-links">${link(s.url||(s.doi?'https://doi.org/'+s.doi:''),'Publication')}${s.fullTextUrl&&s.fullTextUrl!==s.url?link(s.fullTextUrl,'Full text'):''}</div>${s.doi?`<p>DOI: ${esc(s.doi)}</p>`:''}${s.access?`<p><strong>Evidence access:</strong> ${esc(s.access)}</p>`:''}${s.note?`<p class="mechanism-note">${esc(s.note)}</p>`:''}</article>`).join('')}</section><section class="inspector-section"><h3>Download the evidence register</h3><p>Inspect every source-to-arrow connection outside this interface.</p><a class="evidence-link" href="evidence_anchors.csv" download>Evidence anchors as CSV ↓</a></section>`);
  }
  function showMethod(){
    state.selectedType='method';state.selectedId=null;renderLists();updateGraph();const meta=M.meta||{};
    const asArray=value=>Array.isArray(value)?value:value?[value]:[];
    const limitations=[...asArray(meta.limitations),...asArray(M.modelNotes)];
    const p=M.provenance||{};
    const provenanceHtml=M.provenance?`<section class="inspector-section"><h3>Model provenance</h3><p><strong>Modelling brief:</strong> ${esc(p.brief||p.ppt?.filename||(typeof p.ppt==='string'?p.ppt:'User-supplied presentation'))}</p>${p.slides?`<p>${esc(p.slides)}</p>`:''}${p.sourceSelection?`<p>${esc(p.sourceSelection)}</p>`:''}${p.targetVariables?`<p>${esc(p.targetVariables)}</p>`:''}${p.verifiedOn?`<p><strong>Sources checked:</strong> ${esc(p.verifiedOn)}</p>`:''}${p.note?`<p>${esc(p.note)}</p>`:''}${p.corrections?.length?`<h3 style="margin-top:20px">Brief reconciliation</h3>${assumptionHtml(p.corrections)}`:''}${meta.validationStatus?`<p class="mechanism-note">${esc(meta.validationStatus)}</p>`:''}</section>`:'';
    panel(`<section class="inspector-section"><div class="detail-kicker">METHOD &amp; READING GUIDE</div><h2>A map of mechanisms</h2><p class="lead">${esc(meta.problem||'Which factors create inequity in the built environment, what are their effects on people, and which feedback mechanisms increase or decrease equity?')}</p>${meta.definition?`<p>${esc(meta.definition)}</p>`:''}${meta.scope?`<p class="mechanism-note">${esc(meta.scope)}</p>`:''}</section><section class="inspector-section"><h3>Read the notation</h3><div class="notation-item"><strong><span class="sign positive">+</span> Same direction, other things equal</strong><p>Increasing the source tends to increase the target. Decreasing the source tends to decrease the target.</p></div><div class="notation-item"><strong><span class="sign negative">−</span> Opposite direction, other things equal</strong><p>Increasing the source tends to decrease the target. Decreasing the source tends to increase the target. Polarity is separate from desirability.</p></div><div class="notation-item"><strong>R · Reinforcing feedback</strong><p>A closed path with an even number of negative arrows amplifies a change. It can sustain either improvement or deterioration.</p></div><div class="notation-item"><strong>B · Balancing feedback</strong><p>A closed path with an odd number of negative arrows counteracts a change. A balancing loop can also constrain beneficial change.</p></div><div class="notation-item"><strong>Solid, dashed, dotted &amp; delayed</strong><p>Solid arrows denote source-reported directional mechanisms. Dashed arrows identify association-based, synthesised or conditional policy relationships. Dotted arrows identify conditional disparity indicators. The double bar ∥ marks an expected delay, not an estimated duration.</p></div></section><section class="inspector-section"><h3>Evidence strength stays visible</h3>${Object.entries(statusNames).map(([id,name])=>`<div class="notation-item"><strong>${esc(name)}</strong><p>${esc({reported:'A directional mechanism described in the cited source. This label includes qualitative and conceptual evidence; it is not a causal-effect estimate.',association:'An observed association oriented as an explicit causal hypothesis. Reverse causation or confounding may remain.',synthesis:'A connection assembled across sources and systems reasoning. It requires empirical validation.',policy:'A possible response that operates only if the relevant institution acts, the intervention reaches the priority group, and implementation is effective.',indicator:'A conditional relationship to a between-group disparity, holding the reference group and distributional assumptions explicit.'}[id])}</p></div>`).join('')}</section>${meta.needs?.length?`<section class="inspector-section"><h3>Human needs in the system</h3><div class="needs-list">${meta.needs.map(n=>`<span>${esc(n)}</span>`).join('')}</div></section>`:''}<section class="inspector-section"><h3>Limits of interpretation</h3>${assumptionHtml(limitations.length?limitations:['This literature-informed model is a structured hypothesis, not a numerical simulation or a causal identification study.','Highlighted loops are a selected explanatory set; other closed paths may exist.','Relationships depend on population, place, institutional context and time scale.'])}</section>${provenanceHtml}`);
  }

  function updateGraph(){
    const focused=loopMap.get(state.focusedLoop);let activeEdges=null,activeNodes=null;
    if(focused){activeEdges=new Set(focused.edges);activeNodes=new Set(loopNodes(focused));}
    if(state.selectedType==='edge'){const e=edgeMap.get(state.selectedId);if(e){activeEdges=activeEdges||new Set();activeNodes=activeNodes||new Set();activeEdges.add(e.id);activeNodes.add(e.source);activeNodes.add(e.target);}}
    if(state.selectedType==='node'&&!focused){const n=state.selectedId;activeEdges=new Set(edges.filter(e=>e.source===n||e.target===n).map(e=>e.id));activeNodes=new Set([n,...edges.filter(e=>activeEdges.has(e.id)).flatMap(e=>[e.source,e.target])]);}
    for(const [id,{el,path}]of edgeEls){const dim=activeEdges&&!activeEdges.has(id),e=edgeMap.get(id);el.classList.toggle('dimmed',!!dim);el.classList.toggle('selected',state.selectedType==='edge'&&state.selectedId===id);path.setAttribute('marker-end',`url(#arrow-${dim?'muted':e.status==='indicator'?'neutral':negative(e)?'negative':'positive'})`);}
    for(const [id,el]of nodeEls){el.classList.toggle('dimmed',!!activeNodes&&!activeNodes.has(id));el.classList.toggle('active',state.selectedType==='node'&&state.selectedId===id);}
    for(const [id,el]of badgeEls)el.classList.toggle('dimmed',!!focused&&id!==focused.id);
    $('groupLayer').style.opacity=focused?'.26':'.65';
    $('viewEyebrow').textContent=focused?`${focused.id} · ${focused.type==='B'?'BALANCING':'REINFORCING'} FEEDBACK`:'COMPLETE SYSTEM MAP';
    $('viewTitle').textContent=focused?focused.name:'The connected system';
  }
  function transform(){ $('viewport').setAttribute('transform',`translate(${state.tx} ${state.ty}) scale(${state.scale})`);$('zoomLabel').textContent=Math.round(state.scale*100)+'%'; }
  function fit(ids){const rect=$('graphWrap').getBoundingClientRect(),ns=(ids?.length?ids:allNodes.map(n=>n.id)).map(id=>nodeMap.get(id)).filter(Boolean);if(!ns.length||!rect.width||!rect.height)return;let minX=Math.min(...ns.map(n=>n.x))-W/2-60,maxX=Math.max(...ns.map(n=>n.x))+W/2+60,minY=Math.min(...ns.map(n=>n.y))-H/2-70,maxY=Math.max(...ns.map(n=>n.y))+H/2+70;
    const focus=loopMap.get(state.focusedLoop);if(focus){for(const eid of focus.edges||[]){const r=routes.get(eid);for(const p of r?.points||[]){minX=Math.min(minX,p.x-35);maxX=Math.max(maxX,p.x+35);minY=Math.min(minY,p.y-35);maxY=Math.max(maxY,p.y+35);}}}
    const scale=Math.min(rect.width/(maxX-minX),rect.height/(maxY-minY),1.35)*.93;state.scale=Math.max(.12,scale);state.tx=rect.width/2-(minX+maxX)/2*state.scale;state.ty=rect.height/2-(minY+maxY)/2*state.scale;transform();
  }
  function zoom(factor,cx,cy){const rect=$('graphWrap').getBoundingClientRect();cx??=rect.width/2;cy??=rect.height/2;const old=state.scale,next=Math.min(3,Math.max(.12,old*factor));state.tx=cx-(cx-state.tx)*next/old;state.ty=cy-(cy-state.ty)*next/old;state.scale=next;transform();}
  function selectLoop(id,doFit=true){const l=loopMap.get(id);if(!l)return;state.focusedLoop=id;state.selectedType='loop';state.selectedId=id;showLoop(l);updateGraph();renderLists();if(doFit)fit(loopNodes(l));}
  function selectEdge(id){const e=edgeMap.get(id);if(!e)return;state.selectedType='edge';state.selectedId=id;showEdge(e);updateGraph();renderLists();}
  function selectNode(id){const n=nodeMap.get(id);if(!n)return;state.selectedType='node';state.selectedId=id;showNode(n);updateGraph();renderLists();}
  function overview(){state.focusedLoop=null;state.selectedType='method';state.selectedId=null;showMethod();updateGraph();renderLists();fit();}
  function setTab(tab){state.tab=tab;state.query='';$('searchInput').value='';$('searchInput').placeholder=tab==='loops'?'Search loops…':tab==='links'?'Search relationships…':'Search variables…';$('explorerHint').textContent={loops:'Select a feedback loop to follow its mechanism.',links:'Every arrow is listed here, including overlapping arrows.',variables:'Select a variable to inspect its definition and connections.'}[tab];for(const b of document.querySelectorAll('[data-tab]')){b.classList.toggle('active',b.dataset.tab===tab);b.setAttribute('aria-selected',b.dataset.tab===tab);} $('loopList').hidden=tab!=='loops';$('edgeList').hidden=tab!=='links';$('nodeList').hidden=tab!=='variables';renderLists();}
  function toast(message){clearTimeout(toastTimer);$('toast').textContent=message;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,2800);}
  function download(name,body,type){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([body],{type}));a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function exportSvg(){const clone=$('graph').cloneNode(true),vp=clone.querySelector('#viewport');const width=bounds.maxX-bounds.minX+80,height=bounds.maxY-bounds.minY+100;clone.setAttribute('width',width);clone.setAttribute('height',height);clone.setAttribute('viewBox',`${bounds.minX-40} ${bounds.minY-65} ${width} ${height}`);vp.removeAttribute('transform');clone.querySelectorAll('.dimmed').forEach(el=>el.classList.remove('dimmed'));clone.querySelectorAll('.edge-hit').forEach(el=>el.remove());clone.querySelectorAll('[tabindex]').forEach(el=>el.removeAttribute('tabindex'));for(const [id,{path}]of edgeEls){const counterpart=clone.querySelector(`[data-edge="${CSS.escape(id)}"] .edge-visual`);counterpart?.setAttribute('marker-end',`url(#arrow-${negative(edgeMap.get(id))?'negative':'positive'})`);}const style=svgEl('style',{},clone);style.textContent='.edge-visual{fill:none;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}.edge-hypothesis .edge-visual{stroke-dasharray:6 5}.polarity-bg{fill:#fcfdf8;stroke:#e4e9e1;stroke-width:.6}.edge-sign{font:700 17px Arial;pointer-events:none}.edge-delay{font:700 15px Arial;fill:#6c8276}.node-box{fill:white;stroke:#c5d5c7;stroke-width:1.2}.node-id{font:500 8px Arial;fill:#9aa99d}.node-label{font:600 12px Arial;fill:#294a46}.node-stripe{fill:#78a48d}.graph-group rect{fill-opacity:.28;stroke-opacity:.5;stroke-width:1;stroke-dasharray:4 6}.graph-group text{font:600 11px Arial;fill:#8a9b8e}.loop-badge circle{stroke:white;stroke-width:4}.loop-badge text{fill:white;text-anchor:middle;dominant-baseline:middle;font:700 13px Arial}';const title=svgEl('text',{x:bounds.minX-10,y:bounds.minY-25,fill:'#193d43','font-family':'Georgia,serif','font-size':27},clone);title.textContent=M.meta?.title||'Built environment equity';download('built-environment-equity.svg','<?xml version="1.0" encoding="UTF-8"?>\n'+new XMLSerializer().serializeToString(clone),'image/svg+xml');toast('Complete diagram exported as an editable SVG.');}

  document.addEventListener('click',ev=>{const loop=ev.target.closest('[data-select-loop]'),edge=ev.target.closest('[data-select-edge]'),node=ev.target.closest('[data-select-node]');if(loop)selectLoop(loop.dataset.selectLoop);else if(edge)selectEdge(edge.dataset.selectEdge);else if(node)selectNode(node.dataset.selectNode);if(!ev.target.closest('.download-wrap')){$('downloadMenu').hidden=true;$('downloadButton').setAttribute('aria-expanded','false');}});
  document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.tab)));
  $('searchInput').addEventListener('input',ev=>{state.query=ev.target.value;renderLists();});
  $('overviewButton').addEventListener('click',overview);$('resetFocus').addEventListener('click',overview);
  $('sourcesButton').addEventListener('click',showSources);$('methodButton').addEventListener('click',showMethod);$('legendButton').addEventListener('click',showMethod);
  $('zoomIn').addEventListener('click',()=>zoom(1.25));$('zoomOut').addEventListener('click',()=>zoom(.8));$('fitView').addEventListener('click',()=>fit(state.focusedLoop?loopNodes(loopMap.get(state.focusedLoop)):undefined));
  $('downloadButton').addEventListener('click',()=>{const open=$('downloadMenu').hidden;$('downloadMenu').hidden=!open;$('downloadButton').setAttribute('aria-expanded',open);});
  $('exportSvg').addEventListener('click',()=>{exportSvg();$('downloadMenu').hidden=true;});$('exportJson').addEventListener('click',()=>{download('model.json',JSON.stringify(M,null,2),'application/json');$('downloadMenu').hidden=true;toast('Full model, sources and evidence exported.');});
  $('graph').addEventListener('wheel',ev=>{ev.preventDefault();const r=$('graph').getBoundingClientRect();zoom(Math.exp(-ev.deltaY*.0015),ev.clientX-r.left,ev.clientY-r.top);},{passive:false});
  $('graph').addEventListener('pointerdown',ev=>{if(ev.button!==0)return;state.drag={x:ev.clientX,y:ev.clientY,tx:state.tx,ty:state.ty,moved:false};});
  $('graph').addEventListener('pointermove',ev=>{if(!state.drag)return;const dx=ev.clientX-state.drag.x,dy=ev.clientY-state.drag.y;if(Math.hypot(dx,dy)>4&&!state.drag.moved){state.drag.moved=true;$('graph').setPointerCapture(ev.pointerId);}if(state.drag.moved){$('graph').classList.add('dragging');state.tx=state.drag.tx+dx;state.ty=state.drag.ty+dy;transform();}});
  const endDrag=()=>{if(!state.drag)return;const moved=state.drag.moved;$('graph').classList.remove('dragging');setTimeout(()=>{if(state.drag?.moved===moved)state.drag=null;},30);};$('graph').addEventListener('pointerup',endDrag);$('graph').addEventListener('pointercancel',endDrag);
  document.addEventListener('keydown',ev=>{if(ev.key==='Escape'){$('downloadMenu').hidden=true;$('downloadButton').setAttribute('aria-expanded','false');}if(ev.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){ev.preventDefault();$('searchInput').focus();}if(document.activeElement===$('graph')){if(ev.key==='+'||ev.key==='=')zoom(1.25);if(ev.key==='-')zoom(.8);}});
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>fit(state.focusedLoop?loopNodes(loopMap.get(state.focusedLoop)):undefined),140);});
  renderGraph();renderLists();
  requestAnimationFrame(()=>{if(loopMap.has('R1'))selectLoop('R1');else if(loops.length)selectLoop(loops[0].id);else overview();});
  // Read-only handles enable structural QA without a numerical modelling engine.
  window.CLD_ATLAS = Object.freeze({selectLoop, selectEdge, selectNode, overview, showSources, showMethod, validate:()=>({nodes:nodes.length,edges:edges.length,loops:loops.length,renderedEdges:edgeEls.size,renderedNodes:nodeEls.size,loopChecks:loops.map(l=>({id:l.id,closed:isClosedLoop(l),computedType:signedLoop(l).type,declaredType:l.type})),missingAnchors:edges.flatMap(e=>(e.evidence||[]).filter(id=>!anchorMap.has(id)).map(id=>({edge:e.id,anchor:id}))),missingEndpoints:edges.filter(e=>!nodeMap.has(e.source)||!nodeMap.has(e.target)).map(e=>e.id)})});
})();
