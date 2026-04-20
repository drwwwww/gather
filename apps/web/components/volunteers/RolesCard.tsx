"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "../ui/button";

export type RoleItem = {
  id: string;
  name: string;
  ministryName?: string | null;
  description?: string | null;
};

type RolesCardProps = {
  roles: RoleItem[];
  newRoleName: string;
  newRoleMinistry: string;
  newRoleDescription: string;
  editingRoleId: string | null;
  editRoleName: string;
  editRoleMinistry: string;
  editRoleDescription: string;
  onNewRoleNameChange: (v: string) => void;
  onNewRoleMinistryChange: (v: string) => void;
  onNewRoleDescriptionChange: (v: string) => void;
  onAddRole: () => void;
  onEditRole: (role: RoleItem) => void;
  onEditRoleNameChange: (v: string) => void;
  onEditRoleMinistryChange: (v: string) => void;
  onEditRoleDescriptionChange: (v: string) => void;
  onSaveRole: () => void;
  onCancelEdit: () => void;
  onDeleteRole: (roleId: string) => void;
};

export default function RolesCard({
  roles,
  newRoleName,
  newRoleMinistry,
  newRoleDescription,
  editingRoleId,
  editRoleName,
  editRoleMinistry,
  editRoleDescription,
  onNewRoleNameChange,
  onNewRoleMinistryChange,
  onNewRoleDescriptionChange,
  onAddRole,
  onEditRole,
  onEditRoleNameChange,
  onEditRoleMinistryChange,
  onEditRoleDescriptionChange,
  onSaveRole,
  onCancelEdit,
  onDeleteRole
}: RolesCardProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleAdd = () => {
    onAddRole();
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      onDeleteRole(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
    }
  };

  return (
    <div className="card shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="card-title text-base">Roles</span>
        {!showAdd && (
          <Button variant="secondary" size="sm" onClick={() => setShowAdd(true)}>
            + Add role
          </Button>
        )}
      </div>

      {/* Add new role form */}
      {showAdd && (
        <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>New role</p>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              className="input input-bordered input-sm w-full"
              placeholder="Role name (e.g. Usher)"
              value={newRoleName}
              onChange={(e) => onNewRoleNameChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              autoFocus
            />
            <input
              type="text"
              className="input input-bordered input-sm w-full"
              placeholder="Ministry (optional)"
              value={newRoleMinistry}
              onChange={(e) => onNewRoleMinistryChange(e.target.value)}
            />
            <input
              type="text"
              className="input input-bordered input-sm w-full"
              placeholder="Description (optional)"
              value={newRoleDescription}
              onChange={(e) => onNewRoleDescriptionChange(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={handleAdd} disabled={!newRoleName.trim()}>
              Save
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Role list */}
      {roles.length === 0 ? (
        <p className="text-sm text-center py-4" style={{ color: "var(--text-muted)" }}>
          No roles yet. Add one to start scheduling.
        </p>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {roles.map((role) => (
            <div key={role.id} className="py-3 first:pt-0 last:pb-0">
              {editingRoleId === role.id ? (
                /* Inline edit form */
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full"
                    value={editRoleName}
                    onChange={(e) => onEditRoleNameChange(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onSaveRole()}
                    autoFocus
                  />
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full"
                    placeholder="Ministry (optional)"
                    value={editRoleMinistry}
                    onChange={(e) => onEditRoleMinistryChange(e.target.value)}
                  />
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full"
                    placeholder="Description (optional)"
                    value={editRoleDescription}
                    onChange={(e) => onEditRoleDescriptionChange(e.target.value)}
                  />
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost gap-1"
                      style={{ color: "var(--success)" }}
                      onClick={onSaveRole}
                    >
                      <Check className="h-3.5 w-3.5" /> Save
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost gap-1"
                      style={{ color: "var(--text-muted)" }}
                      onClick={onCancelEdit}
                    >
                      <X className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* Role display row */
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                      {role.name}
                    </p>
                    {role.ministryName && (
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                        {role.ministryName}
                      </p>
                    )}
                    {role.description && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                        {role.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs"
                      onClick={() => onEditRole(role)}
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${confirmDeleteId === role.id ? "btn-error" : "btn-ghost"}`}
                      onClick={() => handleDelete(role.id)}
                      title={confirmDeleteId === role.id ? "Click again to confirm" : "Delete"}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {confirmDeleteId === role.id && (
                        <span className="ml-1 text-xs">Confirm?</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
