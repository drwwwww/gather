"use client";

import EventTemplates, { type EventTemplate } from "./EventTemplates";

export type EventFormValues = {
  title: string;
  description: string;
  location: string;
  audience: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
};

type EventFormProps = {
  values: EventFormValues;
  timezoneLabel: string;
  isEditing: boolean;
  onChange: (patch: Partial<EventFormValues>) => void;
  onSubmit: () => void;
  onCancelEdit: () => void;
  onTemplateSelect: (template: EventTemplate) => void;
  error?: string | null;
};

export default function EventForm({
  values,
  timezoneLabel,
  isEditing,
  onChange,
  onSubmit,
  onCancelEdit,
  onTemplateSelect,
  error
}: EventFormProps) {
  const canSubmit = Boolean(values.title.trim()) && Boolean(values.startDate) && (values.allDay || Boolean(values.startTime));

  return (
    <div className="card shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="card-title">{isEditing ? "Edit Event" : "Create Event"}</div>
        <span className="text-xs text-[var(--gather-muted)]">Keep it simple</span>
      </div>
      <div className="mt-4 space-y-4">
        <input
          type="text"
          placeholder="Event title"
          value={values.title}
          onChange={(event) => onChange({ title: event.target.value })}
          className="input input-bordered w-full"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs text-[var(--gather-muted)]">Start date</label>
            <input type="date" value={values.startDate} onChange={(event) => onChange({ startDate: event.target.value })} className="input input-bordered w-full" />
          </div>
          {!values.allDay ? (
            <div className="space-y-2">
              <label className="text-xs text-[var(--gather-muted)]">Start time</label>
              <input type="time" value={values.startTime} onChange={(event) => onChange({ startTime: event.target.value })} className="input input-bordered w-full" />
            </div>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs text-[var(--gather-muted)]">End date</label>
            <input type="date" value={values.endDate} onChange={(event) => onChange({ endDate: event.target.value })} className="input input-bordered w-full" />
          </div>
          {!values.allDay ? (
            <div className="space-y-2">
              <label className="text-xs text-[var(--gather-muted)]">End time</label>
              <input type="time" value={values.endTime} onChange={(event) => onChange({ endTime: event.target.value })} className="input input-bordered w-full" />
            </div>
          ) : null}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="checkbox checkbox-sm"
            checked={values.allDay}
            onChange={(event) => onChange({ allDay: event.target.checked })}
          />
          All-day event
        </label>
        <input
          type="text"
          placeholder="Location"
          value={values.location}
          onChange={(event) => onChange({ location: event.target.value })}
          className="input input-bordered w-full"
        />
        <div className="space-y-2">
          <label className="text-xs text-[var(--text-muted)]">Description</label>
          <textarea
            className="textarea textarea-bordered min-h-[140px] w-full"
            placeholder="Add details for your event..."
            value={values.description}
            onChange={(event) => onChange({ description: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[var(--gather-muted)]">Audience</label>
          <select
            className="select select-bordered w-full"
            value={values.audience}
            onChange={(event) => onChange({ audience: event.target.value })}
          >
            <option value="ALL">ALL</option>
            <option value="MEMBER">MEMBER</option>
            <option value="SERVICE">SERVICE</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <p className="text-xs text-[var(--gather-muted)]">Events appear in the Gather member app under Events.</p>
        </div>
        <p className="text-xs text-[var(--gather-muted)]">Times shown in {timezoneLabel || "your local timezone"}.</p>
        {error ? <p className="text-sm text-error">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" onClick={onSubmit} disabled={!canSubmit}>Save Event</button>
          {isEditing ? (
            <button type="button" className="btn btn-outline" onClick={onCancelEdit}>Cancel</button>
          ) : null}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--gather-muted)]">Quick templates</p>
          <div className="mt-2">
            <EventTemplates onSelect={onTemplateSelect} />
          </div>
        </div>
      </div>
    </div>
  );
}
