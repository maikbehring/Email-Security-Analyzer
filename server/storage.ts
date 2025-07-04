import { users, emailAnalyses, type EmailAnalysis, type InsertEmailAnalysis, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Email analysis methods
  createEmailAnalysis(analysis: InsertEmailAnalysis): Promise<EmailAnalysis>;
  getEmailAnalysis(id: number): Promise<EmailAnalysis | undefined>;
  getRecentAnalyses(limit?: number): Promise<EmailAnalysis[]>;
  getAnalysisStats(): Promise<{
    totalAnalyzed: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    thisWeek: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
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

  async createEmailAnalysis(insertAnalysis: InsertEmailAnalysis): Promise<EmailAnalysis> {
    const [analysis] = await db
      .insert(emailAnalyses)
      .values(insertAnalysis)
      .returning();
    return analysis;
  }

  async getEmailAnalysis(id: number): Promise<EmailAnalysis | undefined> {
    const [analysis] = await db.select().from(emailAnalyses).where(eq(emailAnalyses.id, id));
    return analysis as EmailAnalysis || undefined;
  }

  async getRecentAnalyses(limit: number = 10): Promise<EmailAnalysis[]> {
    const analyses = await db
      .select()
      .from(emailAnalyses)
      .orderBy(desc(emailAnalyses.uploadedAt))
      .limit(limit);
    return analyses as EmailAnalysis[];
  }

  async getAnalysisStats(): Promise<{
    totalAnalyzed: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    thisWeek: number;
  }> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailAnalyses);
    
    const [highRiskResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailAnalyses)
      .where(eq(emailAnalyses.riskLevel, 'HIGH'));
    
    const [mediumRiskResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailAnalyses)
      .where(eq(emailAnalyses.riskLevel, 'MEDIUM'));
    
    const [lowRiskResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailAnalyses)
      .where(eq(emailAnalyses.riskLevel, 'LOW'));
    
    const [thisWeekResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailAnalyses)
      .where(sql`${emailAnalyses.uploadedAt} > ${oneWeekAgo}`);
    
    return {
      totalAnalyzed: totalResult.count,
      highRisk: highRiskResult.count,
      mediumRisk: mediumRiskResult.count,
      lowRisk: lowRiskResult.count,
      thisWeek: thisWeekResult.count,
    };
  }
}

export const storage = new DatabaseStorage();
