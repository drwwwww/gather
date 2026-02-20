import { Button } from "../ui/button";
import { CardTitle } from "../ui/card";
import { Input } from "../ui/input";

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
      <CardTitle>New preset</CardTitle>
      <div className="mt-2 flex flex-wrap gap-2">
        <Input
          placeholder="Main Service Run of Show"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
        />
        <Button onClick={onCreate} disabled={disabled || !name.trim()}>
          Create preset
        </Button>
      </div>
    </div>
  );
}
