// ...existing code...

// ...existing code...

export default function PresetCreateRow({
  name,
  onNameChange,
  onCreate,
  disabled
}: {
  name: string;
  onNameChange: (value: string) => void;
  onCreate: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex-1">
      <h2 className="card-title text-lg font-bold">New preset</h2>
      <div className="mt-2 flex flex-wrap gap-2">
           <input
             type="text"
             placeholder="Main Service Run of Show"
             value={name}
             onChange={(event) => onNameChange(event.target.value)}
             className="input input-bordered flex-1 min-w-[200px]"
           />
           <button
             type="button"
             onClick={onCreate}
             disabled={disabled || !name.trim()}
             className="btn btn-primary"
           >
             Create preset
           </button>
      </div>
    </div>
  );
}
