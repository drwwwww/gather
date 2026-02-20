"use client";

import { Button } from "../ui/button";

export type AnnouncementTemplate = {
  title: string;
  body: string;
};

const templates: AnnouncementTemplate[] = [
  {
    title: "Welcome to Gather",
    body: "We are glad you are here! Stay tuned for updates and upcoming events."
  },
  {
    title: "Service reminder",
    body: "Reminder: Service starts this weekend at our regular time. We can't wait to see you!"
  },
  {
    title: "Volunteer needed",
    body: "We need a few extra hands this weekend. Reply if you can serve."
  }
];

type AnnouncementTemplatesProps = {
  onSelect: (template: AnnouncementTemplate) => void;
};

export default function AnnouncementTemplates({ onSelect }: AnnouncementTemplatesProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {templates.map((template) => (
        <Button key={template.title} size="sm" variant="outline" onClick={() => onSelect(template)}>
          {template.title}
        </Button>
      ))}
    </div>
  );
}
