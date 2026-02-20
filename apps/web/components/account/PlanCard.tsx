import { Button } from "../ui/button";
import { Card, CardTitle } from "../ui/card";

export default function PlanCard() {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <CardTitle>Plan</CardTitle>
          <p className="text-sm text-[var(--gather-muted)]">Starter - $79/month</p>
        </div>
        <Button size="sm" variant="outline" disabled>
          Manage subscription (Coming soon)
        </Button>
      </div>
      <p className="mt-4 text-sm text-[var(--gather-muted)]">Your subscription tools will appear here.</p>
    </Card>
  );
}
