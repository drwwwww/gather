import { z } from "zod";

export const churchCreateSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/)
});

export const churchOnboardingSchema = z
  .object({
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    timezone: z.string().min(2),
    serviceDayChoice: z.enum(["SATURDAY", "SUNDAY", "BOTH", "CUSTOM"]),
    customDays: z.array(z.number().int().min(0).max(6)).optional(),
    serviceTime: z.string().min(3)
  })
  .refine(
    (value) => (value.serviceDayChoice === "CUSTOM" ? (value.customDays?.length ?? 0) > 0 : true),
    { message: "Select at least one weekday.", path: ["customDays"] }
  );

export const announcementCreateSchema = z.object({
  title: z.string().min(2),
  body: z.string().min(2),
  audience: z.enum(["ALL", "MEMBER", "SERVICE", "ADMIN", "MINISTRY"]),
  ministry_id: z.string().uuid().nullable().optional(),
  publish_at: z.string().datetime().nullable().optional()
});

export const eventCreateSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  location: z.string().optional(),
  start_at: z.string().datetime(),
  end_at: z.string().datetime().optional(),
  audience: z.enum(["ALL", "MEMBER", "SERVICE", "ADMIN", "MINISTRY"]),
  ministry_id: z.string().uuid().nullable().optional()
});

export const scheduleGeneratorSchema = z.object({
  service_time_id: z.string().uuid(),
  role_ids: z.array(z.string().uuid()).min(1),
  start_date: z.string().date(),
  end_date: z.string().date()
});

export const servicePresetSchema = z.object({
  name: z.string().min(2),
  service_time_id: z.string().uuid(),
  is_default: z.boolean().optional()
});

export const servicePresetItemSchema = z.object({
  title: z.string().min(2),
  duration_minutes: z.number().int().min(0).optional().nullable(),
  notes: z.string().optional(),
  owner_role_id: z.string().uuid().optional().nullable()
});

export const servicePlanSchema = z.object({
  service_time_id: z.string().uuid(),
  service_date: z.string().date(),
  preset_id: z.string().uuid().optional().nullable(),
  title: z.string().optional()
});

export const servicePlanItemSchema = z.object({
  title: z.string().min(2),
  duration_minutes: z.number().int().min(0).optional().nullable(),
  notes: z.string().optional(),
  owner_role_id: z.string().uuid().optional().nullable(),
  status: z.enum(["PLANNED", "DONE", "SKIPPED"]).optional()
});
