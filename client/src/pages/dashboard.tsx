import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { FileUpload } from "@/components/file-upload";
import { AnalysisResults } from "@/components/analysis-results";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Mail, 
  Download,
  Eye,
  Clock,
  TrendingUp,
  Activity
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

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ['/api/stats'],
  });

  const { data: recentAnalyses, isLoading: analysesLoading } = useQuery<EmailAnalysis[]>({
    queryKey: ['/api/analyses/recent'],
  });

  const handleAnalysisComplete = (result: any) => {
    setSelectedAnalysis(result);
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
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-${analysisId}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportAllReports = async () => {
    try {
      if (!recentAnalyses || recentAnalyses.length === 0) {
        alert('No analyses available to export');
        return;
      }

      // Create a comprehensive report with all analyses and statistics
      const reportData = {
        generatedAt: new Date().toISOString(),
        summary: {
          totalAnalyses: stats?.totalAnalyzed || 0,
          riskDistribution: {
            high: stats?.highRisk || 0,
            medium: stats?.mediumRisk || 0,
            low: stats?.lowRisk || 0
          },
          thisWeekCount: stats?.thisWeek || 0
        },
        analyses: recentAnalyses.map(analysis => ({
          id: analysis.id,
          fileName: analysis.fileName,
          uploadedAt: analysis.uploadedAt,
          sender: analysis.emailFrom,
          subject: analysis.emailSubject,
          riskLevel: analysis.riskLevel,
          confidence: analysis.confidence,
          assessment: analysis.aiAssessment,
          recommendations: analysis.recommendations,
          authentication: {
            spf: analysis.spfResult,
            dkim: analysis.dkimResult,
            dmarc: analysis.dmarcResult
          },
          extractedLinks: analysis.extractedLinks,
          attachments: analysis.attachments
        }))
      };

      // Create and download the file
      const jsonString = JSON.stringify(reportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email-security-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export all reports failed:', error);
      alert('Failed to export reports');
    }
  };

  return (
    <div className="flex min-h-screen bg-security-dark text-slate-100">
      <Sidebar />
      
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <div className="lg:col-span-2">
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
                                  onClick={() => setSelectedAnalysis({ analysis })}
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
          </div>
        </main>
      </div>
    </div>
  );
}
