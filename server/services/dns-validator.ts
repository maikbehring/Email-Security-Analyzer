import { promises as dns } from 'dns';

export interface DNSValidationResult {
  spf: 'PASS' | 'FAIL' | 'NEUTRAL' | 'NONE';
  dkim: 'PASS' | 'FAIL' | 'NEUTRAL' | 'NONE';
  dmarc: 'PASS' | 'FAIL' | 'NEUTRAL' | 'NONE';
}

export class DNSValidator {
  async validateEmailAuthentication(fromDomain: string, headers: Record<string, string>): Promise<DNSValidationResult> {
    const domain = this.extractDomain(fromDomain);
    
    if (!domain) {
      return {
        spf: 'NONE',
        dkim: 'NONE',
        dmarc: 'NONE',
      };
    }
    
    const [spfResult, dkimResult, dmarcResult] = await Promise.all([
      this.checkSPF(domain, headers),
      this.checkDKIM(domain, headers),
      this.checkDMARC(domain),
    ]);
    
    return {
      spf: spfResult,
      dkim: dkimResult,
      dmarc: dmarcResult,
    };
  }
  
  private extractDomain(email: string): string | null {
    // Extract domain from email address, handling various formats
    const match = email.match(/@([a-zA-Z0-9.-]+)/);
    return match ? match[1].toLowerCase() : null;
  }
  
  private async checkSPF(domain: string, headers: Record<string, string>): Promise<'PASS' | 'FAIL' | 'NEUTRAL' | 'NONE'> {
    try {
      // Look for SPF record in DNS
      const txtRecords = await dns.resolveTxt(domain);
      const spfRecord = txtRecords.find(record => 
        record.some(part => part.includes('v=spf1'))
      );
      
      if (!spfRecord) {
        return 'NONE';
      }
      
      // Simplified SPF validation - in real implementation would check against sending IP
      const spfString = spfRecord.join('');
      
      // Check for common legitimate mechanisms
      if (spfString.includes('include:_spf.google.com') || 
          spfString.includes('include:spf.protection.outlook.com') ||
          spfString.includes('include:amazonses.com')) {
        return 'PASS';
      }
      
      // Check for restrictive policies
      if (spfString.includes('-all')) {
        return 'FAIL';
      }
      
      return 'NEUTRAL';
    } catch (error) {
      return 'NONE';
    }
  }
  
  private async checkDKIM(domain: string, headers: Record<string, string>): Promise<'PASS' | 'FAIL' | 'NEUTRAL' | 'NONE'> {
    try {
      // Look for DKIM signature in headers
      const dkimSignature = headers['dkim-signature'] || headers['DKIM-Signature'];
      
      if (!dkimSignature) {
        return 'NONE';
      }
      
      // Extract selector from DKIM signature
      const selectorMatch = dkimSignature.match(/s=([^;]+)/);
      if (!selectorMatch) {
        return 'FAIL';
      }
      
      const selector = selectorMatch[1];
      const dkimDomain = `${selector}._domainkey.${domain}`;
      
      // Check if DKIM record exists
      const txtRecords = await dns.resolveTxt(dkimDomain);
      const dkimRecord = txtRecords.find(record => 
        record.some(part => part.includes('k=rsa') || part.includes('p='))
      );
      
      return dkimRecord ? 'PASS' : 'FAIL';
    } catch (error) {
      return 'NONE';
    }
  }
  
  private async checkDMARC(domain: string): Promise<'PASS' | 'FAIL' | 'NEUTRAL' | 'NONE'> {
    try {
      const dmarcDomain = `_dmarc.${domain}`;
      const txtRecords = await dns.resolveTxt(dmarcDomain);
      const dmarcRecord = txtRecords.find(record => 
        record.some(part => part.includes('v=DMARC1'))
      );
      
      if (!dmarcRecord) {
        return 'NONE';
      }
      
      const dmarcString = dmarcRecord.join('');
      
      // Check policy
      if (dmarcString.includes('p=reject')) {
        return 'PASS';
      } else if (dmarcString.includes('p=quarantine')) {
        return 'NEUTRAL';
      } else if (dmarcString.includes('p=none')) {
        return 'NEUTRAL';
      }
      
      return 'PASS';
    } catch (error) {
      return 'NONE';
    }
  }
}
