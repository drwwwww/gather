import { Button } from "../ui/button";
import { Card, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";

export default function ProfileCard({
  name,
  email,
  roleLabel,
  onNameChange,
  onSave,
  saveDisabled
}: {
  name: string;
  email: string;
  roleLabel: string;
  onNameChange: (value: string) => void;
  onSave: () => void;
  saveDisabled: boolean;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <CardTitle>My Profile</CardTitle>
          <p className="text-sm text-[var(--gather-muted)]">Update your name and view your role.</p>
        </div>
        <Button size="sm" onClick={onSave} disabled={saveDisabled}>
          Save
        </Button>
      </div>
      <div className="mt-4 grid gap-3">
        <div className="grid gap-1">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gather-muted)]">Name</p>
          <Input
            placeholder="Full name"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </div>
        <div className="grid gap-1">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gather-muted)]">Email</p>
          <Input
            placeholder="Email"
            type="email"
            value={email}
            readOnly
            className="bg-base-200/60 text-[var(--gather-muted)]"
          />
        </div>
      </div>
      <div className="mt-4 grid gap-2 text-sm text-[var(--gather-muted)]">
        <Badge className="w-fit">Role: {roleLabel}</Badge>
        <p>Your role determines what you can manage in this church.</p>
      </div>
    </Card>
  );
}
