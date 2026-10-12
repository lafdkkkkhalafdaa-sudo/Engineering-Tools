const {test}=require('node:test');const assert=require('node:assert/strict');const {calculateItem,summarize,TYPES}=require('./concrete-core.js');
const item=(type,values,options={},extras=[])=>({type,values,options,extras});const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const cases=[
 ['clean',{count:2,length:2,width:3,thickness:.1,extension:.2},{},1.632],
 ['footing',{count:4,length:2,width:3,thickness:.5},{sides:true},12,20],
 ['strip',{length:10,width:.6,thickness:.4},{},2.4],
 ['raft',{length:10,width:8,thickness:.3},{},24],
 ['column',{count:5,width:.3,depth:.4,height:3},{},1.8,21],
 ['circular',{count:2,diameter:1,height:3},{},1.5*Math.PI,6*Math.PI],
 ['wall',{length:10,height:3,thickness:.2},{},6,60],
 ['wall',{length:10,height:3,thickness:.2,openings:5},{deduct:true,faces:1},5,25],
 ['beam',{length:20,width:.25,height:.5},{},2.5,25],
 ['beam',{length:20,width:.25,height:.5,slabThickness:.2},{dropped:true},1.5,17],
 ['slab',{length:8,width:6,thickness:.15},{},7.2,48],
 ['flat',{area:48,thickness:.2},{areaMode:true},9.6,48],
 ['stair',{length:4,rise:3,width:2,thickness:.2,steps:10,riser:.3,tread:.4},{},3.2],
 ['landing',{length:2,width:3,thickness:.2},{},1.2],
 ['tank',{length:4,width:3,height:2,thickness:.3,wallThickness:.2,roofThickness:.15},{roof:true},12.652],
 ['custom',{length:2,width:3,thickness:.5},{method:'box'},3],
 ['custom',{length:10,section:.3},{method:'section'},3],
 ['custom',{area:10,thickness:.3},{method:'area'},3],
 ['custom',{count:3,unitVolume:2},{method:'unit'},6],
 ['custom',{volume:7},{method:'direct'},7]
];
for(const [type,v,o,expected,forms]of cases)test(`${type} ${JSON.stringify(o)}`,()=>{const r=calculateItem(item(type,v,o));near(r.volume,expected);if(forms!==undefined)near(r.formwork,forms);for(const key of Object.keys(v).filter(k=>!['extension','openings'].includes(k)))for(const bad of [0,-1,NaN,Infinity,'2'])assert.throws(()=>calculateItem(item(type,{...v,[key]:bad},o)));});
test('additional thickness is incremental for rafts and flat slabs',()=>{const extras=[{count:2,length:2,width:2,delta:.1},{count:1,length:1,width:1,delta:.2}];near(calculateItem(item('raft',{length:10,width:8,thickness:.3},{},extras)).volume,25);near(calculateItem(item('flat',{area:80,thickness:.3},{areaMode:true},extras)).volume,25);assert.throws(()=>calculateItem(item('raft',{length:10,width:8,thickness:.3},{},[{count:1,length:2,width:2,delta:0}])));});
test('optional roof, openings and integer validation',()=>{near(calculateItem(item('tank',{length:4,width:3,height:2,thickness:.3,wallThickness:.2})).volume,10.408);near(calculateItem(item('wall',{length:10,height:3,thickness:.2,openings:99})).volume,6);assert.throws(()=>calculateItem(item('wall',{length:10,height:3,thickness:.2,openings:30},{deduct:true})));assert.throws(()=>calculateItem(item('beam',{length:10,width:.3,height:.2,slabThickness:.3},{dropped:true})));assert.throws(()=>calculateItem(item('column',{count:1.5,width:1,depth:1,height:1})));assert.throws(()=>calculateItem(item('custom',{volume:Infinity},{method:'direct'})));});
test('totals, waste, steel, formwork and compounded costs',()=>{const a=item('clean',{count:1,length:2,width:2,thickness:.25});const b={...item('column',{count:1,width:1,depth:1,height:2}),steelRate:100};const s=summarize([a,b],{waste:5,prices:{plain:100,reinforced:200,steel:1000,formwork:10,labor:20,pump:30,other:40,overhead:10,profit:20}});near(s.plain,1);near(s.reinforced,2);near(s.geometric,3);near(s.waste,.15);near(s.order,3.15);near(s.steel,200);near(s.tons,.2);near(s.formwork,8);near(s.direct,895);near(s.overhead,89.5);near(s.profit,196.9);near(s.final,1181.4);assert.throws(()=>summarize([a],{waste:-1}));assert.throws(()=>summarize([a],{prices:{plain:NaN}}));near(summarize([]).geometric,0);});
test('ordinary concrete does not produce estimated reinforcement and overflow is rejected',()=>{near(calculateItem({...item('clean',{count:1,length:1,width:1,thickness:1}),steelRate:100}).steel,0);assert.throws(()=>calculateItem(item('custom',{length:1e308,width:1e308,thickness:1},{method:'box'})));assert.equal(Object.keys(TYPES).length,14);});
