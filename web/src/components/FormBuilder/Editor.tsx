import { useState } from 'react';

export default function FormEditor({ onSave }: { onSave: (schema:any)=>void }) {
  const [name, setName] = useState('');
  const [fields, setFields] = useState<{label:string,type:string}[]>([]);

  function addField() {
    setFields([...fields, {label:'', type:'text'}]);
  }

  function updateField(i:number, key:string, value:string) {
    const copy = [...fields];
    (copy[i] as any)[key]=value;
    setFields(copy);
  }

  function save() {
    const schema = { name, fields };
    onSave(schema);
  }

  return (
    <div style={{padding:16}}>
      <h3>Create Form</h3>
      <input placeholder="Form name" value={name} onChange={e=>setName(e.target.value)} />
      <div>
        {fields.map((f,i)=>(
          <div key={i}>
            <input placeholder="label" value={f.label} onChange={e=>updateField(i,'label',e.target.value)} />
            <select value={f.type} onChange={e=>updateField(i,'type',e.target.value)}>
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
            </select>
          </div>
        ))}
      </div>
      <button onClick={addField}>Add field</button>
      <button onClick={save}>Save Form</button>
    </div>
  );
}

