import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { EmailParser } from "./services/email-parser";
import { OpenAIAnalyzer } from "./services/openai-analyzer";
import { DNSValidator } from "./services/dns-validator";
import { insertEmailAnalysisSchema } from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.eml', '.msg', '.txt'];
    const fileExt = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .eml, .msg, and .txt files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  const emailParser = new EmailParser();
  const aiAnalyzer = new OpenAIAnalyzer();
  const dnsValidator = new DNSValidator();

  // Get dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getAnalysisStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Get recent analyses
  app.get("/api/analyses/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const analyses = await storage.getRecentAnalyses(limit);
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching recent analyses:", error);
      res.status(500).json({ message: "Failed to fetch recent analyses" });
    }
  });

  // Upload and analyze email
  app.post("/api/analyze", upload.single('emailFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileContent = req.file.buffer.toString('utf-8');
      const fileName = req.file.originalname;
      const fileSize = req.file.size;

      console.log(`Processing email file: ${fileName} (${fileSize} bytes)`);

      // Parse email
      const emailData = emailParser.parseEmailFile(fileContent, fileName);

      // Perform AI analysis
      const aiResult = await aiAnalyzer.analyzeEmail(emailData);

      // Validate DNS records
      const fromDomain = emailData.headers.from || '';
      const dnsResult = await dnsValidator.validateEmailAuthentication(fromDomain, {
        'dkim-signature': '', // Would be extracted from raw headers in real implementation
      });

      // Create analysis record
      const analysisData = {
        fileName,
        fileSize,
        emailFrom: emailData.headers.from || null,
        emailTo: emailData.headers.to || null,
        emailSubject: emailData.headers.subject || null,
        emailDate: emailData.headers.date || null,
        spfResult: dnsResult.spf,
        dkimResult: dnsResult.dkim,
        dmarcResult: dnsResult.dmarc,
        riskLevel: aiResult.riskLevel,
        aiAssessment: aiResult.assessment,
        confidence: aiResult.confidence,
        recommendations: aiResult.recommendations,
        extractedLinks: emailData.links,
        attachments: emailData.attachments,
        rawHeaders: '', // Would store raw headers in real implementation
        emailBody: emailData.body,
      };

      const analysis = await storage.createEmailAnalysis(analysisData);

      res.json({
        id: analysis.id,
        emailData,
        aiResult,
        dnsResult,
        analysis,
      });

    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Analysis failed" 
      });
    }
  });

  // Get specific analysis
  app.get("/api/analyses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getEmailAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      res.json(analysis);
    } catch (error) {
      console.error("Error fetching analysis:", error);
      res.status(500).json({ message: "Failed to fetch analysis" });
    }
  });

  // Export analysis as JSON
  app.get("/api/analyses/:id/export", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getEmailAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      // Format for export
      const exportData = {
        analysis: {
          id: analysis.id,
          fileName: analysis.fileName,
          uploadedAt: analysis.uploadedAt,
          riskLevel: analysis.riskLevel,
          confidence: analysis.confidence,
        },
        email: {
          from: analysis.emailFrom,
          to: analysis.emailTo,
          subject: analysis.emailSubject,
          date: analysis.emailDate,
        },
        authentication: {
          spf: analysis.spfResult,
          dkim: analysis.dkimResult,
          dmarc: analysis.dmarcResult,
        },
        assessment: {
          description: analysis.aiAssessment,
          recommendations: analysis.recommendations,
        },
        extractedData: {
          links: analysis.extractedLinks,
          attachments: analysis.attachments,
        },
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="analysis-${id}.json"`);
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting analysis:", error);
      res.status(500).json({ message: "Failed to export analysis" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
