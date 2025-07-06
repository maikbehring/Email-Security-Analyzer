import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { FileUpload } from "@/components/file-upload";
import { AnalysisResults } from "@/components/analysis-results";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Mail, 
  Download,
  Eye,
  Clock,
  TrendingUp,
  Activity,
  Home
} from "lucide-react";
import type { EmailAnalysis } from "@shared/schema";

interface Stats {
  totalAnalyzed: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  thisWeek: number;
}

export default function Dashboard() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [showHistoryView, setShowHistoryView] = useState(false);

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['/api/stats'],
  });

  const { data: recentAnalyses, isLoading: analysesLoading } = useQuery<EmailAnalysis[]>({
    queryKey: ['/api/analyses/recent'],
  });

  const handleAnalysisComplete = (result: any) => {
    setSelectedAnalysis(result);
  };

  const handleHistoryClick = () => {
    setShowHistoryView(true);
    setSelectedAnalysis(null);
  };

  const handleDashboardClick = () => {
    setShowHistoryView(false);
    setSelectedAnalysis(null);
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH': return 'bg-risk-danger/20 text-risk-danger border-risk-danger/30';
      case 'MEDIUM': return 'bg-risk-warning/20 text-risk-warning border-risk-warning/30';
      case 'LOW': return 'bg-risk-safe/20 text-risk-safe border-risk-safe/30';
      default: return 'bg-risk-unknown/20 text-risk-unknown border-risk-unknown/30';
    }
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleExport = async (analysisId: number) => {
    try {
      const response = await fetch(`/api/analyses/${analysisId}/export`);
      const data = await response.json();
      
      // Create PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      let yPosition = 20;
      
      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Email Security Analysis Report', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 20;
      
      // Basic Info
      pdf.setFontSize(14);
      pdf.setTextColor(60, 60, 60);
      pdf.text('Analysis Details', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setTextColor(80, 80, 80);
      
      const lines = [
        `File: ${data.analysis?.fileName || 'Unknown File'}`,
        `Date: ${new Date(data.analysis?.uploadedAt || new Date()).toLocaleDateString('de-DE')}`,
        `Risk Level: ${data.analysis?.riskLevel || 'Unknown'}`,
        `Subject: ${data.email?.subject || 'No Subject'}`,
        `From: ${data.email?.from || 'Unknown Sender'}`,
        `To: ${data.email?.to || 'Unknown Recipient'}`
      ];
      
      lines.forEach(line => {
        pdf.text(line, 20, yPosition);
        yPosition += 8;
      });
      
      yPosition += 10;
      
      // Risk Assessment
      pdf.setFontSize(14);
      pdf.setTextColor(60, 60, 60);
      pdf.text('Risk Assessment', 20, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      if (data.assessment?.description) {
        const descriptionText = pdf.splitTextToSize(data.assessment.description, pageWidth - 40);
        pdf.text(descriptionText, 20, yPosition);
        yPosition += descriptionText.length * 5;
      }
      
      yPosition += 10;
      
      // Authentication Results
      if (data.authentication) {
        pdf.setFontSize(14);
        pdf.setTextColor(60, 60, 60);
        pdf.text('Email Authentication', 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        pdf.text(`SPF: ${data.authentication.spf}`, 20, yPosition);
        yPosition += 6;
        pdf.text(`DKIM: ${data.authentication.dkim}`, 20, yPosition);
        yPosition += 6;
        pdf.text(`DMARC: ${data.authentication.dmarc}`, 20, yPosition);
        yPosition += 10;
      }
      
      // Recommendations
      if (data.assessment?.recommendations) {
        pdf.setFontSize(14);
        pdf.setTextColor(60, 60, 60);
        pdf.text('Security Recommendations', 20, yPosition);
        yPosition += 10;
        
        pdf.setFontSize(10);
        data.assessment.recommendations.forEach((rec: string) => {
          const wrappedText = pdf.splitTextToSize(`• ${rec}`, pageWidth - 40);
          pdf.text(wrappedText, 20, yPosition);
          yPosition += wrappedText.length * 5;
        });
      }
      
      // Save PDF
      pdf.save(`email-analysis-${analysisId}.pdf`);
    } catch (error) {
      console.error('PDF Export failed:', error);
    }
  };

  const handleExportAllReports = async () => {
    try {
      if (!recentAnalyses || recentAnalyses.length === 0) {
        alert('Keine Analysen zum Exportieren verfügbar');
        return;
      }

      // Create comprehensive PDF report
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      let yPosition = 20;
      
      // Header
      pdf.setFontSize(22);
      pdf.setTextColor(40, 40, 40);
      pdf.text('Email Security Summary Report', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 20;
      
      // Date
      pdf.setFontSize(10);
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Generated: ${new Date().toLocaleDateString('de-DE')} ${new Date().toLocaleTimeString('de-DE')}`, pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 20;
      
      // Statistics Summary
      pdf.setFontSize(16);
      pdf.setTextColor(60, 60, 60);
      pdf.text('Security Overview', 20, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(12);
      const statsLines = [
        `Total Analyzed Emails: ${stats?.totalAnalyzed || 0}`,
        `High Risk: ${stats?.highRisk || 0}`,
        `Medium Risk: ${stats?.mediumRisk || 0}`, 
        `Low Risk: ${stats?.lowRisk || 0}`,
        `This Week: ${stats?.thisWeek || 0}`
      ];
      
      statsLines.forEach(line => {
        pdf.text(line, 20, yPosition);
        yPosition += 8;
      });
      
      yPosition += 15;
      
      // Recent Analyses
      pdf.setFontSize(16);
      pdf.text('Recent Analyses', 20, yPosition);
      yPosition += 10;
      
      recentAnalyses.slice(0, 10).forEach((analysis, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 20;
        }
        
        pdf.setFontSize(12);
        pdf.setTextColor(40, 40, 40);
        pdf.text(`${index + 1}. ${analysis.fileName}`, 20, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        pdf.setTextColor(80, 80, 80);
        pdf.text(`   Risk: ${analysis.riskLevel} | From: ${analysis.emailFrom || 'Unknown'}`, 20, yPosition);
        yPosition += 6;
        pdf.text(`   Date: ${formatDate(analysis.uploadedAt)}`, 20, yPosition);
        yPosition += 6;
        
        if (analysis.emailSubject) {
          const subjectText = pdf.splitTextToSize(`   Subject: ${analysis.emailSubject}`, pageWidth - 40);
          pdf.text(subjectText, 20, yPosition);
          yPosition += subjectText.length * 6;
        }
        
        yPosition += 5;
      });
      
      // Save PDF
      pdf.save(`email-security-summary-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Export failed:', error);
      alert('Export fehlgeschlagen');
    }
  };

  return (
    <div className="flex min-h-screen bg-security-dark text-slate-100">
      <Sidebar 
        onHistoryClick={handleHistoryClick}
        onDashboardClick={handleDashboardClick}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-security-card border-b border-security-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Email Security Analysis</h2>
              <p className="text-sm text-slate-400">Upload and analyze email files for security threats</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-slate-700 border-slate-600 hover:bg-slate-600"
                onClick={handleExportAllReports}
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {showHistoryView ? (
              /* History View */
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Analysis History</h2>
                    <p className="text-sm text-slate-400">All email security analyses</p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleDashboardClick}
                    className="bg-slate-700 border-slate-600 hover:bg-slate-600"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </div>

                {/* Extended Recent Analyses Table */}
                <Card className="bg-security-card border-security-border">
                  <CardHeader>
                    <CardTitle className="text-white">All Analyses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-800/50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                              ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                              File Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Sender
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Subject
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Risk Level
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Confidence
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                          {analysesLoading ? (
                            <tr>
                              <td colSpan={8} className="px-6 py-4 text-center text-slate-400">
                                Loading analyses...
                              </td>
                            </tr>
                          ) : !recentAnalyses || recentAnalyses.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="px-6 py-4 text-center text-slate-400">
                                No analyses found. Upload an email file to get started.
                              </td>
                            </tr>
                          ) : (
                            recentAnalyses.map((analysis) => (
                              <tr 
                                key={analysis.id} 
                                className="hover:bg-slate-800/30 transition-colors"
                              >
                                <td className="px-6 py-4 text-sm text-slate-300">
                                  #{analysis.id}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm font-medium text-white">
                                    {analysis.fileName}
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    {(analysis.fileSize / 1024).toFixed(1)} KB
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-300 max-w-48 truncate">
                                  {analysis.emailFrom || 'Unknown'}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-300 max-w-64 truncate">
                                  {analysis.emailSubject || 'No Subject'}
                                </td>
                                <td className="px-6 py-4">
                                  <Badge 
                                    variant="outline" 
                                    className={getRiskBadgeColor(analysis.riskLevel)}
                                  >
                                    {analysis.riskLevel}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-300">
                                  {analysis.confidence}%
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-300">
                                  {formatDate(analysis.uploadedAt)}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                                      onClick={() => setSelectedAnalysis(analysis)}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-slate-400 hover:text-white hover:bg-slate-700"
                                      onClick={() => handleExport(analysis.id)}
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              /* Dashboard View */
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-stats-section>
                  <Card className="bg-security-card border-security-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400">Total Analyzed</p>
                          <p className="text-2xl font-bold text-white">
                            {statsLoading ? '...' : stats?.totalAnalyzed || 0}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                          <Mail className="text-blue-400 text-xl" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-security-card border-security-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400">High Risk</p>
                          <p className="text-2xl font-bold text-risk-danger">
                            {statsLoading ? '...' : stats?.highRisk || 0}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="text-risk-danger text-xl" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-security-card border-security-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400">Medium Risk</p>
                          <p className="text-2xl font-bold text-risk-warning">
                            {statsLoading ? '...' : stats?.mediumRisk || 0}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-amber-600/20 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="text-risk-warning text-xl" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-security-card border-security-border">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400">Safe</p>
                          <p className="text-2xl font-bold text-risk-safe">
                            {statsLoading ? '...' : stats?.lowRisk || 0}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                          <CheckCircle className="text-risk-safe text-xl" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* File Upload Section */}
                  <div className="lg:col-span-2" data-upload-section>
                    <FileUpload onAnalysisComplete={handleAnalysisComplete} />
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-6">
                    <Card className="bg-security-card border-security-border">
                      <CardHeader>
                        <CardTitle className="text-white">Quick Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full bg-slate-700 border-slate-600 hover:bg-slate-600">
                          <Clock className="w-4 h-4 mr-2" />
                          View Recent
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full bg-slate-700 border-slate-600 hover:bg-slate-600"
                          onClick={handleExportAllReports}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Export Report
                        </Button>
                        <Button variant="outline" className="w-full bg-slate-700 border-slate-600 hover:bg-slate-600">
                          <Activity className="w-4 h-4 mr-2" />
                          Settings
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="bg-security-card border-security-border">
                      <CardHeader>
                        <CardTitle className="text-white">Analysis Stats</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">This Week</span>
                          <span className="text-sm font-medium text-white">
                            {statsLoading ? '...' : stats?.thisWeek || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">Avg. Processing</span>
                          <span className="text-sm font-medium text-white">2.3s</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-slate-400">Success Rate</span>
                          <span className="text-sm font-medium text-risk-safe">98.7%</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Recent Analyses Table */}
                <Card className="bg-security-card border-security-border">
                  <CardHeader>
                    <CardTitle className="text-white">Recent Analyses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-800/50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Risk Level
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                          {analysesLoading ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-4 text-center text-slate-400">
                                Loading recent analyses...
                              </td>
                            </tr>
                          ) : !recentAnalyses || recentAnalyses.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-6 py-4 text-center text-slate-400">
                                No analyses found. Upload an email file to get started.
                              </td>
                            </tr>
                          ) : (
                            recentAnalyses.map((analysis) => (
                              <tr 
                                key={analysis.id} 
                                className="hover:bg-slate-800/30 transition-colors"
                              >
                                <td className="px-6 py-4">
                                  <div>
                                    <div className="text-sm font-medium text-white">
                                      {analysis.emailSubject || 'No Subject'}
                                    </div>
                                    <div className="text-sm text-slate-400">
                                      {analysis.emailFrom || 'Unknown Sender'}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <Badge 
                                    variant="outline" 
                                    className={getRiskBadgeColor(analysis.riskLevel)}
                                  >
                                    {analysis.riskLevel} RISK
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-300">
                                  {formatDate(analysis.uploadedAt)}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                                      onClick={() => setSelectedAnalysis(analysis)}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-slate-400 hover:text-white hover:bg-slate-700"
                                      onClick={() => handleExport(analysis.id)}
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6" data-stats-section>
              <Card className="bg-security-card border-security-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Total Analyzed</p>
                      <p className="text-2xl font-bold text-white">
                        {statsLoading ? '...' : stats?.totalAnalyzed || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                      <Mail className="text-blue-400 text-xl" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-security-card border-security-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">High Risk</p>
                      <p className="text-2xl font-bold text-risk-danger">
                        {statsLoading ? '...' : stats?.highRisk || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="text-risk-danger text-xl" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-security-card border-security-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Medium Risk</p>
                      <p className="text-2xl font-bold text-risk-warning">
                        {statsLoading ? '...' : stats?.mediumRisk || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-amber-600/20 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="text-risk-warning text-xl" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-security-card border-security-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Safe</p>
                      <p className="text-2xl font-bold text-risk-safe">
                        {statsLoading ? '...' : stats?.lowRisk || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="text-risk-safe text-xl" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* File Upload Section */}
              <div className="lg:col-span-2" data-upload-section>
                <FileUpload onAnalysisComplete={handleAnalysisComplete} />
              </div>

              {/* Quick Actions */}
              <div className="space-y-6">
                <Card className="bg-security-card border-security-border">
                  <CardHeader>
                    <CardTitle className="text-white">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full bg-slate-700 border-slate-600 hover:bg-slate-600">
                      <Clock className="w-4 h-4 mr-2" />
                      View Recent
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full bg-slate-700 border-slate-600 hover:bg-slate-600"
                      onClick={handleExportAllReports}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Report
                    </Button>
                    <Button variant="outline" className="w-full bg-slate-700 border-slate-600 hover:bg-slate-600">
                      <Activity className="w-4 h-4 mr-2" />
                      Settings
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-security-card border-security-border">
                  <CardHeader>
                    <CardTitle className="text-white">Analysis Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">This Week</span>
                      <span className="text-sm font-medium text-white">
                        {statsLoading ? '...' : stats?.thisWeek || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Avg. Processing</span>
                      <span className="text-sm font-medium text-white">2.3s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">Success Rate</span>
                      <span className="text-sm font-medium text-risk-safe">98.7%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Analysis Results */}
            {selectedAnalysis && (
              <AnalysisResults analysis={selectedAnalysis} />
            )}

            {/* Recent Analyses Table */}
            <Card className="bg-security-card border-security-border">
              <CardHeader>
                <CardTitle className="text-white">Recent Analyses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Risk Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {analysesLoading ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-slate-400">
                            Loading recent analyses...
                          </td>
                        </tr>
                      ) : !recentAnalyses || recentAnalyses.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-center text-slate-400">
                            No analyses found. Upload an email file to get started.
                          </td>
                        </tr>
                      ) : (
                        recentAnalyses.map((analysis) => (
                          <tr 
                            key={analysis.id} 
                            className="hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div>
                                <div className="text-sm font-medium text-white">
                                  {analysis.emailSubject || 'No Subject'}
                                </div>
                                <div className="text-sm text-slate-400">
                                  {analysis.emailFrom || 'Unknown Sender'}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge 
                                variant="outline" 
                                className={getRiskBadgeColor(analysis.riskLevel)}
                              >
                                {analysis.riskLevel} RISK
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-300">
                              {formatDate(analysis.uploadedAt)}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10"
                                  onClick={() => setSelectedAnalysis(analysis)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-slate-400 hover:text-white hover:bg-slate-700"
                                  onClick={() => handleExport(analysis.id)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
              </>
            )}
            
            {/* Analysis Results - shown in both views */}
            {selectedAnalysis && (
              <AnalysisResults analysis={selectedAnalysis} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
