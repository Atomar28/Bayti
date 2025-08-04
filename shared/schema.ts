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
  company: text("company"),
  phoneNumber: text("phone_number").notNull(),
  email: text("email"),
  budget: text("budget"),
  interestLevel: integer("interest_level").default(0), // 0-100
  status: text("status").default("cold"), // 'hot', 'warm', 'cold'
  industry: text("industry"),
  companySize: text("company_size"),
  lastContactDate: timestamp("last_contact_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  notes: text("notes"),
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
  agentId: varchar("agent_id").references(() => users.id),
  agentName: text("agent_name").default("DARI Assistant"),
  voiceType: text("voice_type").default("Professional Female"),
  speakingSpeed: text("speaking_speed").default("1.0"),
  callTimeout: integer("call_timeout").default(30),
  targetIndustries: jsonb("target_industries").$type<string[]>(),
  companySizes: jsonb("company_sizes").$type<string[]>(),
  minBudget: integer("min_budget"),
  maxBudget: integer("max_budget"),
  region: text("region").default("North America"),
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
