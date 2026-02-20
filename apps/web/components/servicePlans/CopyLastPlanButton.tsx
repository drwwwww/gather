import { Button } from "../ui/button";

export default function CopyLastPlanButton({
  disabled,
  onCopy
}: {
  disabled?: boolean;
  onCopy: () => void;
}) {
  return (
    <Button variant="outline" size="sm" onClick={onCopy} disabled={disabled}>
      Copy last plan
    </Button>
  );
}
