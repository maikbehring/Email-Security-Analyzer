import OpenAI from "openai";
import type { RiskAssessment, EmailData } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export class OpenAIAnalyzer {
  async analyzeEmail(emailData: EmailData): Promise<RiskAssessment> {
    const prompt = this.buildAnalysisPrompt(emailData);
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a cybersecurity expert specializing in email threat analysis. Analyze the provided email data and return a JSON response with risk assessment.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      
      return {
        riskLevel: this.validateRiskLevel(result.riskLevel),
        assessment: result.assessment || "Analysis completed",
        confidence: Math.max(0, Math.min(100, result.confidence || 50)),
        recommendations: Array.isArray(result.recommendations) 
          ? result.recommendations.filter((r: any) => typeof r === 'string')
          : [],
      };
    } catch (error) {
      console.error("OpenAI analysis failed:", error);
      
      // Fallback analysis based on heuristics
      return this.performHeuristicAnalysis(emailData);
    }
  }
  
  private buildAnalysisPrompt(emailData: EmailData): string {
    return `
Analyze this email for security threats and phishing indicators. Return your analysis as JSON with the following structure:

{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "assessment": "Detailed explanation of the risk assessment",
  "confidence": number (0-100),
  "recommendations": ["list", "of", "specific", "actions"]
}

Email Data:
- From: ${emailData.headers.from || 'Unknown'}
- To: ${emailData.headers.to || 'Unknown'}
- Subject: ${emailData.headers.subject || 'No subject'}
- Date: ${emailData.headers.date || 'Unknown'}

Body (first 1000 chars):
${emailData.body.substring(0, 1000)}

Links found: ${emailData.links.length}
${emailData.links.map(link => `- ${link.url} (${link.text})`).join('\n')}

Attachments: ${emailData.attachments.length}
${emailData.attachments.map(att => `- ${att.name} (${att.type})`).join('\n')}

Focus on:
1. Domain spoofing and suspicious URLs
2. Urgent language and social engineering tactics
3. Suspicious attachments
4. Grammar and spelling errors
5. Requests for sensitive information
6. Mismatched sender domains

Provide specific, actionable recommendations for security teams.
    `.trim();
  }
  
  private validateRiskLevel(level: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const validLevels = ['LOW', 'MEDIUM', 'HIGH'];
    return validLevels.includes(level) ? level as 'LOW' | 'MEDIUM' | 'HIGH' : 'MEDIUM';
  }
  
  private performHeuristicAnalysis(emailData: EmailData): RiskAssessment {
    let riskScore = 0;
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Check for suspicious domains
    const from = emailData.headers.from || '';
    if (this.hasSuspiciousDomain(from)) {
      riskScore += 30;
      issues.push("Sender domain appears suspicious");
      recommendations.push("Verify sender domain authenticity");
    }
    
    // Check for suspicious links
    const suspiciousLinks = emailData.links.filter(link => link.suspicious);
    if (suspiciousLinks.length > 0) {
      riskScore += 25;
      issues.push(`Found ${suspiciousLinks.length} suspicious link(s)`);
      recommendations.push("Scan all links with URL reputation services");
    }
    
    // Check for urgent language
    const body = emailData.body.toLowerCase();
    const urgentKeywords = ['urgent', 'immediate', 'expires', 'suspend', 'verify', 'confirm', 'click here'];
    const urgentCount = urgentKeywords.filter(keyword => body.includes(keyword)).length;
    
    if (urgentCount >= 2) {
      riskScore += 20;
      issues.push("Contains urgent/pressure language");
      recommendations.push("User awareness training on pressure tactics");
    }
    
    // Check for attachments
    if (emailData.attachments.length > 0) {
      riskScore += 15;
      issues.push(`Contains ${emailData.attachments.length} attachment(s)`);
      recommendations.push("Scan attachments in isolated environment");
    }
    
    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    if (riskScore >= 50) {
      riskLevel = 'HIGH';
    } else if (riskScore >= 25) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'LOW';
    }
    
    return {
      riskLevel,
      assessment: issues.length > 0 
        ? `Heuristic analysis identified the following concerns: ${issues.join(', ')}`
        : "No significant threats detected in heuristic analysis",
      confidence: Math.min(80, 40 + riskScore),
      recommendations: recommendations.length > 0 
        ? recommendations 
        : ["Continue monitoring", "No immediate action required"],
    };
  }
  
  private hasSuspiciousDomain(email: string): boolean {
    const suspiciousPatterns = [
      /paypal.*\.net/i,
      /amazon.*\.org/i,
      /microsoft.*\.tk/i,
      /google.*\.ml/i,
      /apple.*\.cf/i,
      /[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/, // IP addresses
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(email));
  }
}
