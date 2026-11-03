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
  function cubicPoint(a, b, c, d, t) {
    const u = 1 - t;
    return {x: u*u*u*a.x + 3*u*u*t*b.x + 3*u*t*t*c.x + t*t*t*d.x,
      y: u*u*u*a.y + 3*u*u*t*b.y + 3*u*t*t*c.y + t*t*t*d.y};
  }
  function sampleCubic(a, b, c, d) {
    const count = Math.max(24, Math.ceil((dist(a, b) + dist(b, c) + dist(c, d)) / 9));
    return Array.from({length: count + 1}, (_, i) => cubicPoint(a, b, c, d, i / count));
  }
  function sampleQuadratic(a, b, c) {
    const count = Math.max(10, Math.ceil((dist(a, b) + dist(b, c)) / 7));
    return Array.from({length: count + 1}, (_, i) => {
      const t = i / count, u = 1 - t;
      return {x: u*u*a.x + 2*u*t*b.x + t*t*c.x, y: u*u*a.y + 2*u*t*b.y + t*t*c.y};
    });
  }
  function lineSamples(a, b) {
    const count = Math.max(1, Math.ceil(dist(a, b) / 9));
    return Array.from({length: count + 1}, (_, i) => ({x: a.x + (b.x-a.x)*i/count, y: a.y + (b.y-a.y)*i/count}));
  }
  const lengthOf = points => points.slice(1).reduce((s, p, i) => s + dist(points[i], p), 0);
  function crossingIds(points, rects, firstOnly = false) {
    // Most boxes lie outside a curve's bounding box. Reject them before detailed
    // sampling, and stop early while evaluating a candidate that will be discarded.
    let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
    for(const p of points){left=Math.min(left,p.x);right=Math.max(right,p.x);top=Math.min(top,p.y);bottom=Math.max(bottom,p.y);}
    const hits=[];
    for(const r of rects){
      if(right<=r.left||left>=r.right||bottom<=r.top||top>=r.bottom)continue;
      if(points.some(p=>inside(p,r))||points.some((p,i)=>i&&segmentCrosses(points[i-1],p,r))){
        hits.push(r.id);if(firstOnly)break;
      }
    }
    return hits;
  }
  function pointAt(points, distance) {
    let remaining = Math.max(0, distance);
    for (let i = 1; i < points.length; i++) {
      const len = dist(points[i - 1], points[i]);
      if (len >= remaining && len > 0) {
        const t = remaining / len;
        return {x: points[i - 1].x + (points[i].x-points[i - 1].x)*t,
          y: points[i - 1].y + (points[i].y-points[i - 1].y)*t};
      }
      remaining -= len;
    }
    return {...points[points.length - 1]};
  }
  function cubicRoute(a, b, c, d, endNormal = null) {
    let end=d,control=c;
    if(endNormal){
      const normal=unit(endNormal);end=add(d,normal,12);
      const projection=(c.x-end.x)*normal.x+(c.y-end.y)*normal.y;
      control=add(end,normal,Math.max(18,projection));
    }
    const points = sampleCubic(a, b, control, end);
    let path=`M ${xy(a)} C ${xy(b)} ${xy(control)} ${xy(end)}`;
    if(endNormal){path+=` L ${xy(d)}`;points.push(...lineSamples(end,d).slice(1));}
    return {d:path,points,kind:'cubic',bends:0,terminalLength:endNormal?12:0};
  }
  function simplified(points) {
    const out = [];
    for (const p of unique(points)) {
      while (out.length >= 2) {
        const a = out[out.length - 2], b = out[out.length - 1];
        const cross = (b.x-a.x)*(p.y-b.y) - (b.y-a.y)*(p.x-b.x);
        if (Math.abs(cross) > .01 || (b.x-a.x)*(p.x-b.x)+(b.y-a.y)*(p.y-b.y) < 0) break;
        out.pop();
      }
      out.push(p);
    }
    return out;
  }
  function roundedRoute(input, radius = 58) {
    const ps = simplified(input);
    if (ps.length < 2) return null;
    let d = `M ${xy(ps[0])}`, samples = [ps[0]], previous = ps[0];
    for (let i = 1; i < ps.length - 1; i++) {
      const a = ps[i - 1], b = ps[i], c = ps[i + 1];
      const terminalLimit=i===ps.length-2?Math.max(0,dist(b,c)-12):Infinity;
      const r = Math.min(radius, dist(a,b)*.38, dist(b,c)*.38,terminalLimit);
      const u = add(b, unit({x:a.x-b.x,y:a.y-b.y}), r);
      const v = add(b, unit({x:c.x-b.x,y:c.y-b.y}), r);
      samples.push(...lineSamples(previous, u).slice(1), ...sampleQuadratic(u,b,v).slice(1));
      d += ` L ${xy(u)} Q ${xy(b)} ${xy(v)}`;
      previous = v;
    }
    const last = ps[ps.length - 1];
    d += ` L ${xy(last)}`; samples.push(...lineSamples(previous,last).slice(1));
    return {d, points: samples, kind: 'rounded-visibility', bends: Math.max(0,ps.length-2),terminalLength:dist(previous,last)};
  }

  // One sparse visibility graph per layout; no pixel-grid turns or per-cell congestion.
  function visibilityGraph(rects) {
    const vertices = [];
    for (const r of rects) vertices.push({x:r.left,y:r.top},{x:r.right,y:r.top},{x:r.right,y:r.bottom},{x:r.left,y:r.bottom});
    const adjacency = vertices.map(() => []);
    for (let i=0;i<vertices.length;i++) for (let j=i+1;j<vertices.length;j++) {
      if (!clearSegment(vertices[i],vertices[j],rects)) continue;
      const weight = dist(vertices[i],vertices[j]);
      adjacency[i].push([j,weight]); adjacency[j].push([i,weight]);
    }
    return {vertices,adjacency,rects};
  }
  function visibilityPath(graph, start, end) {
    if (clearSegment(start,end,graph.rects)) return [start,end];
    const {vertices,adjacency,rects} = graph, n=vertices.length;
    const points=[...vertices,start,end], arcs=adjacency.map(a=>a.slice());arcs.push([],[]);
    for (let i=0;i<n;i++) {
      if (clearSegment(start,vertices[i],rects)) {const w=dist(start,vertices[i]);arcs[n].push([i,w]);arcs[i].push([n,w]);}
      if (clearSegment(end,vertices[i],rects)) {const w=dist(end,vertices[i]);arcs[n+1].push([i,w]);arcs[i].push([n+1,w]);}
    }
    const costs=new Float64Array(n+2).fill(Infinity),prev=new Int32Array(n+2).fill(-1),done=new Uint8Array(n+2);
    costs[n]=0;
    for(let iteration=0;iteration<n+2;iteration++) {
      let at=-1,score=Infinity;
      for(let i=0;i<n+2;i++) if(!done[i]&&costs[i]<score){score=costs[i];at=i;}
      if(at<0)break;
      if(at===n+1){const path=[];for(let i=at;i>=0;i=prev[i])path.push(points[i]);return path.reverse();}
      done[at]=1;
      for(const [next,w] of arcs[at]) {
        // Favor a small number of broad bends over short paths weaving between boxes.
        const value=costs[at]+w+100;
        if(value<costs[next]){costs[next]=value;prev[next]=at;}
      }
    }
    return null;
  }
  function rayExit(node, direction, width, height, margin=7) {
    const t=Math.min((width/2+margin)/(Math.abs(direction.x)||1e-9),(height/2+margin)/(Math.abs(direction.y)||1e-9));
    return add(node,direction,t);
  }

  function routeEdges(nodes, edges, options={}) {
    const {width,height,mode='overview'}=optionsFor(options);
    const byId=new Map(nodes.map(n=>[n.id,n])), result=new Map();
    const nodeBoxes=nodes.map(n=>rectangle(n,width,height,2));
    const extra=(options.obstacles||[]).filter(r=>['left','right','top','bottom'].every(k=>Number.isFinite(r[k]))&&r.left<r.right&&r.top<r.bottom)
      .map((r,i)=>({...r,id:r.id||`obstacle-${i}`}));
    const expand=(r,pad)=>({...r,left:r.left-pad,right:r.right+pad,top:r.top-pad,bottom:r.bottom+pad});
    const titleBoxes=extra.map(r=>expand(r,4)),nodeBoxCache=new Map(),tightCache=new Map();
    const boxesForTarget=edge=>{
      if(!nodeBoxCache.has(edge.target))nodeBoxCache.set(edge.target,nodeBoxes.map(r=>r.id===edge.target?rectangle(byId.get(edge.target),width,height,.5):r));
      return nodeBoxCache.get(edge.target);
    };
    const tightFor=edge=>{
      if(!tightCache.has(edge.target))tightCache.set(edge.target,[...boxesForTarget(edge),...titleBoxes]);
      return tightCache.get(edge.target);
    };
    const padded=[...nodes.map(n=>rectangle(n,width,height,14)),...extra.map(r=>expand(r,8))];
    const labelBoxes=[...nodes.map(n=>rectangle(n,width,height,15)),...extra.map(r=>expand(r,13))];
    const usedPorts=new Map(), labels=[];
    let headReservations=[];
    let visibility=null;
    const getPort=(node,side,incoming)=>{
      const key=node.id+':'+side,used=usedPorts.get(key)||[];
      const span=(side==='e'||side==='w')?height/2-17:width/2-22;
      const candidates=[0,-18,18,-36,36,-54,54,-72,72,-90,90].filter(x=>Math.abs(x)<=span);
      const offset=candidates.reduce((best,x)=>{
        const clearance=used.length?Math.min(...used.map(v=>Math.abs(v-x))):Infinity;
        const bestClearance=used.length?Math.min(...used.map(v=>Math.abs(v-best))):Infinity;
        return clearance>bestClearance?x:best;
      },candidates[0]);
      // The rendered arrow tip lands here; 0.8 units leaves it just outside the card stroke.
      const norm=normals[side],point={x:node.x+norm.x*(width/2+(incoming ? 0.8 : 4)),y:node.y+norm.y*(height/2+(incoming ? 0.8 : 4))};
      if(norm.x)point.y+=offset;else point.x+=offset;
      return {key,side,offset,normal:norm,point,usage:used.length};
    };
    const storePort=p=>{const list=usedPorts.get(p.key)||[];list.push(p.offset);usedPorts.set(p.key,list);};
    const labelPlacement=(edge,route,reserve=false)=>{
      const length=route.length||lengthOf(route.points),occupied=labels.slice();
      const heads=headReservations.length?headReservations:[route.points[route.points.length-1]];
      let penalty=0;
      const chooseLabel=distances=>{
        let best=null,bestScore=Infinity,bestPenalty=Infinity;
        for(const distance of distances){
          const point=pointAt(route.points,Math.max(10,Math.min(length-10,distance)));
          const nodePenalty=labelBoxes.filter(r=>inside(point,r)).length*10000;
          const headPenalty=heads.reduce((s,tip)=>s+(dist(point,tip)<28?10000:0),0);
          const labelPenalty=occupied.reduce((s,l)=>s+Math.max(0,25-dist(point,l))*50,0);
          const score=nodePenalty+headPenalty+labelPenalty+Math.abs(distance-distances[0])*.15;
          if(score<bestScore){bestScore=score;best=point;bestPenalty=nodePenalty+headPenalty+labelPenalty;}
        }
        occupied.push(best);penalty+=bestPenalty;
        return best;
      };
      const scan=[];for(let distance=28;distance<=length-28;distance+=10)scan.push(distance);
      const signPoint=chooseLabel([length-38,length-54,length-72,length-96,length*.72,...scan.slice().reverse()]);
      const delayPoint=edge.delay?chooseLabel([length*.48,length*.38,length*.6,length*.28,length*.15,length*.85,...scan]):null;
      if(reserve){labels.push(signPoint);if(delayPoint)labels.push(delayPoint);}
      return {signPoint,delayPoint,penalty};
    };
    const finish=(edge,route,p,q)=>{
      route.sourcePoint=route.points[0];route.targetPoint=route.points[route.points.length-1];
      route.length=lengthOf(route.points);route.sourceSide=p?.side;route.targetSide=q?.side;
      const placement=labelPlacement(edge,route,true);
      route.signPoint=placement.signPoint;route.delayPoint=placement.delayPoint;
      route.labelPenalty=placement.penalty;
      route.nodeCrossings=crossingIds(route.points,boxesForTarget(edge));
      route.obstacleCrossings=crossingIds(route.points,extra);
      result.set(edge.id,route);
      if(p)storePort(p);if(q)storePort(q);
    };
    const finalizeLabels=()=>{
      // Protect the full head plus the last13 units of shaft from every white label
      // circle, including labels on edges routed earlier in the calculation.
      headReservations=[...result.values()].map(r=>r.targetPoint);
      labels.length=0;
      const order=edges.filter(e=>result.has(e.id)).slice().sort((a,b)=>result.get(a.id).length-result.get(b.id).length||a.id.localeCompare(b.id));
      for(const edge of order){const route=result.get(edge.id),placement=labelPlacement(edge,route,true);
        route.signPoint=placement.signPoint;route.delayPoint=placement.delayPoint;route.labelPenalty=placement.penalty;
      }
    };

    // Route small feedback loops along the ellipse tangent for clean, readable cycles.
    if(mode==='loop'&&nodes.every(n=>Number.isFinite(n._loopAngle))) {
      for(const edge of edges){
        const a=byId.get(edge.source),b=byId.get(edge.target);if(!a||!b)continue;
        const count=a._loopCount,delta=Math.PI*2/count,factor=4/3*Math.tan(delta/4);
        const ta={x:-Math.sin(a._loopAngle)*a._loopRadii.x,y:Math.cos(a._loopAngle)*a._loopRadii.y};
        const tb={x:-Math.sin(b._loopAngle)*b._loopRadii.x,y:Math.cos(b._loopAngle)*b._loopRadii.y};
        const p=rayExit(a,unit(ta),width,height,5),q=rayExit(b,unit({x:-tb.x,y:-tb.y}),width,height,.8);
        let c1=add(a,ta,factor),c2=add(b,tb,-factor);
        if(dist(p,c1)<32)c1=add(p,unit(ta),42);
        if(dist(q,c2)<32)c2=add(q,unit({x:-tb.x,y:-tb.y}),42);
        const route=cubicRoute(p,c1,c2,q,unit({x:-tb.x,y:-tb.y}));route.kind='loop-arc';finish(edge,route);
      }
      finalizeLabels();
      return result;
    }

    const extent={left:Math.min(...nodes.map(n=>n.x))-width/2-100,right:Math.max(...nodes.map(n=>n.x))+width/2+100,
      top:Math.min(...nodes.map(n=>n.y))-height/2-110,bottom:Math.max(...nodes.map(n=>n.y))+height/2+110};
    const routeScore=(route,p,q,edge)=>{
      const outside=route.points.reduce((sum,v)=>sum+Math.max(0,extent.left-v.x,v.x-extent.right,extent.top-v.y,v.y-extent.bottom),0)/route.points.length;
      return lengthOf(route.points)+outside*4+(p.usage+q.usage)*16+(route.bends||0)*13+labelPlacement(edge,route).penalty;
    };
    // Short local edges get the clearest ports before longer network links are routed.
    const ordered=[...edges].sort((ea,eb)=>{
      const a=byId.get(ea.source),b=byId.get(ea.target),c=byId.get(eb.source),d=byId.get(eb.target);
      return a&&b&&c&&d?dist(a,b)-dist(c,d)||ea.id.localeCompare(eb.id):0;
    });
    for(const edge of ordered){
      const a=byId.get(edge.source),b=byId.get(edge.target);if(!a||!b)continue;
      const pairs=[];
      for(const side of SIDES)for(const endSide of SIDES){
        const p=getPort(a,side,false),q=getPort(b,endSide,true);
        const toward=unit({x:b.x-a.x,y:b.y-a.y});
        const facingPenalty=(1-(p.normal.x*toward.x+p.normal.y*toward.y))*35+(1+(q.normal.x*toward.x+q.normal.y*toward.y))*35;
        pairs.push({p,q,rank:dist(p.point,q.point)+facingPenalty+(p.usage+q.usage)*18});
      }
      pairs.sort((a,b)=>a.rank-b.rank);
      let best=null;
      for(const {p,q} of pairs){
        const d=dist(p.point,q.point),base=Math.min(155,Math.max(48,d*.3));
        for(const handle of [base,64,110,190,290]){
          for(const bow of [0,28,-28]){
            const direction=unit({x:q.point.x-p.point.x,y:q.point.y-p.point.y}),perp={x:-direction.y,y:direction.x};
            const c1=add(add(p.point,p.normal,handle),perp,bow),c2=add(add(q.point,q.normal,handle),perp,bow);
            const route=cubicRoute(p.point,c1,c2,q.point,q.normal);
            if(crossingIds(route.points,tightFor(edge),true).length)continue;
            const score=routeScore(route,p,q,edge)+(bow===0?5:0);
            if(!best||score<best.score)best={route,p,q,score};
          }
        }
      }
      // A rounded visibility route is considered where direct arcs are absent or circuitous.
      if(!best||best.score>dist(a,b)*1.3+100){
        visibility ||= visibilityGraph(padded);
        for(const {p,q} of pairs){
          // The original grouped layout has 36px horizontal gaps. Connect to a
          // visibility point 16px outside each box rather than jumping into its neighbor.
          const start=add(p.point,p.normal,12),end=add(q.point,q.normal,15.2);
          if(padded.some(r=>inside(start,r)||inside(end,r)))continue;
          const path=visibilityPath(visibility,start,end);if(!path)continue;
          for(const radius of [58,36,18]){
            const route=roundedRoute([p.point,...path,q.point],radius);if(!route)continue;
            if(crossingIds(route.points,tightFor(edge),true).length)continue;
            const score=routeScore(route,p,q,edge)+35;
            if(!best||score<best.score)best={route,p,q,score};
            break;
          }
        }
      }
      // Valid grid layouts always have an outer visibility path. Preserve an inspectable
      // diagnostic if a caller supplies overlapping or otherwise impossible coordinates.
      if(!best){
        const {p,q}=pairs[0],middle={x:(p.point.x+q.point.x)/2,y:Math.min(extent.top,a.y,b.y)-70};
        const route=cubicRoute(p.point,{x:p.point.x,y:middle.y},{x:q.point.x,y:middle.y},q.point,q.normal);
        route.kind='diagnostic-fallback';best={route,p,q};
      }
      finish(edge,best.route,best.p,best.q);
    }

    // Two long corridors in this atlas can become almost completely covered by
    // other arrows' interaction strokes. Keep the established node positions and
    // give these links an open-space alternative with a substantial exposed segment.
    const separatedRoute=(edge,candidates)=>{
      const previous=result.get(edge.id);if(!previous)return;
      const previousLabels=[previous.signPoint,previous.delayPoint].filter(Boolean);
      for(const label of previousLabels){const at=labels.indexOf(label);if(at>=0)labels.splice(at,1);}
      const cellSize=32,occupied=new Map();
      for(const [id,route] of result){if(id===edge.id)continue;for(const p of route.points){
        const key=`${Math.floor(p.x/cellSize)},${Math.floor(p.y/cellSize)}`;
        if(!occupied.has(key))occupied.set(key,[]);occupied.get(key).push(p);
      }}
      const exposedFraction=route=>{
        const samples=route.points.slice(2,-2);let exposed=0;
        for(const p of samples){let near=false;const x=Math.floor(p.x/cellSize),y=Math.floor(p.y/cellSize);
          for(let dx=-1;dx<=1&&!near;dx++)for(let dy=-1;dy<=1&&!near;dy++){
            if((occupied.get(`${x+dx},${y+dy}`)||[]).some(q=>dist(p,q)<19))near=true;
          }
          if(!near)exposed++;
        }
        return samples.length?exposed/samples.length:0;
      };
      let best=null;
      for(const candidate of candidates){const {route,p,q}=candidate;
        if(crossingIds(route.points,tightFor(edge),true).length||labelPlacement(edge,route).penalty>0)continue;
        const exposed=exposedFraction(route);
        const score=exposed*1000-lengthOf(route.points)*.025;
        if(exposed>=.2&&(!best||score>best.score))best={route,p,q,score,exposed};
      }
      if(best){best.route.separationApplied=true;best.route.exposedFraction=best.exposed;finish(edge,best.route,best.p,best.q);}
      else labels.push(...previousLabels);
    };
    const incomeStress=edges.find(e=>e.id==='E04'&&e.source==='V01'&&e.target==='V29');
    if(incomeStress){
      const a=byId.get(incomeStress.source),b=byId.get(incomeStress.target);
      const p=getPort(a,'w',false),q=getPort(b,'n',true),candidates=[];
      const left=Math.min(...nodeBoxes.map(r=>r.left),...extra.map(r=>r.left));
      for(const margin of [70,100,130])for(const rise of [100,136,170]){
        const x=left-margin,y=b.y-height/2-rise;
        const route=roundedRoute([p.point,{x,y:p.point.y},{x,y},{x:q.point.x,y},q.point],58);
        if(route)candidates.push({route,p,q});
      }
      separatedRoute(incomeStress,candidates);
    }
    const safetyTravel=edges.find(e=>e.id==='E43'&&e.source==='V27'&&e.target==='V21');
    if(safetyTravel){
      const a=byId.get(safetyTravel.source),b=byId.get(safetyTravel.target),candidates=[];
      for(const startSide of ['n','w']){
        const p=getPort(a,startSide,false),q=getPort(b,'s',true);
        const direction=unit({x:q.point.x-p.point.x,y:q.point.y-p.point.y}),perp={x:-direction.y,y:direction.x};
        for(const handle of [60,90,120,160,200])for(const bow of [0,20,-20,40,-40]){
          const c1=add(add(p.point,p.normal,handle),perp,bow),c2=add(add(q.point,q.normal,handle),perp,bow);
          candidates.push({route:cubicRoute(p.point,c1,c2,q.point,q.normal),p,q});
        }
      }
      separatedRoute(safetyTravel,candidates);
    }
    finalizeLabels();
    // Preserve input edge order for deterministic DOM, export and keyboard traversal.
    return new Map(edges.filter(e=>result.has(e.id)).map(e=>[e.id,result.get(e.id)]));
  }

  function routeStats(routes) {
    const values=[...routes.values()],kinds={};
    for(const r of values)kinds[r.kind]=(kinds[r.kind]||0)+1;
    return {routes:values.length,kinds,nodeCrossings:[...routes].filter(([,r])=>r.nodeCrossings.length).map(([id,r])=>({edge:id,nodes:r.nodeCrossings})),
      obstacleCrossings:[...routes].filter(([,r])=>r.obstacleCrossings?.length).map(([id,r])=>({edge:id,obstacles:r.obstacleCrossings})),
      maximumBends:Math.max(0,...values.map(r=>r.bends||0)),totalSamples:values.reduce((s,r)=>s+r.points.length,0)};
  }
  window.CLD_GEOMETRY=Object.freeze({layout,layoutLoop,routeEdges,routeStats,defaults:Object.freeze({...DEFAULTS})});
})();
