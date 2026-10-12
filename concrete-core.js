'use strict';
const TYPES = {
 clean:['الخرسانة العادية / النظافة','count length width thickness','N × (L + 2E) × (B + 2E) × T'],
 footing:['القواعد المنفصلة','count length width thickness','N × L × B × T'],
 strip:['القواعد الشريطية','length width thickness','إجمالي الطول × العرض × السمك'],
 raft:['اللبشة','length width thickness','L × B × T + مناطق زيادة السمك'],
 column:['الأعمدة المستطيلة والمربعة','count width depth height','N × B × D × H'],
 circular:['الأعمدة الدائرية','count diameter height','N × π × D² / 4 × H'],
 wall:['الجدران الخرسانية','length height thickness','L × H × T − الفتحات الاختيارية'],
 beam:['الكمرات','length width height','L × B × الارتفاع الفعال'],
 slab:['البلاطات المصمتة','length width thickness','المساحة × السمك'],
 flat:['Flat Slab','length width thickness','المساحة × السمك + زيادة Drop Panels'],
 stair:['السلالم','length rise width thickness steps riser tread','√(L² + Rise²) × B × T + N × 0.5 × Riser × Tread × B'],
 landing:['البسطات','length width thickness','L × B × T'],
 tank:['الخزانات والأحواض والمسابح الخرسانية','length width height thickness wallThickness','قاعدة + جدران دون تكرار الأركان + سقف اختياري'],
 hollowOne:['بلاطة هوردي اتجاه واحد — One-Way Hollow Block','length width topping ribWidth ribDepth ribLengthX','طبقة الضغط + الأعصاب دون الكمرات'],
 hollowTwo:['بلاطة هوردي اتجاهين — Two-Way Hollow Block','length width topping ribWidth ribDepth ribLengthX ribLengthY','طبقة الضغط + أعصاب X + أعصاب Y − التقاطعات'],
 custom:['عنصر خرسانة مخصص','length width thickness','حسب الطريقة المختارة']
};
const METHODS={box:'length width thickness',section:'length section',area:'area thickness',unit:'count unitVolume',direct:'volume'};
function positive(v,name='القيمة'){if(typeof v!=='number'||!Number.isFinite(v)||v<=0)throw Error(`${name}: أدخل رقمًا أكبر من صفر.`);return v;}
function nonnegative(v,name='القيمة'){if(typeof v!=='number'||!Number.isFinite(v)||v<0)throw Error(`${name}: أدخل رقمًا غير سالب.`);return v;}
function calculateItem(item){
 const {type,values:v,options:o={}}=item;if(!TYPES[type])throw Error('نوع غير صالح');
 let fields=TYPES[type][1];if((type==='slab'||type==='flat')&&o.areaMode)fields='area thickness';if(type==='custom')fields=METHODS[o.method];if(!fields)throw Error('طريقة غير صالحة');
 fields.split(' ').forEach(k=>positive(v[k],k));
 for(const k of ['count','steps'])if(fields.split(' ').includes(k)&&!Number.isSafeInteger(v[k]))throw Error('العدد يجب أن يكون صحيحًا موجبًا');
 const n=v.count||1;let volume=0,formwork=0,parts={};
 const extra=()=> (item.extras||[]).reduce((sum,e)=>{['count','length','width','delta'].forEach(k=>positive(e[k],k));if(!Number.isSafeInteger(e.count))throw Error('عدد المناطق غير صحيح');return sum+e.count*e.length*e.width*e.delta;},0);
 switch(type){
 case 'hollowOne':case 'hollowTwo':{
 const ribCount=(axis,span)=>{const mode=o['ribMode'+axis]||'actual';if(mode==='spacing'){const spacing=positive(v['spacing'+axis],'المسافة بين الأعصاب');if(spacing<v.ribWidth)throw Error('المسافة بين الأعصاب أقل من عرض العصب');return Math.floor(span/spacing)+1;}const count=positive(v['ribs'+axis],'عدد الأعصاب');if(!Number.isSafeInteger(count))throw Error('عدد الأعصاب يجب أن يكون صحيحًا موجبًا');return count;};
 const nx=ribCount('X',v.width);const ny=type==='hollowTwo'?ribCount('Y',v.length):0;
 if(v.ribWidth>Math.min(v.length,v.width)||v.ribLengthX>v.length||(ny&&v.ribLengthY>v.width))throw Error('أبعاد الأعصاب تتجاوز أبعاد البلاطة');
 if(nx*v.ribWidth>v.width||(ny&&ny*v.ribWidth>v.length))throw Error('عدد الأعصاب وعرضها غير منطقيين لأبعاد البلاطة');
 parts.topping=v.length*v.width*v.topping;parts.ribsX=nx*v.ribLengthX*v.ribWidth*v.ribDepth;parts.ribsY=ny?ny*v.ribLengthY*v.ribWidth*v.ribDepth:0;
 parts.intersections=nx*ny;parts.overlap=nx*ny*v.ribWidth**2*v.ribDepth;parts.countX=nx;parts.countY=ny;
 if(parts.overlap>Math.min(parts.ribsX,parts.ribsY)&&ny)throw Error('خصم التقاطعات يتجاوز حجم الأعصاب؛ راجع الأطوال والأعداد');
 volume=parts.topping+parts.ribsX+parts.ribsY-parts.overlap;formwork=v.length*v.width;break;}
 case 'clean':{const e=nonnegative(v.extension??0);volume=n*(v.length+2*e)*(v.width+2*e)*v.thickness;break;}
 case 'footing': volume=n*v.length*v.width*v.thickness;if(o.sides)formwork=n*2*(v.length+v.width)*v.thickness;break;
 case 'strip':case 'landing':volume=v.length*v.width*v.thickness;break;
 case 'raft':volume=v.length*v.width*v.thickness+extra();break;
 case 'column':volume=n*v.width*v.depth*v.height;formwork=n*2*(v.width+v.depth)*v.height;break;
 case 'circular':volume=n*Math.PI*v.diameter**2/4*v.height;formwork=n*Math.PI*v.diameter*v.height;break;
 case 'wall':{let area=v.length*v.height;if(o.deduct){const openings=nonnegative(v.openings??0);if(openings>=area)throw Error('مساحة الفتحات يجب أن تقل عن مساحة الجدار');area-=openings;}volume=area*v.thickness;formwork=area*(o.faces===1?1:2);break;}
 case 'beam':{const h=o.dropped?v.height-positive(v.slabThickness,'سمك البلاطة'):v.height;positive(h,'الارتفاع الفعال');volume=v.length*v.width*h;formwork=v.length*(2*h+v.width);break;}
 case 'slab':case 'flat':{const area=o.areaMode?v.area:v.length*v.width;volume=area*v.thickness+(type==='flat'?extra():0);formwork=area;break;}
 case 'stair':parts.waist=Math.hypot(v.length,v.rise)*v.width*v.thickness;parts.steps=v.steps*.5*v.riser*v.tread*v.width;volume=parts.waist+parts.steps;break;
 case 'tank':{positive(v.wallThickness);const t=v.wallThickness;const outer=(v.length+2*t)*(v.width+2*t);parts.base=outer*v.thickness;parts.walls=(outer-v.length*v.width)*v.height;parts.roof=o.roof?outer*positive(v.roofThickness,'سمك السقف'):0;volume=parts.base+parts.walls+parts.roof;break;}
 case 'custom':switch(o.method){case 'box':volume=v.length*v.width*v.thickness;break;case 'section':volume=v.length*v.section;break;case 'area':volume=v.area*v.thickness;break;case 'unit':volume=n*v.unitVolume;break;case 'direct':volume=v.volume;break;}break;
 }
 positive(volume,'الحجم');nonnegative(formwork,'الشدات');const plain=type==='clean'||o.plain===true;
 const steelRate=nonnegative(item.steelRate??0,'معامل الحديد');const steel=plain?0:volume*steelRate;nonnegative(steel);
 return {volume,formwork,steel,plain,parts};
}
function summarize(items,settings={}){
 let plain=0,reinforced=0,steel=0,formwork=0;
 for(const item of items){const r=calculateItem(item);if(r.plain)plain+=r.volume;else reinforced+=r.volume;steel+=r.steel;formwork+=r.formwork;}
 const geometric=plain+reinforced;const wasteRate=nonnegative(settings.waste??0,'الهدر');const waste=geometric*wasteRate/100;const order=geometric+waste;
 const p=settings.prices||{};for(const v of Object.values(p))nonnegative(v,'السعر');
 const direct=plain*(1+wasteRate/100)*(p.plain||0)+reinforced*(1+wasteRate/100)*(p.reinforced||0)+steel/1000*(p.steel||0)+formwork*(p.formwork||0)+(p.labor||0)+(p.pump||0)+(p.other||0);
 const overhead=direct*(p.overhead||0)/100;const profit=(direct+overhead)*(p.profit||0)/100;const final=direct+overhead+profit;
 const result={plain,reinforced,geometric,waste,order,steel,tons:steel/1000,formwork,direct,overhead,profit,final};Object.values(result).forEach(v=>nonnegative(v,'الإجمالي'));return result;
}
const ConcreteCore={TYPES,METHODS,calculateItem,summarize};
if(typeof module!=='undefined')module.exports=ConcreteCore;
