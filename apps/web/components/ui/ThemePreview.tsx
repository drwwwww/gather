import React from "react";
import { Button } from "./button";

export default function ThemePreview() {
  return (
    <div className="space-y-8 p-8" style={{ background: 'var(--gather-bg)' }}>
      <div
        className="card rounded-xl shadow p-6 border"
        style={{ background: 'var(--gather-surface)', borderColor: 'var(--gather-border)', color: 'var(--gather-ink)' }}
      >
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--gather-ink)' }}>Theme Preview</h2>
        <p className="mb-4" style={{ color: 'var(--gather-muted)' }}>This shows the new Gather Admin theme tokens in action.</p>
        <div className="flex gap-4 mb-4">
          <Button variant="primary">Primary Button</Button>
          <Button className="btn-gray">Secondary Button</Button>
        </div>
        <input
          className="input mb-4"
          style={{ background: 'var(--gather-surface)', color: 'var(--gather-ink)' }}
          placeholder="Input example"
        />
        <div className="flex gap-2 mb-4">
          <span className="badge badge-success">Success</span>
          <span className="badge badge-warning">Warning</span>
          <span className="badge badge-danger">Danger</span>
          <span className="badge badge-info">Info</span>
        </div>
        <table className="w-full mt-4">
          <thead>
            <tr className="table-header">
              <th className="p-2 text-left">Header</th>
              <th className="p-2 text-left">Header</th>
            </tr>
          </thead>
          <tbody>
            <tr className="table-row">
              <td className="p-2">Row 1</td>
              <td className="p-2">Row 1</td>
            </tr>
            <tr>
              <td className="p-2">Row 2</td>
              <td className="p-2">Row 2</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
