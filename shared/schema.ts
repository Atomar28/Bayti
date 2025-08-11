import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email"),
  role: text("role").default("agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const callLogs = pgTable("call_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number").notNull(),
  duration: integer("duration"), // in seconds
  status: text("status").notNull(), // 'completed', 'qualified', 'no_answer', 'busy', 'follow_up'
  recordingUrl: text("recording_url"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  leadId: varchar("lead_id").references(() => leads.id),
  agentId: varchar("agent_id").references(() => users.id),
  script: text("script"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  status: text("status").default("new"), // 'new', 'contacted', 'qualified', 'converted', 'not_interested'
  source: text("source").default("manual"), // 'upload', 'manual', 'api'
  notes: text("notes"),
  lastContacted: timestamp("last_contacted"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const callScripts = pgTable("call_scripts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  industry: text("industry"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const agentSettings = pgTable("agent_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull(),
  agentName: text("agent_name").default("Bayti Assistant"),
  voiceType: text("voice_type").default("Professional Female"),
  elevenLabsVoiceId: text("eleven_labs_voice_id").default("EXAVITQu4vr4xnSDxMaL"), // Default voice ID
  elevenLabsModelId: text("eleven_labs_model_id").default("eleven_flash_v2_5"),
  voiceSettings: jsonb("voice_settings").$type<{stability: number, similarityBoost: number, style?: number, speakerBoost?: boolean}>(),
  speakingSpeed: text("speaking_speed").default("1.0"),
  callTimeout: integer("call_timeout").default(30),
  targetIndustries: jsonb("target_industries").$type<string[]>(),
  companySizes: jsonb("company_sizes").$type<string[]>(),
  minBudget: integer("min_budget"),
  maxBudget: integer("max_budget"),
  region: text("region").default("North America"),
  workingHours: jsonb("working_hours").$type<{start: string, end: string, days: string[]}>(),
  bufferTime: integer("buffer_time").default(15), // minutes between appointments
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const appointments = pgTable("appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").references(() => leads.id),
  agentId: varchar("agent_id").references(() => users.id),
  callLogId: varchar("call_log_id").references(() => callLogs.id),
  title: text("title").notNull(),
  description: text("description"),
  scheduledTime: timestamp("scheduled_time").notNull(),
  duration: integer("duration").default(30), // minutes
  status: text("status").default("scheduled"), // 'scheduled', 'completed', 'cancelled', 'no_show'
  appointmentType: text("appointment_type").default("property_viewing"), // 'property_viewing', 'consultation', 'callback'
  googleEventId: text("google_event_id"),
  meetingLink: text("meeting_link"),
  location: text("location"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projectScripts = pgTable("project_scripts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull(),
  projectName: text("project_name").notNull(),
  agentId: varchar("agent_id"),
  scriptContent: text("script_content").notNull(),
  placeholders: jsonb("placeholders").$type<{[key: string]: string}>(),
  isActive: boolean("is_active").default(false), // Default to inactive
  industry: text("industry").default("real_estate"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  callLogs: many(callLogs),
  settings: many(agentSettings),
}));

export const callLogsRelations = relations(callLogs, ({ one }) => ({
  lead: one(leads, {
    fields: [callLogs.leadId],
    references: [leads.id],
  }),
  agent: one(users, {
    fields: [callLogs.agentId],
    references: [users.id],
  }),
}));

export const leadsRelations = relations(leads, ({ many }) => ({
  callLogs: many(callLogs),
}));

export const agentSettingsRelations = relations(agentSettings, ({ one }) => ({
  agent: one(users, {
    fields: [agentSettings.agentId],
    references: [users.id],
  }),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  lead: one(leads, {
    fields: [appointments.leadId],
    references: [leads.id],
  }),
  agent: one(users, {
    fields: [appointments.agentId],
    references: [users.id],
  }),
  callLog: one(callLogs, {
    fields: [appointments.callLogId],
    references: [callLogs.id],
  }),
}));

export const projectScriptsRelations = relations(projectScripts, ({ one }) => ({
  agent: one(users, {
    fields: [projectScripts.agentId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCallLogSchema = createInsertSchema(callLogs).omit({
  id: true,
  createdAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCallScriptSchema = createInsertSchema(callScripts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentSettingsSchema = createInsertSchema(agentSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectScriptSchema = createInsertSchema(projectScripts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type CallLog = typeof callLogs.$inferSelect;
export type InsertCallLog = z.infer<typeof insertCallLogSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type CallScript = typeof callScripts.$inferSelect;
export type InsertCallScript = z.infer<typeof insertCallScriptSchema>;

export type AgentSettings = typeof agentSettings.$inferSelect;
export type InsertAgentSettings = z.infer<typeof insertAgentSettingsSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type ProjectScript = typeof projectScripts.$inferSelect;
export type InsertProjectScript = z.infer<typeof insertProjectScriptSchema>;

// Auto-Dial Campaign Tables
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  status: text("status").default("DRAFT"), // 'DRAFT', 'RUNNING', 'PAUSED', 'STOPPED', 'DONE'
  pacingMaxConcurrent: integer("pacing_max_concurrent").default(2),
  interCallMs: integer("inter_call_ms").default(1500),
  timezone: text("timezone").default("Asia/Dubai"),
  businessHours: jsonb("business_hours").$type<{start: string, end: string, days: number[]}>().default(sql`'{"start":"09:30","end":"19:30","days":[1,2,3,4,5,6]}'`), // Sun=0
  scriptId: varchar("script_id").references(() => callScripts.id),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

export const campaignLeads = pgTable("campaign_leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  campaignId: varchar("campaign_id").notNull().references(() => campaigns.id, { onDelete: 'cascade' }),
  fullName: text("full_name"),
  phoneE164: text("phone_e164").notNull(),
  email: text("email"),
  notes: text("notes"),
  custom: jsonb("custom"),
  status: text("status").default("PENDING"), // 'PENDING', 'DIALING', 'CONNECTED', 'COMPLETED', 'FAILED', 'RETRY', 'DO_NOT_CALL'
  attempts: integer("attempts").default(0),
  lastError: text("last_error"),
  lastCallSid: text("last_call_sid"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const campaignCallLogs = pgTable("campaign_call_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  leadId: varchar("lead_id").notNull().references(() => campaignLeads.id, { onDelete: 'cascade' }),
  callSid: text("call_sid"),
  status: text("status"),
  durationSec: integer("duration_sec"),
  recordingUrl: text("recording_url"),
  transcript: text("transcript"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const suppressions = pgTable("suppressions", {
  phoneE164: text("phone_e164").primaryKey(),
  reason: text("reason"),
  addedAt: timestamp("added_at").defaultNow(),
});

// Relations for campaigns
export const campaignRelations = relations(campaigns, ({ many, one }) => ({
  leads: many(campaignLeads),
  script: one(callScripts, {
    fields: [campaigns.scriptId],
    references: [callScripts.id]
  }),
  createdByUser: one(users, {
    fields: [campaigns.createdBy],
    references: [users.id]
  }),
}));

export const campaignLeadRelations = relations(campaignLeads, ({ one, many }) => ({
  campaign: one(campaigns, {
    fields: [campaignLeads.campaignId],
    references: [campaigns.id]
  }),
  callLogs: many(campaignCallLogs),
}));

export const campaignCallLogRelations = relations(campaignCallLogs, ({ one }) => ({
  lead: one(campaignLeads, {
    fields: [campaignCallLogs.leadId],
    references: [campaignLeads.id]
  }),
}));

// Insert schemas for campaigns
export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
});

export const insertCampaignLeadSchema = createInsertSchema(campaignLeads).omit({
  id: true,
  updatedAt: true,
});

export const insertCampaignCallLogSchema = createInsertSchema(campaignCallLogs).omit({
  id: true,
  createdAt: true,
});

export const insertSuppressionSchema = createInsertSchema(suppressions);

// Types for campaigns
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type CampaignLead = typeof campaignLeads.$inferSelect;
export type InsertCampaignLead = z.infer<typeof insertCampaignLeadSchema>;

export type CampaignCallLog = typeof campaignCallLogs.$inferSelect;
export type InsertCampaignCallLog = z.infer<typeof insertCampaignCallLogSchema>;

export type Suppression = typeof suppressions.$inferSelect;
export type InsertSuppression = z.infer<typeof insertSuppressionSchema>;
