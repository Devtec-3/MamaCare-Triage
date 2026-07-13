import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { patientsTable } from "./patients";

export const visitsTable = pgTable("visits", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id")
    .notNull()
    .references(() => patientsTable.id, { onDelete: "cascade" }),
  symptoms: text("symptoms").notNull(),
  photoBase64: text("photo_base64"),
  urgency: text("urgency").notNull().default("routine"),
  conditions: text("conditions").notNull().default(""),
  recommendation: text("recommendation").notNull().default(""),
  dosage: text("dosage"),
  dangerSignDetected: boolean("danger_sign_detected").notNull().default(false),
  referralRequired: boolean("referral_required").notNull().default(false),
  guidanceEnglish: text("guidance_english").notNull().default(""),
  guidanceYoruba: text("guidance_yoruba").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVisitSchema = createInsertSchema(visitsTable).omit({
  id: true,
  createdAt: true,
});

export type Visit = typeof visitsTable.$inferSelect;
export type InsertVisit = z.infer<typeof insertVisitSchema>;
