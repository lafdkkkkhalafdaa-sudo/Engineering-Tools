'use strict';
const concreteTypes = [
  {name:'القواعد المنفصلة', fields:[['count','العدد'],['length','الطول'],['width','العرض'],['thickness','السمك']]},
  {name:'القواعد الشريطية', fields:[['length','إجمالي الطول'],['width','العرض'],['thickness','السمك']]},
  {name:'اللبشة', fields:[['length','الطول'],['width','العرض'],['thickness','السمك']]},
  {name:'الأعمدة', fields:[['count','العدد'],['width','العرض'],['thickness','السمك'],['height','الارتفاع']]},
  {name:'الجدران الخرسانية', fields:[['length','الطول'],['height','الارتفاع'],['thickness','السمك']]},
  {name:'الكمرات', fields:[['length','إجمالي الطول'],['width','العرض'],['height','الارتفاع']]},
  {name:'البلاطات', fields:[['length','الطول'],['width','العرض'],['thickness','السمك']]}
];
function concreteVolume(typeIndex, values) {
  const type = concreteTypes[typeIndex];
  if (!type) throw new Error('نوع العنصر غير صحيح.');
  let volume = 1;
  for (const [key] of type.fields) {
    const value = values[key];
    if (!Number.isFinite(value) || value <= 0) throw new Error('أدخل جميع الأبعاد والعدد بقيم أكبر من صفر.');
    if (key === 'count' && !Number.isSafeInteger(value)) throw new Error('العدد يجب أن يكون عددًا صحيحًا موجبًا.');
    volume *= value;
  }
  if (!Number.isFinite(volume) || volume <= 0) throw new Error('القيم خارج النطاق المسموح للحساب.');
  return volume;
}
if (typeof document !== 'undefined') {
  const format = new Intl.NumberFormat('ar', {minimumFractionDigits:2, maximumFractionDigits:2});
  const integerFormat = new Intl.NumberFormat('ar');
  const entries = [];
  const rows = document.getElementById('quantity-rows');
  const total = document.getElementById('concrete-total');
  function render() {
    rows.replaceChildren();
    document.getElementById('empty-list').hidden = entries.length > 0;
    for (const [index, entry] of entries.entries()) {
      const row = document.createElement('tr');
      const type = concreteTypes[entry.typeIndex];
      const dimensions = type.fields.filter(([key])=>key !== 'count').map(([key,label])=>`${label}: ${format.format(entry.values[key])} م`).join(' × ');
      for (const text of [type.name, integerFormat.format(entry.values.count || 1), dimensions, format.format(entry.volume)]) {
        const cell = document.createElement('td'); cell.textContent = text; row.append(cell);
      }
      const cell = document.createElement('td');
      const button = document.createElement('button'); button.type='button'; button.className='delete-button'; button.textContent='حذف';
      button.setAttribute('aria-label', `حذف ${type.name}، البند ${index+1}`);
      button.addEventListener('click',()=>{entries.splice(index,1); render();});
      cell.append(button); row.append(cell); rows.append(row);
    }
    total.textContent = format.format(entries.reduce((sum,entry)=>sum+entry.volume,0));
  }
  concreteTypes.forEach((type,typeIndex)=>{
    const section = document.createElement('section'); section.className='panel concrete-form';
    const heading = document.createElement('h2'); heading.textContent=type.name; section.append(heading);
    const formula = document.createElement('p'); formula.className='muted'; formula.textContent=type.fields.map(([,label])=>label).join(' × '); section.append(formula);
    const form = document.createElement('form'); form.noValidate=true;
    const fields = document.createElement('div'); fields.className='fields';
    for (const [key,title] of type.fields) {
      const label = document.createElement('label'); label.append(title);
      const input = document.createElement('input'); input.type='number'; input.name=key; input.min=key==='count'?'1':'0'; input.step=key==='count'?'1':'any'; input.required=true; input.inputMode=key==='count'?'numeric':'decimal';
      if (key==='count') input.value='1';
      const unit = document.createElement('span'); unit.textContent=key==='count'?'عنصر':'متر';
      label.append(input,unit); fields.append(label);
    }
    const error = document.createElement('p'); error.className='concrete-error'; error.setAttribute('role','alert'); error.hidden=true;
    const button = document.createElement('button'); button.type='submit'; button.textContent='إضافة للحصر';
    form.append(fields,error,button);
    form.addEventListener('submit',event=>{
      event.preventDefault();
      try {
        const values = Object.fromEntries(type.fields.map(([key])=>[key,form.elements.namedItem(key).valueAsNumber]));
        const volume = concreteVolume(typeIndex,values);
        if (!Number.isFinite(entries.reduce((sum,entry)=>sum+entry.volume,volume))) throw new Error('الإجمالي خارج النطاق المسموح للحساب.');
        entries.push({typeIndex,values,volume}); error.hidden=true; render();
      } catch (problem) {error.textContent=problem.message; error.hidden=false;}
    });
    section.append(form); document.getElementById('concrete-forms').append(section);
  });
  render();
}
if (typeof module !== 'undefined') module.exports={concreteTypes,concreteVolume};
