import { emailAnalyses, type EmailAnalysis, type InsertEmailAnalysis, type User, type InsertUser } from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private analyses: Map<number, EmailAnalysis>;
  private currentUserId: number;
  private currentAnalysisId: number;

  constructor() {
    this.users = new Map();
    this.analyses = new Map();
    this.currentUserId = 1;
    this.currentAnalysisId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createEmailAnalysis(insertAnalysis: InsertEmailAnalysis): Promise<EmailAnalysis> {
    const id = this.currentAnalysisId++;
    const analysis: EmailAnalysis = {
      ...insertAnalysis,
      id,
      uploadedAt: new Date(),
    };
    this.analyses.set(id, analysis);
    return analysis;
  }

  async getEmailAnalysis(id: number): Promise<EmailAnalysis | undefined> {
    return this.analyses.get(id);
  }

  async getRecentAnalyses(limit: number = 10): Promise<EmailAnalysis[]> {
    const analyses = Array.from(this.analyses.values())
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      .slice(0, limit);
    return analyses;
  }

  async getAnalysisStats(): Promise<{
    totalAnalyzed: number;
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    thisWeek: number;
  }> {
    const analyses = Array.from(this.analyses.values());
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      totalAnalyzed: analyses.length,
      highRisk: analyses.filter(a => a.riskLevel === 'HIGH').length,
      mediumRisk: analyses.filter(a => a.riskLevel === 'MEDIUM').length,
      lowRisk: analyses.filter(a => a.riskLevel === 'LOW').length,
      thisWeek: analyses.filter(a => a.uploadedAt > oneWeekAgo).length,
    };
  }
}

export const storage = new MemStorage();
