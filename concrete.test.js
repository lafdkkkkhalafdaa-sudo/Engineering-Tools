const {test}=require('node:test');
const assert=require('node:assert/strict');
const {concreteVolume}=require('./concrete.js');
const cases=[
 [0,{count:4,length:2,width:3,thickness:.5},12],
 [1,{length:10,width:.6,thickness:.4},2.4],
 [2,{length:10,width:8,thickness:.3},24],
 [3,{count:5,width:.3,thickness:.4,height:3},1.8],
 [4,{length:10,height:3,thickness:.2},6],
 [5,{length:20,width:.25,height:.5},2.5],
 [6,{length:8,width:6,thickness:.15},7.2]
];
for(const [type,values,expected] of cases) test(`concrete volume type ${type}`,()=>{
 assert.ok(Math.abs(concreteVolume(type,values)-expected)<1e-10);
 for(const key of Object.keys(values)) for(const bad of [0,-1,NaN,Infinity]) assert.throws(()=>concreteVolume(type,{...values,[key]:bad}));
});
test('invalid counts, missing fields and numeric overflow',()=>{
 assert.throws(()=>concreteVolume(0,{count:1.5,length:2,width:3,thickness:.5}));
 assert.throws(()=>concreteVolume(2,{length:2,width:3}));
 assert.throws(()=>concreteVolume(2,{length:1e308,width:1e308,thickness:1}));
});
