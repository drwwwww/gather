import { Button } from "../ui/button";
import { Card, CardTitle } from "../ui/card";

export default function SecurityCard({
  onChangePassword,
  onSignOut
}: {
  onChangePassword: () => void;
  onSignOut: () => void;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <CardTitle>Security</CardTitle>
          <p className="text-sm text-[var(--gather-muted)]">Manage your login settings.</p>
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={onChangePassword}>Change password</Button>
        <Button variant="outline" onClick={onSignOut}>
          Sign out
        </Button>
      </div>
    </Card>
  );
}
