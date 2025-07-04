import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle, 
  Download, 
  Copy, 
  Search, 
  FileText,
  ExternalLink,
  Flag,
  Save
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResultsProps {
  analysis: any;
}

export function AnalysisResults({ analysis }: AnalysisResultsProps) {
  const { toast } = useToast();
  
  if (!analysis) return null;
  
  const { emailData, aiResult, dnsResult, analysis: analysisRecord } = analysis;

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH': return 'text-risk-danger';
      case 'MEDIUM': return 'text-risk-warning';
      case 'LOW': return 'text-risk-safe';
      default: return 'text-risk-unknown';
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH': return 'bg-red-900/20 border-red-600/30 text-risk-danger';
      case 'MEDIUM': return 'bg-amber-900/20 border-amber-600/30 text-risk-warning';
      case 'LOW': return 'bg-green-900/20 border-green-600/30 text-risk-safe';
      default: return 'bg-slate-700/20 border-slate-600/30 text-risk-unknown';
    }
  };

  const getAuthBadgeColor = (result: string) => {
    switch (result) {
      case 'PASS': return 'bg-risk-safe/20 text-risk-safe border-risk-safe/30';
      case 'FAIL': return 'bg-risk-danger/20 text-risk-danger border-risk-danger/30';
      default: return 'bg-risk-unknown/20 text-risk-unknown border-risk-unknown/30';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Link has been copied to clipboard",
    });
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/analyses/${analysisRecord.id}/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-${analysisRecord.id}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Analysis results have been exported as JSON",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export analysis results",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="bg-security-card border-security-border">
      <CardHeader className="border-b border-security-border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Analysis Results</CardTitle>
          <div className="flex items-center space-x-3">
            <Badge 
              variant="outline" 
              className={getRiskBadgeColor(aiResult.riskLevel)}
            >
              <div className="w-3 h-3 rounded-full mr-2 risk-indicator" 
                   style={{ backgroundColor: 'currentColor' }} />
              {aiResult.riskLevel} RISK
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              className="text-slate-400 hover:text-white hover:bg-slate-700"
              onClick={handleExport}
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Headers */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-white">Email Headers</h4>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
              <div className="space-y-3 text-sm">
                <div className="flex">
                  <span className="text-slate-400 w-20 flex-shrink-0">From:</span>
                  <span className="text-white font-mono break-all">
                    {emailData.headers.from || 'Unknown'}
                  </span>
                </div>
                <div className="flex">
                  <span className="text-slate-400 w-20 flex-shrink-0">To:</span>
                  <span className="text-white font-mono break-all">
                    {emailData.headers.to || 'Unknown'}
                  </span>
                </div>
                <div className="flex">
                  <span className="text-slate-400 w-20 flex-shrink-0">Subject:</span>
                  <span className="text-white break-all">
                    {emailData.headers.subject || 'No subject'}
                  </span>
                </div>
                <div className="flex">
                  <span className="text-slate-400 w-20 flex-shrink-0">Date:</span>
                  <span className="text-white font-mono">
                    {emailData.headers.date || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
            
            <h4 className="text-md font-semibold text-white">Authentication Results</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                <span className="text-sm text-slate-300">SPF</span>
                <Badge variant="outline" className={getAuthBadgeColor(dnsResult.spf)}>
                  {dnsResult.spf === 'PASS' ? <CheckCircle className="w-3 h-3 mr-1" /> : 
                   dnsResult.spf === 'FAIL' ? <AlertTriangle className="w-3 h-3 mr-1" /> : 
                   <div className="w-3 h-3 bg-current rounded-full mr-1" />}
                  {dnsResult.spf}
                </Badge>
              </div>
              <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                <span className="text-sm text-slate-300">DKIM</span>
                <Badge variant="outline" className={getAuthBadgeColor(dnsResult.dkim)}>
                  {dnsResult.dkim === 'PASS' ? <CheckCircle className="w-3 h-3 mr-1" /> : 
                   dnsResult.dkim === 'FAIL' ? <AlertTriangle className="w-3 h-3 mr-1" /> : 
                   <div className="w-3 h-3 bg-current rounded-full mr-1" />}
                  {dnsResult.dkim}
                </Badge>
              </div>
              <div className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                <span className="text-sm text-slate-300">DMARC</span>
                <Badge variant="outline" className={getAuthBadgeColor(dnsResult.dmarc)}>
                  {dnsResult.dmarc === 'PASS' ? <CheckCircle className="w-3 h-3 mr-1" /> : 
                   dnsResult.dmarc === 'FAIL' ? <AlertTriangle className="w-3 h-3 mr-1" /> : 
                   <div className="w-3 h-3 bg-current rounded-full mr-1" />}
                  {dnsResult.dmarc}
                </Badge>
              </div>
            </div>
          </div>
          
          {/* AI Analysis */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-white">AI Risk Assessment</h4>
            <div className={`rounded-lg p-4 border ${getRiskBadgeColor(aiResult.riskLevel)}`}>
              <div className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  aiResult.riskLevel === 'HIGH' ? 'bg-risk-danger' :
                  aiResult.riskLevel === 'MEDIUM' ? 'bg-risk-warning' : 'bg-risk-safe'
                }`}>
                  {aiResult.riskLevel === 'HIGH' ? <AlertTriangle className="text-white text-sm" /> :
                   aiResult.riskLevel === 'MEDIUM' ? <AlertTriangle className="text-white text-sm" /> :
                   <CheckCircle className="text-white text-sm" />}
                </div>
                <div>
                  <h5 className={`text-sm font-semibold mb-2 ${getRiskColor(aiResult.riskLevel)}`}>
                    {aiResult.riskLevel === 'HIGH' ? 'High Risk Detected' :
                     aiResult.riskLevel === 'MEDIUM' ? 'Medium Risk Detected' : 'Low Risk / Safe'}
                  </h5>
                  <p className="text-sm text-slate-300 mb-3">
                    {aiResult.assessment}
                  </p>
                  <div className="text-xs text-slate-400">
                    Confidence: <span className={`font-medium ${getRiskColor(aiResult.riskLevel)}`}>
                      {aiResult.confidence}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <h4 className="text-md font-semibold text-white">Recommendations</h4>
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
              <ul className="space-y-2 text-sm text-slate-300">
                {aiResult.recommendations.map((rec: string, index: number) => (
                  <li key={index} className="flex items-start space-x-2">
                    <div className="w-1 h-1 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        {/* Extracted Links */}
        {emailData.links && emailData.links.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-semibold text-white mb-4">Extracted Links</h4>
            <div className="space-y-3">
              {emailData.links.map((link: any, index: number) => (
                <div key={index} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-white">{link.text}</span>
                      {link.suspicious && (
                        <Badge variant="outline" className="bg-risk-danger/20 text-risk-danger border-risk-danger/30">
                          SUSPICIOUS
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono truncate">
                      {link.url}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-white hover:bg-slate-700"
                      onClick={() => window.open(link.url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-white hover:bg-slate-700"
                      onClick={() => copyToClipboard(link.url)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Attachments */}
        {emailData.attachments && emailData.attachments.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-semibold text-white mb-4">Attachments</h4>
            <div className="space-y-3">
              {emailData.attachments.map((attachment: any, index: number) => (
                <div key={index} className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
                        <FileText className="text-risk-danger" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{attachment.name}</p>
                        <div className="flex items-center space-x-4 text-xs text-slate-400">
                          <span>{(attachment.size / 1024).toFixed(1)} KB</span>
                          <span>Hash: <span className="font-mono">{attachment.hash}</span></span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-amber-600/20 text-amber-400 border-amber-600/30 hover:bg-amber-600/30"
                      >
                        <Search className="w-3 h-3 mr-1" />
                        Scan
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600"
                      >
                        Sandbox
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="outline" className="bg-slate-700 border-slate-600 hover:bg-slate-600">
            <Save className="w-4 h-4 mr-2" />
            Save Analysis
          </Button>
          <Button 
            variant="outline" 
            className="bg-blue-600/20 border-blue-600/30 text-blue-400 hover:bg-blue-600/30"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button variant="outline" className="bg-red-600/20 border-red-600/30 text-risk-danger hover:bg-red-600/30">
            <Flag className="w-4 h-4 mr-2" />
            Report Threat
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
