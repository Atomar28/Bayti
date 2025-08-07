import { 
  users, callLogs, leads, callScripts, agentSettings, appointments, projectScripts,
  type User, type InsertUser,
  type CallLog, type InsertCallLog,
  type Lead, type InsertLead,
  type CallScript, type InsertCallScript,
  type AgentSettings, type InsertAgentSettings,
  type Appointment, type InsertAppointment,
  type ProjectScript, type InsertProjectScript
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, like, or, count, gte, lt, isNotNull, gt } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Call Logs
  getCallLogs(page?: number, limit?: number, search?: string, status?: string): Promise<{ callLogs: CallLog[], total: number }>;
  getCallLog(id: string): Promise<CallLog | undefined>;
  createCallLog(callLog: InsertCallLog): Promise<CallLog>;
  updateCallLog(id: string, updates: Partial<InsertCallLog>): Promise<CallLog | undefined>;

  // Leads
  getLeads(page?: number, limit?: number): Promise<{ leads: Lead[], total: number }>;
  getLead(id: string): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead | undefined>;

  // Call Scripts
  getCallScripts(): Promise<CallScript[]>;
  getCallScript(id: string): Promise<CallScript | undefined>;
  createCallScript(script: InsertCallScript): Promise<CallScript>;
  updateCallScript(id: string, updates: Partial<InsertCallScript>): Promise<CallScript | undefined>;
  deleteCallScript(id: string): Promise<boolean>;

  // Agent Settings
  getAgentSettings(agentId: string): Promise<AgentSettings | undefined>;
  createOrUpdateAgentSettings(settings: InsertAgentSettings): Promise<AgentSettings>;

  // Appointments
  getAppointments(agentId?: string, status?: string): Promise<Appointment[]>;
  getAppointment(id: string): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  
  // Project Scripts
  getProjectScripts(agentId?: string): Promise<ProjectScript[]>;
  getProjectScript(id: string): Promise<ProjectScript | undefined>;
  getActiveProjectScript(): Promise<ProjectScript | undefined>;
  createProjectScript(script: InsertProjectScript): Promise<ProjectScript>;
  updateProjectScript(id: string, updates: Partial<InsertProjectScript>): Promise<ProjectScript | undefined>;
  deleteProjectScript(id: string): Promise<boolean>;
  setActiveProjectScript(scriptId: string): Promise<ProjectScript | undefined>;

  // Analytics
  getCallStats(): Promise<{
    totalCallsToday: number;
    qualifiedLeads: number;
    avgDuration: number;
    successRate: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getCallLogs(page = 1, limit = 10, search?: string, status?: string): Promise<{ callLogs: CallLog[], total: number }> {
    const offset = (page - 1) * limit;
    
    let whereConditions = undefined;
    
    if (search || status) {
      const conditions = [];
      if (search) {
        conditions.push(like(callLogs.phoneNumber, `%${search}%`));
      }
      if (status && status !== 'All Status') {
        conditions.push(eq(callLogs.status, status.toLowerCase()));
      }
      whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];
    }

    const [callLogsResult, totalResult] = await Promise.all([
      db.select()
        .from(callLogs)
        .where(whereConditions)
        .orderBy(desc(callLogs.startTime))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() })
        .from(callLogs)
        .where(whereConditions)
    ]);

    return {
      callLogs: callLogsResult,
      total: totalResult[0].count
    };
  }

  async getCallLog(id: string): Promise<CallLog | undefined> {
    const [callLog] = await db.select().from(callLogs).where(eq(callLogs.id, id));
    return callLog || undefined;
  }

  async createCallLog(insertCallLog: InsertCallLog): Promise<CallLog> {
    const [callLog] = await db
      .insert(callLogs)
      .values(insertCallLog)
      .returning();
    return callLog;
  }

  async updateCallLog(id: string, updates: Partial<InsertCallLog>): Promise<CallLog | undefined> {
    const [callLog] = await db
      .update(callLogs)
      .set(updates)
      .where(eq(callLogs.id, id))
      .returning();
    return callLog || undefined;
  }

  async getLeads(page = 1, limit = 20): Promise<{ leads: Lead[], total: number }> {
    const offset = (page - 1) * limit;
    
    const [leadsResult, totalResult] = await Promise.all([
      db.select()
        .from(leads)
        .orderBy(desc(leads.updatedAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() })
        .from(leads)
    ]);

    return {
      leads: leadsResult,
      total: totalResult[0].count
    };
  }

  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await db
      .insert(leads)
      .values(insertLead)
      .returning();
    return lead;
  }

  async updateLead(id: string, updates: Partial<InsertLead>): Promise<Lead | undefined> {
    const [lead] = await db
      .update(leads)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return lead || undefined;
  }

  async getCallScripts(): Promise<CallScript[]> {
    return await db.select().from(callScripts).where(eq(callScripts.isActive, true));
  }

  async getCallScript(id: string): Promise<CallScript | undefined> {
    const [script] = await db.select().from(callScripts).where(eq(callScripts.id, id));
    return script || undefined;
  }

  async createCallScript(insertScript: InsertCallScript): Promise<CallScript> {
    const [script] = await db
      .insert(callScripts)
      .values(insertScript)
      .returning();
    return script;
  }

  async updateCallScript(id: string, updates: Partial<InsertCallScript>): Promise<CallScript | undefined> {
    const [script] = await db
      .update(callScripts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(callScripts.id, id))
      .returning();
    return script || undefined;
  }

  async deleteCallScript(id: string): Promise<boolean> {
    const result = await db
      .update(callScripts)
      .set({ isActive: false })
      .where(eq(callScripts.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAgentSettings(agentId: string): Promise<AgentSettings | undefined> {
    const [settings] = await db.select().from(agentSettings).where(eq(agentSettings.agentId, agentId));
    return settings || undefined;
  }

  async createOrUpdateAgentSettings(insertSettings: InsertAgentSettings): Promise<AgentSettings> {
    const existingSettings = await this.getAgentSettings(insertSettings.agentId!);
    
    if (existingSettings) {
      const [settings] = await db
        .update(agentSettings)
        .set({ ...insertSettings, updatedAt: new Date() })
        .where(eq(agentSettings.agentId, insertSettings.agentId!))
        .returning();
      return settings;
    } else {
      const [settings] = await db
        .insert(agentSettings)
        .values(insertSettings)
        .returning();
      return settings;
    }
  }

  async getAppointments(agentId?: string, status?: string): Promise<Appointment[]> {
    let whereConditions = undefined;
    
    if (agentId || status) {
      const conditions = [];
      if (agentId) {
        conditions.push(eq(appointments.agentId, agentId));
      }
      if (status) {
        conditions.push(eq(appointments.status, status));
      }
      whereConditions = conditions.length > 1 ? and(...conditions) : conditions[0];
    }

    return await db.select()
      .from(appointments)
      .where(whereConditions)
      .orderBy(desc(appointments.scheduledTime));
  }

  async getAppointment(id: string): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment || undefined;
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values(insertAppointment)
      .returning();
    return appointment;
  }

  async updateAppointment(id: string, updates: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [appointment] = await db
      .update(appointments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return appointment || undefined;
  }

  async getProjectScripts(agentId?: string): Promise<ProjectScript[]> {
    if (agentId) {
      return await db.select()
        .from(projectScripts)
        .where(eq(projectScripts.agentId, agentId))
        .orderBy(desc(projectScripts.updatedAt));
    }
    
    return await db.select()
      .from(projectScripts)
      .orderBy(desc(projectScripts.updatedAt));
  }

  async getActiveProjectScript(): Promise<ProjectScript | undefined> {
    const [script] = await db.select()
      .from(projectScripts)
      .where(eq(projectScripts.isActive, true))
      .limit(1);
    return script || undefined;
  }

  async setActiveProjectScript(scriptId: string): Promise<ProjectScript | undefined> {
    // First, deactivate all scripts
    await db.update(projectScripts)
      .set({ isActive: false, updatedAt: new Date() });
    
    // Then activate the specified script
    const [script] = await db.update(projectScripts)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(projectScripts.id, scriptId))
      .returning();
    
    return script || undefined;
  }

  async getProjectScript(id: string): Promise<ProjectScript | undefined> {
    const [script] = await db.select()
      .from(projectScripts)
      .where(eq(projectScripts.id, id));
    return script || undefined;
  }

  async createProjectScript(insertScript: InsertProjectScript): Promise<ProjectScript> {
    const [script] = await db
      .insert(projectScripts)
      .values(insertScript)
      .returning();
    return script;
  }

  async updateProjectScript(id: string, updates: Partial<InsertProjectScript>): Promise<ProjectScript | undefined> {
    const [script] = await db
      .update(projectScripts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projectScripts.id, id))
      .returning();
    return script || undefined;
  }

  async deleteProjectScript(id: string): Promise<boolean> {
    const result = await db
      .delete(projectScripts)
      .where(eq(projectScripts.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getCallStats(): Promise<{
    totalCallsToday: number;
    qualifiedLeads: number;
    avgDuration: number;
    successRate: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get total calls made today (if none today, show total calls this week)
    const [todayCallsResult] = await db
      .select({ count: count() })
      .from(callLogs)
      .where(and(
        gte(callLogs.startTime, today),
        lt(callLogs.startTime, tomorrow)
      ));

    // If no calls today, get this week's calls
    let totalCallsToday = todayCallsResult.count;
    if (totalCallsToday === 0) {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const [weekCallsResult] = await db
        .select({ count: count() })
        .from(callLogs)
        .where(gte(callLogs.startTime, weekAgo));
      
      totalCallsToday = weekCallsResult.count;
    }

    // Get qualified leads (all time)
    const [qualifiedResult] = await db
      .select({ count: count() })
      .from(callLogs)
      .where(eq(callLogs.status, 'qualified'));

    // Get average call duration from actual calls with duration data
    const callsWithDuration = await db
      .select({ duration: callLogs.duration })
      .from(callLogs)
      .where(and(
        isNotNull(callLogs.duration),
        gt(callLogs.duration, 0)
      ));

    let avgDuration = 0;
    if (callsWithDuration.length > 0) {
      const totalDuration = callsWithDuration.reduce((sum, call) => sum + (call.duration || 0), 0);
      avgDuration = Math.round(totalDuration / callsWithDuration.length);
    }

    // Calculate real success rate (qualified + completed vs total calls)
    const [allCallsResult] = await db
      .select({ count: count() })
      .from(callLogs);

    const [successfulCallsResult] = await db
      .select({ count: count() })
      .from(callLogs)
      .where(or(
        eq(callLogs.status, 'qualified'),
        eq(callLogs.status, 'completed')
      ));

    const successRate = allCallsResult.count > 0 
      ? Math.round((successfulCallsResult.count / allCallsResult.count) * 100 * 10) / 10
      : 0;

    console.log('Call Stats Debug:', {
      todayCallsCount: todayCallsResult.count,
      qualifiedCount: qualifiedResult.count,
      avgDuration,
      successRate,
      allCallsCount: allCallsResult.count,
      successfulCallsCount: successfulCallsResult.count
    });

    return {
      totalCallsToday: totalCallsToday,
      qualifiedLeads: qualifiedResult.count,
      avgDuration: avgDuration,
      successRate: successRate
    };
  }
}

export const storage = new DatabaseStorage();
