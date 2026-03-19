import React from 'react';
import { 
  LayoutDashboard, 
  Flag, 
  ArrowLeftRight, 
  FileText, 
  Settings, 
  HelpCircle,
  Search,
  Bell,
  Download,
  Share2,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  Activity,
  ChevronRight,
  Menu,
  X,
  Plus
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- UI Components ---

export const Sidebar = ({ activeTab, onTabChange }: { activeTab: string, onTabChange: (tab: string) => void }) => {
  const navItems = [
    { id: 'overview', label: 'Global Overview', icon: LayoutDashboard },
    { id: 'countries', label: 'Countries', icon: Flag },
    { id: 'compare', label: 'Compare', icon: ArrowLeftRight },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-100 border-r border-slate-200 flex flex-col p-4 z-40">
      <div className="mb-10 px-2">
        <h1 className="text-lg font-black text-navy-900 uppercase tracking-widest font-manrope">Democracy Index</h1>
        <p className="text-[10px] text-slate-500 font-inter mt-1">Institutional Archive</p>
      </div>
      
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group",
              activeTab === item.id 
                ? "bg-white text-navy-900 font-bold shadow-sm" 
                : "text-slate-600 hover:text-navy-900 hover:bg-slate-200/50"
            )}
          >
            <item.icon size={20} className={cn(activeTab === item.id ? "text-navy-900" : "text-slate-400 group-hover:text-navy-900")} />
            <span className="text-sm font-manrope">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-4 space-y-1 border-t border-slate-200">
        <button className="w-full bg-navy-900 text-white py-2.5 px-4 rounded font-bold text-sm mb-4 hover:bg-navy-800 transition-colors">
          Generate Report
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-navy-900 text-sm transition-colors">
          <Settings size={18} />
          <span>Settings</span>
        </button>
        <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-600 hover:text-navy-900 text-sm transition-colors">
          <HelpCircle size={18} />
          <span>Help</span>
        </button>
      </div>
    </aside>
  );
};

export const TopBar = ({ title, subtitle }: { title: string, subtitle?: string }) => {
  return (
    <header className="sticky top-0 z-30 flex justify-between items-center w-full px-8 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-bold tracking-tight text-navy-900 font-manrope">{title}</h2>
        {subtitle && (
          <>
            <div className="h-6 w-px bg-slate-200 mx-2" />
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">{subtitle}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search countries or regions..." 
            className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-navy-900/20"
          />
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-slate-400 hover:text-navy-900 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-critical rounded-full border-2 border-white" />
          </button>
          <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-200">
            <img 
              src="https://picsum.photos/seed/analyst/100/100" 
              alt="User" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export const StatusBadge = ({ status }: { status: 'Stable' | 'Elevated' | 'Critical' }) => {
  const styles = {
    Stable: "bg-slate-100 text-slate-600 border-slate-200",
    Elevated: "bg-amber-50 text-amber-700 border-amber-200",
    Critical: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
      styles[status]
    )}>
      {status}
    </span>
  );
};

export const ScoreDisplay = ({ score, status, label = "Current Stress Score" }: { score: number, status: string, label?: string }) => {
  return (
    <div className="flex flex-col items-start md:items-end gap-1">
      <span className="text-[10px] font-bold tracking-widest uppercase text-slate-500">{label}</span>
      <div className="flex items-center gap-4">
        <span className="text-6xl font-black font-manrope leading-none text-navy-900">{score}</span>
        <div className={cn(
          "px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2",
          status === 'Critical' ? "bg-red-100 text-red-700" : 
          status === 'Elevated' ? "bg-amber-100 text-amber-700" : 
          "bg-slate-100 text-slate-700"
        )}>
          <span className={cn(
            "w-2 h-2 rounded-full",
            status === 'Critical' ? "bg-red-600" : 
            status === 'Elevated' ? "bg-amber-600" : 
            "bg-slate-600"
          )} />
          {status} Risk
        </div>
      </div>
    </div>
  );
};
