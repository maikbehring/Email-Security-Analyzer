import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, CloudUpload, FileText, X, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface FileUploadProps {
  onAnalysisComplete: (result: any) => void;
}

export function FileUpload({ onAnalysisComplete }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('emailFile', file);
      
      const response = await apiRequest('POST', '/api/analyze', formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Analysis Complete",
        description: `Email analyzed with ${data.aiResult.riskLevel} risk level`,
      });
      onAnalysisComplete(data);
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/analyses/recent'] });
      setSelectedFile(null);
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze email file",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    const allowedExtensions = ['.eml', '.msg', '.txt'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please select an .eml, .msg, or .txt file",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="bg-security-card border-security-border">
      <CardHeader className="border-b border-security-border">
        <CardTitle className="text-white flex items-center">
          <Upload className="mr-3 text-blue-400" />
          Email Analysis
        </CardTitle>
        <p className="text-sm text-slate-400">Upload an email file (.eml, .msg, .txt) for security analysis</p>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* File Drop Zone */}
        <div
          className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center file-upload-zone cursor-pointer"
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={handleUploadClick}
        >
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <CloudUpload className="text-2xl text-slate-400" />
          </div>
          <h4 className="text-lg font-medium text-white mb-2">Drop your email file here</h4>
          <p className="text-sm text-slate-400 mb-4">or click to browse files</p>
          <div className="flex justify-center space-x-4 text-xs text-slate-500">
            <span>.eml</span>
            <span>.msg</span>
            <span>.txt</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".eml,.msg,.txt"
            onChange={handleFileInputChange}
          />
        </div>
        
        {/* Uploaded File Info */}
        {selectedFile && (
          <div className="mt-6 bg-slate-800/50 rounded-lg p-4 border border-slate-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <FileText className="text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{selectedFile.name}</p>
                  <p className="text-xs text-slate-400">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-slate-400 hover:text-white hover:bg-slate-700"
                onClick={removeFile}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
        
        <div className="mt-6">
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleAnalyze}
            disabled={!selectedFile || uploadMutation.isPending}
          >
            {uploadMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Start Analysis
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
