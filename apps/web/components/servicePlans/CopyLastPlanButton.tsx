
export default function CopyLastPlanButton({
  disabled,
  onCopy
}: {
  disabled?: boolean;
  onCopy: () => void;
}) {
  return (
    <button className="btn btn-outline btn-sm" onClick={onCopy} disabled={disabled}>
      Copy last plan
    </button>
  );
}
