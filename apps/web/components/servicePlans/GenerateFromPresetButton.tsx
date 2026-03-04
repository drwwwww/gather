import { useState } from "react";

export default function GenerateFromPresetButton({
  disabled,
  hasPlan,
  onGenerate
}: {
  disabled?: boolean;
  hasPlan: boolean;
  onGenerate: () => void;
}) {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (!hasPlan) {
      onGenerate();
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button className="btn btn-primary btn-sm" onClick={handleClick} disabled={disabled}>
        Generate from preset
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="modal-box w-full max-w-md">
            <h3 className="font-bold text-lg mb-2">Replace current plan steps?</h3>
            <p className="mb-4">This will replace the current steps with the selected preset.</p>
            <div className="modal-action flex gap-2 justify-end">
              <button className="btn btn-outline" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setOpen(false);
                  onGenerate();
                }}
              >
                Replace steps
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
