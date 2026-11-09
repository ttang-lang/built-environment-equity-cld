/* CLD presentation geometry. No graph semantics or source-model coordinates are changed. */
(() => {
  'use strict';
  const DEFAULTS = {width: 224, height: 88};
  const SIDES = ['e', 's', 'w', 'n'];
  const normals = {e: {x: 1, y: 0}, s: {x: 0, y: 1}, w: {x: -1, y: 0}, n: {x: 0, y: -1}};
  const dist = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
  const add = (p, v, k = 1) => ({x: p.x + v.x * k, y: p.y + v.y * k});
  const unit = v => { const d = Math.hypot(v.x, v.y) || 1; return {x: v.x / d, y: v.y / d}; };
  const round = n => Math.round(n * 100) / 100;
  const xy = p => `${round(p.x)} ${round(p.y)}`;
  const unique = list => list.filter((p, i) => !i || dist(p, list[i - 1]) > .01);
  const optionsFor = options => ({...DEFAULTS, ...options});

  function layout(nodes, groups, options = {}) {
    const {width, height} = optionsFor(options);
    const columns = options.columns || 7;
    const stepX = width + 64, stepY = height + 92;
    // Use the established themed arrangement as the presentation's starting point.
    // Translate complete sections to equal edge-to-edge gutters, leaving source data intact.
    const positioned=nodes.map((n, i) => ({...n,
      x: Number.isFinite(n.x) ? n.x : width / 2 + 66 + (i % columns) * stepX,
      y: Number.isFinite(n.y) ? n.y : height / 2 + 88 + Math.floor(i / columns) * stepY
    }));
    const gutter=Number.isFinite(options.regionGap)?options.regionGap:96;
    const region=members=>({
      left:Math.min(...members.map(n=>n.x))-width/2-14,
      right:Math.max(...members.map(n=>n.x))+width/2+14,
      top:Math.min(...members.map(n=>n.y))-height/2-38,
      bottom:Math.max(...members.map(n=>n.y))+height/2+18
    });
    const grouped=new Map((groups||[]).map(g=>[g.id,positioned.filter(n=>n.group===g.id)]));
    const bounds=new Map();let previous=null;
    for(const id of ['governance','housing','mobility','place','health']){
      const members=grouped.get(id)||[];if(!members.length)continue;
      const before=region(members),shift=previous?previous.bottom+gutter-before.top:0;
      members.forEach(n=>{n.y+=shift;});
      const after=region(members);bounds.set(id,after);previous=after;
    }
    const equity=grouped.get('equity')||[],housing=grouped.get('housing')||[],mobility=grouped.get('mobility')||[];
    if(equity.length&&housing.length&&mobility.length){
      const before=region(equity),mainRight=Math.max(bounds.get('housing').right,bounds.get('mobility').right);
      const shiftX=mainRight+gutter-before.left,oldColumn=Math.min(...equity.map(n=>n.x));
      equity.forEach(n=>{n.x+=shiftX;});
      const ordered=equity.slice().sort((a,b)=>a.y-b.y),firstY=ordered[0].y;
      const housingY=Math.min(...housing.map(n=>n.y)),mobilityY=Math.min(...mobility.map(n=>n.y));
      ordered.forEach(n=>{n.y+=housingY-firstY;});
      // The two outcome rows stay aligned with housing and mobility, rather than
      // keeping an obsolete vertical offset after those sections are translated.
      if(ordered.length===2)ordered[1].y=mobilityY;
      for(const n of grouped.get('health')||[])if(n.x===oldColumn)n.x+=shiftX;
    }
    return positioned;
  }

  function layoutLoop(loop, nodes, options = {}) {
    const {width, height} = optionsFor(options);
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const ids = [...new Set(loop.nodes || [])].filter(id => nodeMap.has(id));
    const count = ids.length;
    const rx = count === 2 ? 265 : count === 3 ? 300 : count === 4 ? 340 : 405;
    const ry = count === 2 ? 182 : count === 3 ? 215 : count === 4 ? 235 : 268;
    const cx = rx + width / 2 + 76, cy = ry + height / 2 + 76;
    return ids.map((id, i) => {
      const angle = count === 2 ? Math.PI + i * Math.PI : -Math.PI / 2 + i * Math.PI * 2 / count;
      return {...nodeMap.get(id), x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry,
        _loopIndex: i, _loopCount: count, _loopAngle: angle, _loopCenter: {x: cx, y: cy},
        _loopRadii: {x: rx, y: ry}};
    });
  }

  function rectangle(n, width, height, pad = 0) {
    return {id: n.id, left: n.x - width / 2 - pad, right: n.x + width / 2 + pad,
      top: n.y - height / 2 - pad, bottom: n.y + height / 2 + pad};
  }
  function inside(p, r, epsilon = .02) {
    return p.x > r.left + epsilon && p.x < r.right - epsilon && p.y > r.top + epsilon && p.y < r.bottom - epsilon;
  }
  // Open-rectangle intersection permits visibility paths along the padded box boundary.
  function segmentCrosses(a, b, r) {
    const epsilon = .05;
    const min = {x: r.left + epsilon, y: r.top + epsilon};
    const max = {x: r.right - epsilon, y: r.bottom - epsilon};
    let lo = 0, hi = 1;
    for (const axis of ['x', 'y']) {
      const d = b[axis] - a[axis];
      if (Math.abs(d) < 1e-8) { if (a[axis] <= min[axis] || a[axis] >= max[axis]) return false; }
      else {
        const p = (min[axis] - a[axis]) / d, q = (max[axis] - a[axis]) / d;
        lo = Math.max(lo, Math.min(p, q)); hi = Math.min(hi, Math.max(p, q));
        if (lo >= hi) return false;
      }
    }
    return hi > 1e-7 && lo < 1 - 1e-7 && lo < hi;
  }
  function clearSegment(a, b, rects) { return !rects.some(r => segmentCrosses(a, b, r)); }
  const lengthOf = points => points.slice(1).reduce((sum,p,i)=>sum+dist(points[i],p),0);
  function pointAt(points,distance){
    for(let i=1;i<points.length;i++){const len=dist(points[i-1],points[i]);if(len>=distance&&len){const t=distance/len;return {x:points[i-1].x+(points[i].x-points[i-1].x)*t,y:points[i-1].y+(points[i].y-points[i-1].y)*t};}distance-=len;}
    return {...points[points.length-1]};
  }
  function crossingIds(points,rects){return rects.filter(r=>points.some(p=>inside(p,r))||points.some((p,i)=>i&&segmentCrosses(points[i-1],p,r))).map(r=>r.id);}
  function simplified(input){
    const out=[];for(const p of unique(input)){
      while(out.length>=2){const a=out[out.length-2],b=out[out.length-1];if(Math.abs((b.x-a.x)*(p.y-b.y)-(b.y-a.y)*(p.x-b.x))>.01||(b.x-a.x)*(p.x-b.x)+(b.y-a.y)*(p.y-b.y)<0)break;out.pop();}out.push(p);
    }return out;
  }
  function makeRoute(p,q,middle,manual=false){
    const sourceGuard=add(p.point,p.normal,12),targetGuard=add(q.point,q.normal,15.2);
    const editablePoints=middle.map(v=>({x:v.x,y:v.y}));
    const vertices=[{...p.point}],editableVertexIndices=[];
    const append=v=>{if(dist(vertices[vertices.length-1],v)>.001)vertices.push({...v});return vertices.length-1;};
    append(sourceGuard);for(const v of editablePoints)editableVertexIndices.push(append(v));append(targetGuard);append(q.point);
    const length=lengthOf(vertices);
    return {d:vertices.map((v,i)=>`${i?'L':'M'} ${xy(v)}`).join(' '),points:vertices,vertices,editablePoints,editableVertexIndices,
      sourcePoint:{...p.point},targetPoint:{...q.point},sourceGuard,targetGuard,sourceSide:p.side,targetSide:q.side,
      length,kind:manual?'manual-straight':'orthogonal',bends:simplified(vertices).length-2,terminalLength:dist(vertices[vertices.length-2],q.point),manual};
  }
  function fromPath(path,p,q){
    const ps=simplified(path),s=add(p.point,p.normal,12),t=add(q.point,q.normal,15.2);
    const middle=ps.slice(1,-1).filter(v=>dist(v,s)>.001&&dist(v,t)>.001);
    return makeRoute(p,q,middle);
  }
  function context(nodes,options){
    const {width,height}=optionsFor(options),byId=new Map(nodes.map(n=>[n.id,n]));
    const extra=(options.obstacles||[]).filter(r=>['left','right','top','bottom'].every(k=>Number.isFinite(r[k]))&&r.left<r.right&&r.top<r.bottom);
    const expand=(r,p)=>({...r,left:r.left-p,right:r.right+p,top:r.top-p,bottom:r.bottom+p});
    const boxes=nodes.map(n=>rectangle(n,width,height,2));
    return {width,height,byId,extra,boxes,obstacles:[...boxes,...extra.map(r=>expand(r,4))],
      labelBoxes:[...nodes.map(n=>rectangle(n,width,height,15)),...extra.map(r=>expand(r,13))],
      edgeBoxes:e=>boxes.map(r=>r.id===e.target?rectangle(byId.get(e.target),width,height,.5):r)};
  }
  function finishRoutes(nodes,edges,routes,options={},changed=null){
    const ctx=context(nodes,options),heads=[...routes.values()].map(r=>r.targetPoint),occupied=[];
    // Arrowheads stay anchored when editing. Reuse untouched badge positions,
    // reserving them before placing the edited links' badges on their new paths.
    if(changed)for(const [id,r] of routes)if(!changed.has(id)){if(r.signPoint)occupied.push(r.signPoint);if(r.delayPoint)occupied.push(r.delayPoint);}
    const sorted=edges.filter(e=>routes.has(e.id)&&(!changed||changed.has(e.id))).slice().sort((a,b)=>routes.get(a.id).length-routes.get(b.id).length||a.id.localeCompare(b.id));
    for(const edge of sorted){const r=routes.get(edge.id),L=r.length;
      const choose=preferred=>{
        const choices=[preferred];for(let t=28;t<=L-28;t+=10)choices.push(t);
        let best=null,bestScore=Infinity,penalty=0;
        for(const d of choices){const p=pointAt(r.points,Math.max(14,Math.min(L-14,d)));
          const bad=ctx.labelBoxes.filter(b=>inside(p,b)).length*10000+heads.reduce((s,h)=>s+(dist(p,h)<28?10000:0),0)+occupied.reduce((s,l)=>s+Math.max(0,25-dist(p,l))*50,0);
          const score=bad+Math.abs(d-preferred)*.15;if(score<bestScore){best=p;bestScore=score;penalty=bad;}
        }occupied.push(best);return {point:best,penalty};
      };
      const sign=choose(L-38),delay=edge.delay?choose(L*.48):null;
      r.signPoint=sign.point;r.delayPoint=delay?.point||null;r.labelPenalty=sign.penalty+(delay?.penalty||0);
      r.nodeCrossings=crossingIds(r.points,ctx.edgeBoxes(edge));r.obstacleCrossings=crossingIds(r.points,ctx.extra);
      r.manualInvalid=!!(r.nodeCrossings.length||r.obstacleCrossings.length);
    }
    return new Map(edges.filter(e=>routes.has(e.id)).map(e=>[e.id,routes.get(e.id)]));
  }
  // Only presentation routes are copied; model objects and cached automatic routes
  // are never mutated. This fast path is used for every drag frame.
  function applyWaypoints(nodes,edges,baseRoutes,waypoints={},options={}){
    const routes=new Map([...baseRoutes].map(([id,r])=>[id,{...r}])),changed=new Set();
    for(const edge of edges){const input=waypoints[edge.id],base=baseRoutes.get(edge.id);
      if(!Array.isArray(input)||!base||input.length>80)continue;
      if(input.some(v=>!Number.isFinite(v?.x)||!Number.isFinite(v?.y)||Math.abs(v.x)>100000||Math.abs(v.y)>100000))continue;
      const p={point:base.sourcePoint,side:base.sourceSide,normal:normals[base.sourceSide]},q={point:base.targetPoint,side:base.targetSide,normal:normals[base.targetSide]};
      routes.set(edge.id,makeRoute(p,q,input,true));changed.add(edge.id);
    }
    return finishRoutes(nodes,edges,routes,options,changed);
  }
  function routeEdges(nodes,edges,options={}){
    if(options.baseRoutes)return applyWaypoints(nodes,edges,options.baseRoutes,options.waypoints||{},options);
    const ctx=context(nodes,options),{width,height,byId}=ctx,routes=new Map(),usedPorts=new Map();
    const labelClearance=nodes.map(n=>rectangle(n,width,height,31));
    const xs=[...new Set(nodes.flatMap(n=>[n.x-width/2-8,n.x-width/2-16,n.x-width/2-24,n.x+width/2+8,n.x+width/2+16,n.x+width/2+24]))];
    const ys=[...new Set(nodes.flatMap(n=>[n.y-height/2-22,n.y-height/2-38,n.y-height/2-54,n.y+height/2+22,n.y+height/2+38,n.y+height/2+54]))];
    for(const r of ctx.extra){xs.push(r.left-12,r.right+12);ys.push(r.top-12,r.bottom+12);}
    const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
    for(let i=1;i<=4;i++){xs.push(left-i*16,right+i*16);ys.push(top-i*16,bottom+i*16);}
    const port=(node,side,incoming)=>{
      const key=node.id+':'+side,used=usedPorts.get(key)||[],span=(side==='e'||side==='w')?height/2-14:width/2-20;
      const offsets=[0,-18,18,-36,36,-54,54,-72,72,-90,90].filter(v=>Math.abs(v)<=span);
      let offset=offsets[0],best=-Infinity;for(const v of offsets){const score=used.length?Math.min(...used.map(u=>Math.abs(u-v))):1000-Math.abs(v);if(score>best){best=score;offset=v;}}
      const normal=normals[side],point={x:node.x+normal.x*(width/2+(incoming?.8:4)),y:node.y+normal.y*(height/2+(incoming?.8:4))};
      if(normal.x)point.y+=offset;else point.x+=offset;
      return {point,side,normal,key,offset,usage:used.length};
    };
    const reserve=p=>{if(!usedPorts.has(p.key))usedPorts.set(p.key,[]);usedPorts.get(p.key).push(p.offset);};
    const congestion=points=>{
      let cost=0;
      for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],horizontal=Math.abs(a.y-b.y)<.01;
        for(const other of routes.values())for(let j=1;j<other.vertices.length;j++){const c=other.vertices[j-1],d=other.vertices[j],h2=Math.abs(c.y-d.y)<.01;
          if(horizontal===h2){const gap=horizontal?Math.abs(a.y-c.y):Math.abs(a.x-c.x);if(gap<9){const overlap=horizontal?Math.min(Math.max(a.x,b.x),Math.max(c.x,d.x))-Math.max(Math.min(a.x,b.x),Math.min(c.x,d.x)):Math.min(Math.max(a.y,b.y),Math.max(c.y,d.y))-Math.max(Math.min(a.y,b.y),Math.min(c.y,d.y));if(overlap>0)cost+=overlap*(9-gap)*.22;}}
          else {const h=horizontal?[a,b]:[c,d],v=horizontal?[c,d]:[a,b];if(v[0].x>Math.min(h[0].x,h[1].x)+1&&v[0].x<Math.max(h[0].x,h[1].x)-1&&h[0].y>Math.min(v[0].y,v[1].y)+1&&h[0].y<Math.max(v[0].y,v[1].y)-1)cost+=9;}
        }
      }return cost;
    };
    const ordered=edges.slice().sort((a,b)=>dist(byId.get(a.source),byId.get(a.target))-dist(byId.get(b.source),byId.get(b.target))||a.id.localeCompare(b.id));
    for(const edge of ordered){const a=byId.get(edge.source),b=byId.get(edge.target);if(!a||!b)continue;
      const obstacles=[...ctx.edgeBoxes(edge),...ctx.extra.map(r=>({...r,left:r.left-4,right:r.right+4,top:r.top-4,bottom:r.bottom+4}))];
      let best=null;const pairs=[];
      for(const side of SIDES)for(const endSide of SIDES){const p=port(a,side,false),q=port(b,endSide,true);pairs.push({p,q,rank:dist(p.point,q.point)+(p.usage+q.usage)*24});}
      pairs.sort((a,b)=>a.rank-b.rank);
      const consider=(input,p,q)=>{
        const path=simplified(input);if(path.length<2||path.some((v,i)=>i&&Math.abs(v.x-path[i-1].x)>.01&&Math.abs(v.y-path[i-1].y)>.01))return;
        if(crossingIds(path,obstacles).length)return;
        const r=fromPath(path,p,q);if(crossingIds(r.points,obstacles).length)return;
        const base=r.length+r.bends*54+(p.usage+q.usage)*25;
        if(best&&base>best.score)return;
        // A 36-unit gap between neighboring cards cannot hold a polarity badge
        // and an arrowhead. Route those links outside the row instead of hiding
        // the sign under a card or painting a white circle over the arrow tip.
        let firstLabel=null,room=false;
        for(let d=28;d<=r.length-28;d+=14){const v=pointAt(r.points,d);if(labelClearance.some(b=>inside(v,b))||ctx.labelBoxes.some(b=>inside(v,b)))continue;
          if(!firstLabel)firstLabel=v;if(!edge.delay||dist(v,firstLabel)>28){room=true;break;}}
        if(!room)return;
        const score=base+congestion(r.points);if(!best||score<best.score)best={r,p,q,score};
      };
      for(const {p,q} of pairs){const s=add(p.point,p.normal,12),t=add(q.point,q.normal,15.2);
        if(ctx.obstacles.some(r=>inside(s,r)||inside(t,r)))continue;
        const prefix=[p.point,s],suffix=[t,q.point];
        if(Math.abs(s.x-t.x)<.01||Math.abs(s.y-t.y)<.01)consider([...prefix,...suffix],p,q);
        consider([...prefix,{x:s.x,y:t.y},...suffix],p,q);consider([...prefix,{x:t.x,y:s.y},...suffix],p,q);
        const nearX=[(s.x+t.x)/2,...xs].filter(x=>x>=Math.min(s.x,t.x)-100&&x<=Math.max(s.x,t.x)+100);
        const nearY=[(s.y+t.y)/2,...ys].filter(y=>y>=Math.min(s.y,t.y)-100&&y<=Math.max(s.y,t.y)+100);
        for(const x of nearX)consider([...prefix,{x,y:s.y},{x,y:t.y},...suffix],p,q);
        for(const y of nearY)consider([...prefix,{x:s.x,y},{x:t.x,y},...suffix],p,q);
      }
      if(!best){
        for(const {p,q} of pairs.slice(0,8)){const s=add(p.point,p.normal,12),t=add(q.point,q.normal,15.2);
          const path=gridPath(s,t,xs,ys,ctx.obstacles);if(path)consider([p.point,...path,q.point],p,q);
        }
      }
      if(!best)throw new Error('No collision-free straight route for '+edge.id);
      routes.set(edge.id,best.r);reserve(best.p);reserve(best.q);
    }
    const finished=finishRoutes(nodes,edges,routes,options);
    return options.waypoints?applyWaypoints(nodes,edges,finished,options.waypoints,options):finished;
  }
  function gridPath(start,end,baseX,baseY,rects){
    const xs=[...new Set([...baseX,start.x,end.x])].sort((a,b)=>a-b),ys=[...new Set([...baseY,start.y,end.y])].sort((a,b)=>a-b),w=xs.length,h=ys.length;
    const points=ys.flatMap(y=>xs.map(x=>({x,y}))),allowed=points.map(p=>!rects.some(r=>inside(p,r)));
    const source=ys.indexOf(start.y)*w+xs.indexOf(start.x),target=ys.indexOf(end.y)*w+xs.indexOf(end.x);
    const heap=[],push=item=>{heap.push(item);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p][0]<=item[0])break;heap[i]=heap[p];i=p;}heap[i]=item;},pop=()=>{const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let c=i*2+1;if(c+1<heap.length&&heap[c+1][0]<heap[c][0])c++;if(heap[c][0]>=last[0])break;heap[i]=heap[c];i=c;}heap[i]=last;}return first;};
    const costs=new Map(),previous=new Map();for(const direction of [0,1]){const key=source*2+direction;costs.set(key,0);push([Math.abs(start.x-end.x)+Math.abs(start.y-end.y),key]);}
    while(heap.length){const [,key]=pop(),id=key>>1,direction=key%2,p=points[id];if(id===target){const path=[];let at=key;while(at!==undefined){path.push(points[at>>1]);at=previous.get(at);}return simplified(path.reverse());}
      const x=id%w,y=Math.floor(id/w);
      for(const [nx,ny,dir] of [[x-1,y,0],[x+1,y,0],[x,y-1,1],[x,y+1,1]]){if(nx<0||nx>=w||ny<0||ny>=h)continue;const next=ny*w+nx;if(!allowed[next]||!clearSegment(p,points[next],rects))continue;const nk=next*2+dir,g=costs.get(key)+dist(p,points[next])+(dir===direction?0:54);if(g<(costs.get(nk)??Infinity)){costs.set(nk,g);previous.set(nk,key);push([g+Math.abs(points[next].x-end.x)+Math.abs(points[next].y-end.y),nk]);}}
    }return null;
  }
  function routeStats(routes){const values=[...routes.values()],kinds={};for(const r of values)kinds[r.kind]=(kinds[r.kind]||0)+1;
    return {routes:values.length,kinds,nodeCrossings:[...routes].filter(([,r])=>r.nodeCrossings?.length).map(([id,r])=>({edge:id,nodes:r.nodeCrossings})),obstacleCrossings:[...routes].filter(([,r])=>r.obstacleCrossings?.length).map(([id,r])=>({edge:id,obstacles:r.obstacleCrossings})),maximumBends:Math.max(0,...values.map(r=>r.bends||0)),totalSamples:values.reduce((s,r)=>s+r.points.length,0)};
  }
  window.CLD_GEOMETRY=Object.freeze({layout,layoutLoop,routeEdges,applyWaypoints,routeStats,defaults:Object.freeze({...DEFAULTS})});
})();
