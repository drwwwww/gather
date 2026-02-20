import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";

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
      <Button size="sm" onClick={handleClick} disabled={disabled}>
        Generate from preset
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace current plan steps?</DialogTitle>
            <DialogDescription>
              This will replace the current steps with the selected preset.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setOpen(false);
                onGenerate();
              }}
            >
              Replace steps
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
