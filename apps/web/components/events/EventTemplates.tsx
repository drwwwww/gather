"use client";

import { Button } from "../ui/button";

export type EventTemplate = {
  title: string;
  description: string;
  location: string;
};

const templates: EventTemplate[] = [
  {
    title: "Sunday Potluck",
    description: "Bring your favorite dish and join us after service for fellowship.",
    location: "Fellowship Hall"
  },
  {
    title: "Youth Night",
    description: "An evening of worship, games, and teaching for middle and high schoolers.",
    location: "Youth Center"
  },
  {
    title: "Prayer Meeting",
    description: "Join us as we gather to pray together for our church and community.",
    location: "Sanctuary"
  }
];

type EventTemplatesProps = {
  onSelect: (template: EventTemplate) => void;
};

export default function EventTemplates({ onSelect }: EventTemplatesProps) {
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
