import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const emailAnalyses = pgTable("email_analyses", {
  id: serial("id").primaryKey(),
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  
  // Email metadata
  emailFrom: text("email_from"),
  emailTo: text("email_to"),
  emailSubject: text("email_subject"),
  emailDate: text("email_date"),
  
  // Authentication results
  spfResult: text("spf_result"), // PASS, FAIL, NEUTRAL, NONE
  dkimResult: text("dkim_result"), // PASS, FAIL, NEUTRAL, NONE  
  dmarcResult: text("dmarc_result"), // PASS, FAIL, NEUTRAL, NONE
  
  // AI Analysis
  riskLevel: text("risk_level").notNull(), // LOW, MEDIUM, HIGH
  aiAssessment: text("ai_assessment"),
  confidence: integer("confidence"), // 0-100
  recommendations: text("recommendations").array(),
  
  // Extracted data
  extractedLinks: jsonb("extracted_links"), // Array of {url, text, suspicious}
  attachments: jsonb("attachments"), // Array of {name, size, hash, type}
  
  // Full email content
  rawHeaders: text("raw_headers"),
  emailBody: text("email_body"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertEmailAnalysisSchema = createInsertSchema(emailAnalyses).omit({
  id: true,
  uploadedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type EmailAnalysis = typeof emailAnalyses.$inferSelect;
export type InsertEmailAnalysis = z.infer<typeof insertEmailAnalysisSchema>;

// Response types for API
export const riskAssessmentSchema = z.object({
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  assessment: z.string(),
  confidence: z.number().min(0).max(100),
  recommendations: z.array(z.string()),
});

export type RiskAssessment = z.infer<typeof riskAssessmentSchema>;

export const emailDataSchema = z.object({
  headers: z.object({
    from: z.string().optional(),
    to: z.string().optional(),
    subject: z.string().optional(),
    date: z.string().optional(),
  }),
  body: z.string(),
  links: z.array(z.object({
    url: z.string(),
    text: z.string(),
    suspicious: z.boolean().optional(),
  })),
  attachments: z.array(z.object({
    name: z.string(),
    size: z.number(),
    hash: z.string(),
    type: z.string(),
  })),
});

export type EmailData = z.infer<typeof emailDataSchema>;
