export default function FormRenderer({ schema, onSubmit }: { schema:any, onSubmit:(data:any)=>void }) {
  if (!schema) return null;
  const { fields } = schema;
  const handleSubmit = (e:any) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const obj:any = {};
    fields.forEach((f:any)=> obj[f.label]=form.get(f.label));
    onSubmit(obj);
  };
  return (
    <form onSubmit={handleSubmit}>
      {fields.map((f:any, i:number)=>(
        <div key={i}>
          <label>{f.label}</label>
          <input name={f.label} type={f.type} />
        </div>
      ))}
      <button type="submit">Submit</button>
    </form>
  );
}

