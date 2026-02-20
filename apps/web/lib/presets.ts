export type PresetTemplateStep = {
  title: string;
  durationMinutes?: number;
  ownerRole?: string;
  notes?: string;
};

export type PresetTemplate = {
  id: string;
  name: string;
  description: string;
  steps: PresetTemplateStep[];
};

export const presetTemplates: PresetTemplate[] = [
  {
    id: "traditional",
    name: "Traditional Service",
    description: "Classic run of show with hymns and sermon.",
    steps: [
      { title: "Welcome", durationMinutes: 5 },
      { title: "Opening Prayer", durationMinutes: 3 },
      { title: "Hymn", durationMinutes: 8 },
      { title: "Scripture Reading", durationMinutes: 5 },
      { title: "Sermon", durationMinutes: 30 },
      { title: "Communion", durationMinutes: 8 },
      { title: "Closing Prayer", durationMinutes: 4 }
    ]
  },
  {
    id: "contemporary",
    name: "Contemporary Service",
    description: "Worship-forward flow with announcements and teaching.",
    steps: [
      { title: "Welcome", durationMinutes: 3 },
      { title: "Worship Set", durationMinutes: 20 },
      { title: "Announcements", durationMinutes: 5 },
      { title: "Prayer", durationMinutes: 4 },
      { title: "Message", durationMinutes: 28 },
      { title: "Response Song", durationMinutes: 6 },
      { title: "Benediction", durationMinutes: 2 }
    ]
  },
  {
    id: "youth",
    name: "Youth Service",
    description: "High-energy flow with teaching and discussion.",
    steps: [
      { title: "Welcome + Icebreaker", durationMinutes: 8 },
      { title: "Worship", durationMinutes: 15 },
      { title: "Message", durationMinutes: 20 },
      { title: "Small Groups", durationMinutes: 20 },
      { title: "Closing Prayer", durationMinutes: 4 }
    ]
  }
];
