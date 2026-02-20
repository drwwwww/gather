"use client";

import { Button } from "../ui/button";

const presetRoles = ["Greeter", "Usher", "Sound Team"];

type QuickRolePresetsProps = {
  onAddRole: (name: string) => void;
};

export default function QuickRolePresets({ onAddRole }: QuickRolePresetsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {presetRoles.map((role) => (
        <Button key={role} size="sm" variant="outline" onClick={() => onAddRole(role)}>
          Add {role}
        </Button>
      ))}
    </div>
  );
}
