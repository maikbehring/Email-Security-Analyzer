import type { EmailData } from "@shared/schema";

export class EmailParser {
  parseEmailFile(content: string, fileName: string): EmailData {
    const lines = content.split('\n');
    let headerEndIndex = 0;
    
    // Find end of headers (empty line)
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() === '') {
        headerEndIndex = i;
        break;
      }
    }
    
    const headerLines = lines.slice(0, headerEndIndex);
    const bodyLines = lines.slice(headerEndIndex + 1);
    
    // Parse headers
    const headers = this.parseHeaders(headerLines);
    
    // Parse body
    const body = bodyLines.join('\n');
    
    // Extract links
    const links = this.extractLinks(body);
    
    // Extract attachment info (simplified for demo)
    const attachments = this.extractAttachments(content, fileName);
    
    return {
      headers,
      body,
      links,
      attachments,
    };
  }
  
  private parseHeaders(headerLines: string[]): EmailData['headers'] {
    const headers: EmailData['headers'] = {};
    let currentHeader = '';
    let currentValue = '';
    
    for (const line of headerLines) {
      if (line.startsWith(' ') || line.startsWith('\t')) {
        // Continuation of previous header
        currentValue += ' ' + line.trim();
      } else {
        // Save previous header
        if (currentHeader) {
          this.setHeaderValue(headers, currentHeader, currentValue);
        }
        
        // Start new header
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          currentHeader = line.substring(0, colonIndex).trim().toLowerCase();
          currentValue = line.substring(colonIndex + 1).trim();
        }
      }
    }
    
    // Save last header
    if (currentHeader) {
      this.setHeaderValue(headers, currentHeader, currentValue);
    }
    
    return headers;
  }
  
  private setHeaderValue(headers: EmailData['headers'], name: string, value: string) {
    switch (name) {
      case 'from':
        headers.from = value;
        break;
      case 'to':
        headers.to = value;
        break;
      case 'subject':
        headers.subject = value;
        break;
      case 'date':
        headers.date = value;
        break;
    }
  }
  
  private extractLinks(body: string): EmailData['links'] {
    const urlRegex = /https?:\/\/[^\s<>"']+/gi;
    const matches = body.match(urlRegex) || [];
    
    return matches.map(url => {
      // Extract display text (simplified)
      const displayText = this.getDisplayTextForUrl(body, url);
      
      return {
        url,
        text: displayText,
        suspicious: this.isUrlSuspicious(url),
      };
    });
  }
  
  private getDisplayTextForUrl(body: string, url: string): string {
    // Look for HTML anchor tags or use URL as display text
    const anchorRegex = new RegExp(`<a[^>]*href=["']?${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']?[^>]*>([^<]*)</a>`, 'i');
    const match = body.match(anchorRegex);
    
    if (match && match[1]) {
      return match[1].trim();
    }
    
    return url.length > 50 ? url.substring(0, 50) + '...' : url;
  }
  
  private isUrlSuspicious(url: string): boolean {
    const suspiciousPatterns = [
      /bit\.ly|tinyurl\.com|t\.co/i, // URL shorteners
      /[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/, // IP addresses
      /[a-z0-9\-]+\.tk|\.ml|\.ga|\.cf/i, // Suspicious TLDs
      /paypal.*\.net|amazon.*\.org|microsoft.*\.tk/i, // Domain spoofing
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(url));
  }
  
  private extractAttachments(content: string, fileName: string): EmailData['attachments'] {
    // Simplified attachment detection
    const attachmentRegex = /Content-Disposition: attachment; filename="([^"]+)"/gi;
    const matches = [...content.matchAll(attachmentRegex)];
    
    return matches.map((match, index) => ({
      name: match[1],
      size: Math.floor(Math.random() * 1000000) + 10000, // Simplified
      hash: this.generateSimpleHash(match[1] + index),
      type: this.getFileType(match[1]),
    }));
  }
  
  private generateSimpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 8);
  }
  
  private getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      txt: 'text/plain',
      jpg: 'image/jpeg',
      png: 'image/png',
      zip: 'application/zip',
    };
    
    return typeMap[extension || ''] || 'application/octet-stream';
  }
}
