
const quickInsertTitles = [
  "Welcome",
  "Worship",
  "Prayer",
  "Sermon",
  "Announcements",
  "Offering",
  "Closing"
];

export default function StepEditorToolbar({
  saving,
  lastSavedAt,
  onAddStep,
  onAddQuickStep
}: {
  saving?: boolean;
  lastSavedAt?: Date | null;
  onAddStep: () => void;
  onAddQuickStep: (title: string) => void;
}) {
  const savedLabel = lastSavedAt
    ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
    : "Saved";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={onAddStep}>
          Add step
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {quickInsertTitles.map((title) => (
            <Button key={title} size="sm" variant="outline" onClick={() => onAddQuickStep(title)}>
              {title}
            </Button>
          ))}
        </div>
      </div>
      <div className="text-xs text-[var(--gather-muted)]">
        {saving ? "Saving..." : savedLabel}
      </div>
    </div>
  );
}
