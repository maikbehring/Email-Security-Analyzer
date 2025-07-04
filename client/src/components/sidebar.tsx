import { Shield, Home, Mail, Clock, BarChart3, Settings, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const menuItems = [
    { icon: Home, label: "Dashboard", active: true },
    { icon: Mail, label: "New Analysis", active: false },
    { icon: Clock, label: "History", active: false },
    { icon: BarChart3, label: "Reports", active: false },
    { icon: Settings, label: "Settings", active: false },
  ];

  return (
    <div className="w-64 bg-security-card border-r border-security-border flex-shrink-0 flex flex-col">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white">EmailSec</h1>
            <p className="text-xs text-slate-400">Security Analyzer</p>
          </div>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Button
                key={index}
                variant={item.active ? "default" : "ghost"}
                className={`w-full justify-start ${
                  item.active 
                    ? "bg-blue-600/20 text-blue-400 border border-blue-600/30 hover:bg-blue-600/30" 
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="text-sm font-medium">{item.label}</span>
              </Button>
            );
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-6">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-risk-safe rounded-full"></div>
            <span className="text-xs text-slate-300">System Status: Online</span>
          </div>
          <div className="text-xs text-slate-400">
            API Quota: 847/1000
          </div>
        </div>
      </div>
    </div>
  );
}
