"use client";

// DaisyUI migration: use className markup for all UI

const presetRoles = ["Greeter", "Usher", "Sound Team"];

type QuickRolePresetsProps = {
  onAddRole: (name: string) => void;
};

export default function QuickRolePresets({ onAddRole }: QuickRolePresetsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.isArray(presetRoles) && presetRoles.map((role) => (
        <button key={role} className="btn btn-sm btn-outline" onClick={() => onAddRole(role)}>
          Add {role}
        </button>
      ))}
    </div>
  );
}
