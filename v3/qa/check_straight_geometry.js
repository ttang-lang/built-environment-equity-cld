const fs=require('fs'),assert=require('assert'),path=require('path');
const ROOT=path.resolve(__dirname,'..');global.window=global;
eval(fs.readFileSync(path.join(ROOT,'graph_geometry.js'),'utf8'));
const m=JSON.parse(fs.readFileSync(path.join(ROOT,'model.json'),'utf8')),before=JSON.stringify(m);
function freeze(o){if(o&&typeof o==='object'){Object.freeze(o);Object.values(o).forEach(freeze);}return o;}freeze(m);
const g=CLD_GEOMETRY,ns=g.layout(m.nodes,m.groups),regions=m.groups.map(x=>{const a=ns.filter(n=>n.group===x.id),left=Math.min(...a.map(n=>n.x))-126,right=Math.max(...a.map(n=>n.x))+126,top=Math.min(...a.map(n=>n.y))-82;return {id:'group-title-'+x.id,left:left+8,right:left+8+Math.min(230,right-left-20),top:top+6,bottom:top+28};});
freeze(ns);freeze(regions);const rs=g.routeEdges(ns,m.edges,{obstacles:regions});
const report={overview:g.routeStats(rs),loops:{},roundtripEdges:0,manualEdges:0,frozenModelUnchanged:false};
function verify(routes,es){assert.strictEqual(routes.size,es.length);for(const e of es){const r=routes.get(e.id);assert(!/[CQAS]/.test(r.d));assert(!r.nodeCrossings.length);assert(!r.obstacleCrossings.length);assert.strictEqual(r.labelPenalty,0);assert(r.terminalLength>=12);assert.strictEqual(r.editablePoints.length,r.editableVertexIndices.length);r.editableVertexIndices.forEach((v,i)=>assert.deepStrictEqual(r.vertices[v],r.editablePoints[i]));}}
verify(rs,m.edges);
for(const l of m.loops){const es=l.edges.map(id=>m.edges.find(e=>e.id===id)),r=g.routeEdges(g.layoutLoop(l,ns),es,{mode:'loop'});verify(r,es);report.loops[l.id]=g.routeStats(r);}
const baseline=JSON.stringify([...rs]);
for(const e of m.edges){const r=rs.get(e.id),points=r.editablePoints.map(p=>({...p})),wp={[e.id]:points};freeze(wp);const result=g.applyWaypoints(ns,m.edges,rs,wp,{obstacles:regions});assert.strictEqual(result.get(e.id).d,r.d);report.roundtripEdges++;
  const newPoints=points.length?points.map((p,i)=>i?{...p}:{x:p.x+20,y:p.y+12}):[{x:(r.sourceGuard.x+r.targetGuard.x)/2+20,y:(r.sourceGuard.y+r.targetGuard.y)/2+20}];
  const out=g.applyWaypoints(ns,m.edges,rs,{[e.id]:newPoints},{obstacles:regions}).get(e.id);assert.deepStrictEqual(out.sourcePoint,r.sourcePoint);assert.deepStrictEqual(out.targetPoint,r.targetPoint);assert(out.terminalLength>=12);assert.deepStrictEqual(out.editablePoints,newPoints);assert(out.d!==r.d);report.manualEdges++;
}
assert.strictEqual(JSON.stringify([...rs]),baseline);assert.strictEqual(JSON.stringify(m),before);report.frozenModelUnchanged=true;report.baseRoutesUnchanged=true;
fs.writeFileSync(path.join(__dirname,'straight_geometry_integrity.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
