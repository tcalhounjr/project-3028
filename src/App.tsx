import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingDown,
  TrendingUp,
  Download,
  Share2,
  Sparkles,
  ChevronRight,
  ArrowDown,
  ArrowUp,
  Map as MapIcon,
  Newspaper,
  Gavel,
  Users,
  Vote,
  ShieldAlert,
  MessageSquare,
  Activity,
  ArrowLeftRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar, TopBar, StatusBadge, ScoreDisplay, cn } from './components/Layout';
import { MOCK_COUNTRIES } from './mockData';
import GlobalOverviewPage from './pages/GlobalOverview';
import CountryPageRoute from './pages/CountryPage';
import type { DataJson } from './types/country';

// ---------------------------------------------------------------------------
// CountryData — prototype-only shape used by LegacyAppContent and its children.
// The canonical data shape is CountryData in src/types/country.ts (snake_case).
// ---------------------------------------------------------------------------
export interface CountryData {
  name: string;
  isoCode: string;
  currentScore: number;
  status: 'Stable' | 'Elevated' | 'Critical';
  indicators: {
    mediaFreedom: number;
    judicialIndependence: number;
    civilSociety: number;
    electionQuality: number;
    executiveConstraints: number;
    rhetoricRadar: number;
    civicProtests: number;
  };
  history: { year: number; score: number }[];
  events: { date: string; title: string; description: string; type: 'legal' | 'political' | 'protest' }[];
}

// ---------------------------------------------------------------------------
// DataContext — named export consumed by Sprint 2 pages (GlobalOverview.tsx,
// CountryPage.tsx) via useContext(DataContext).
// Null until the fetch from public/data.json resolves.
// ---------------------------------------------------------------------------

export const DataContext = createContext<DataJson | null>(null);

// --- Sub-components ---

const IndicatorCard = ({ label, value, icon: Icon, color }: { label: string, value: number, icon: any, color: string }) => {
  const delta = Math.floor(Math.random() * 10) - 5;
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg group hover:bg-slate-100 transition-all border border-slate-100">
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-white shadow-sm", color)}>
          <Icon size={18} />
        </div>
        <span className="text-sm font-semibold text-slate-700">{label}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className="text-sm font-bold text-navy-900">{value}/100</span>
        <span className={cn("text-[10px] font-bold", delta < 0 ? "text-red-600" : "text-emerald-600")}>
          {delta < 0 ? <TrendingDown size={10} className="inline mr-1" /> : <TrendingUp size={10} className="inline mr-1" />}
          {Math.abs(delta)}%
        </span>
      </div>
    </div>
  );
};

const EventItem = ({ event }: { event: any }) => {
  const icons = {
    legal: Gavel,
    political: ShieldAlert,
    protest: Users
  };
  const Icon = icons[event.type as keyof typeof icons] || Activity;

  return (
    <div className="relative pl-8 pb-8 last:pb-0">
      <div className="absolute left-0 top-1 w-6 h-6 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center z-10">
        <Icon size={12} className="text-navy-900" />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{event.date}</span>
        <h4 className="text-sm font-bold text-navy-900">{event.title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed">{event.description}</p>
      </div>
    </div>
  );
};

// --- Main Screens ---

const GlobalOverview = ({ onSelectCountry }: { onSelectCountry: (c: CountryData) => void }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-12 gap-8">
        {/* Stats Summary */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Global Status</p>
            <h2 className="text-4xl font-black text-navy-900 tracking-tighter mb-4">Elevated</h2>
            <div className="space-y-4">
              {[
                { label: 'Total Critical', count: 12, color: 'bg-red-100 text-red-700' },
                { label: 'Total Elevated', count: 34, color: 'bg-amber-100 text-amber-700' },
                { label: 'Total Stable', count: 82, color: 'bg-slate-100 text-slate-700' },
              ].map((stat) => (
                <div key={stat.label} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                  <span className="text-xs font-medium text-slate-500">{stat.label}</span>
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", stat.color)}>{stat.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-navy-900 text-white p-6 rounded-xl relative overflow-hidden group cursor-pointer">
            <div className="relative z-10">
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mb-1">Intelligence Report</p>
              <h3 className="text-lg font-bold leading-tight mb-4 font-manrope">Erosive trends in Southeast Asia's maritime states.</h3>
              <button className="text-xs font-bold underline underline-offset-4 decoration-2 hover:opacity-80 transition-opacity">Read Full Dossier</button>
            </div>
            <Activity className="absolute -right-4 -bottom-4 text-white/10 w-24 h-24 group-hover:scale-110 transition-transform duration-500" />
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="col-span-12 lg:col-span-9 bg-slate-200 rounded-xl relative overflow-hidden h-[450px] border border-slate-200 shadow-inner">
          <img
            src="https://picsum.photos/seed/worldmap/1200/600?grayscale"
            alt="World Map"
            className="w-full h-full object-cover opacity-40 mix-blend-multiply"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <MapIcon className="mx-auto text-navy-900/20" size={48} />
              <p className="text-xs font-bold text-navy-900/40 uppercase tracking-widest">Interactive Map Layer Loading...</p>
            </div>
          </div>

          <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur p-4 rounded-lg border border-slate-200 shadow-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Stress Index Legend</p>
            <div className="flex items-center gap-6">
              {[
                { label: 'Stable', color: 'bg-slate-400' },
                { label: 'Elevated', color: 'bg-amber-500' },
                { label: 'Critical', color: 'bg-red-600' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", item.color)} />
                  <span className="text-[10px] font-bold text-slate-600 uppercase">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* List and Movers */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <h3 className="text-xl font-bold text-navy-900 font-manrope">Top Movers</h3>
          <div className="space-y-3">
            {MOCK_COUNTRIES.sort((a, b) => b.currentScore - a.currentScore).slice(0, 4).map((country, idx) => (
              <button
                key={country.isoCode}
                onClick={() => onSelectCountry(country)}
                className="w-full p-4 bg-white rounded-xl flex items-center justify-between border border-slate-100 hover:border-navy-900/20 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center font-bold text-slate-400 group-hover:text-navy-900 transition-colors">{idx + 1}</div>
                  <div className="text-left">
                    <p className="font-bold text-navy-900">{country.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{country.isoCode}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-sm font-bold", country.status === 'Critical' ? "text-red-600" : "text-amber-600")}>
                    {country.status === 'Critical' ? '+' : ''}{Math.floor(Math.random() * 10) + 2}%
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Stress Growth</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-navy-900 font-manrope">Full Index Archive</h3>
            <button className="text-xs font-bold text-navy-900 flex items-center gap-2 hover:opacity-70">
              <Download size={14} /> Export Data
            </button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Country</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Score</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_COUNTRIES.map((country) => (
                  <tr key={country.isoCode} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://flagcdn.com/w40/${country.isoCode.toLowerCase().slice(0, 2)}.png`}
                          alt={country.name}
                          className="w-6 h-4 object-cover rounded-sm shadow-sm"
                          onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/24x16')}
                        />
                        <span className="font-bold text-sm text-navy-900">{country.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-bold text-navy-900">{country.currentScore}</span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={country.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => onSelectCountry(country)}
                        className="text-slate-400 hover:text-navy-900 transition-colors"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const CountryDetail = ({ country, onBack }: { country: CountryData, onBack: () => void }) => {
  // AI narrative summary — served by the mock aiInsightsService in the real Sprint 2 flow.
  // In this legacy prototype the summary is derived statically from country data;
  // no API key or external service is required.
  const summary =
    country.status === 'Critical'
      ? `Democratic stress: Critical and deteriorating due to compounding institutional pressures in ${country.name}. Judicial independence and media freedom indicators have declined sharply. Continued erosion of executive constraints represents the highest-confidence risk signal.`
      : `Democratic stress: ${country.status} with mixed institutional signals in ${country.name}. Core indicators remain within monitored thresholds. Ongoing civil society activity provides a partial stabilizing counterweight.`;

  const radarData = [
    { subject: 'Media', A: country.indicators.mediaFreedom, fullMark: 100 },
    { subject: 'Judiciary', A: country.indicators.judicialIndependence, fullMark: 100 },
    { subject: 'Civil Society', A: country.indicators.civilSociety, fullMark: 100 },
    { subject: 'Elections', A: country.indicators.electionQuality, fullMark: 100 },
    { subject: 'Executive', A: country.indicators.executiveConstraints, fullMark: 100 },
    { subject: 'Rhetoric', A: country.indicators.rhetoricRadar, fullMark: 100 },
  ];

  return (
    <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-navy-900 transition-colors uppercase tracking-widest">
            <ChevronRight size={14} className="rotate-180" /> Back to Overview
          </button>
          <div className="flex items-center gap-6">
            <img
              src={`https://flagcdn.com/w80/${country.isoCode.toLowerCase().slice(0, 2)}.png`}
              alt={country.name}
              className="w-16 h-10 object-cover rounded shadow-md"
              onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/64x40')}
            />
            <h1 className="text-5xl md:text-6xl font-black font-manrope tracking-tight text-navy-900">{country.name}</h1>
          </div>
        </div>
        <ScoreDisplay score={country.currentScore} status={country.status} />
      </header>

      {/* AI Narrative & Actions */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10 flex gap-6">
            <div className="shrink-0 w-12 h-12 bg-navy-900 rounded-lg flex items-center justify-center text-white shadow-lg">
              <Sparkles size={24} />
            </div>
            <div className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AI Narrative Summary</h3>
              <p className="text-xl font-medium leading-relaxed text-navy-900">
                {summary}
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-navy-900/5 to-transparent rounded-bl-full" />
        </div>
        <div className="lg:col-span-4 flex flex-col gap-3">
          <button className="flex-1 flex items-center justify-center gap-3 bg-navy-900 text-white font-bold py-4 px-6 rounded hover:bg-navy-800 transition-all active:scale-[0.98] shadow-md">
            <ArrowLeftRight size={20} /> Compare with Neighbor
          </button>
          <button className="flex-1 flex items-center justify-center gap-3 border-2 border-navy-900 text-navy-900 font-bold py-4 px-6 rounded hover:bg-navy-900/5 transition-all">
            <Download size={20} /> Download Full Report
          </button>
        </div>
      </section>

      {/* Timeline Chart */}
      <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold font-manrope text-navy-900">15-Year Stress Trajectory</h2>
          <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-100 border border-red-200 rounded-sm" /> Danger</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-amber-100 border border-amber-200 rounded-sm" /> Watch</div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 bg-slate-100 border border-slate-200 rounded-sm" /> Safe</div>
          </div>
        </div>

        <div className="h-80 w-full relative">
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1 bg-red-50/30 border-b border-red-100/50 relative">
              <span className="absolute top-2 left-2 text-[8px] font-bold text-red-700/30 uppercase">Danger Zone (0-40)</span>
            </div>
            <div className="flex-1 bg-amber-50/30 border-b border-amber-100/50 relative">
              <span className="absolute top-2 left-2 text-[8px] font-bold text-amber-700/30 uppercase">Watch Zone (40-70)</span>
            </div>
            <div className="flex-1 bg-slate-50/30 relative">
              <span className="absolute top-2 left-2 text-[8px] font-bold text-slate-700/30 uppercase">Stable Zone (70-100)</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={country.history}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="year"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                dy={10}
              />
              <YAxis
                domain={[0, 100]}
                hide
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                labelStyle={{ fontWeight: 800, color: '#1A237E' }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#1A237E"
                strokeWidth={4}
                dot={{ r: 6, fill: '#1A237E', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Indicators and Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-8">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold font-manrope text-navy-900">Indicator Breakdown</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">1-Year Delta</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                  <Radar
                    name="Score"
                    dataKey="A"
                    stroke="#1A237E"
                    fill="#1A237E"
                    fillOpacity={0.1}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              <IndicatorCard label="Media Freedom" value={country.indicators.mediaFreedom} icon={Newspaper} color="text-blue-600" />
              <IndicatorCard label="Judicial Independence" value={country.indicators.judicialIndependence} icon={Gavel} color="text-indigo-600" />
              <IndicatorCard label="Civil Society" value={country.indicators.civilSociety} icon={Users} color="text-violet-600" />
              <IndicatorCard label="Election Quality" value={country.indicators.electionQuality} icon={Vote} color="text-emerald-600" />
            </div>
          </div>
        </section>

        <section className="bg-slate-50 p-8 rounded-xl border border-slate-200 space-y-8">
          <h3 className="text-xl font-bold font-manrope text-navy-900">Events Timeline</h3>
          <div className="relative">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-200" />
            <div className="space-y-2">
              {country.events.map((event, idx) => (
                <EventItem key={idx} event={event} />
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Rhetoric Widget */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-12">
        <div className="md:col-span-4 bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-64">
          <div>
            <h3 className="text-lg font-bold font-manrope text-navy-900">Rhetoric Radar</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hostile political discourse frequency (%)</p>
          </div>
          <div className="h-24 w-full flex items-end gap-1">
            {[20, 35, 45, 60, 85, 70].map((h, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 rounded-t-sm transition-all duration-500",
                  i >= 4 ? "bg-red-400" : "bg-navy-900/10"
                )}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
            <span className="text-2xl font-black text-navy-900">{country.indicators.rhetoricRadar}%</span>
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Historical High</span>
          </div>
        </div>

        <div className="md:col-span-8 bg-navy-900 text-white p-8 rounded-xl shadow-lg flex flex-col md:flex-row gap-8 relative overflow-hidden">
          <div className="flex-1 space-y-4 relative z-10">
            <h3 className="text-lg font-bold font-manrope">Comparative Pulse</h3>
            <p className="text-sm opacity-80 leading-relaxed">
              {country.name}'s current trajectory closely mirrors historical patterns observed in regions undergoing rapid institutional capture.
              The simultaneous decline in judicial oversight and media independence is a high-confidence indicator of democratic stress.
            </p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{country.name} (Now)</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <span className="w-2 h-2 rounded-full bg-white" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Regional Avg</span>
              </div>
            </div>
          </div>
          <div className="w-full md:w-48 bg-white/10 rounded-lg flex items-center justify-center border border-white/10 backdrop-blur-sm">
            <div className="text-center p-4">
              <MapIcon className="mx-auto text-white/40 mb-2" size={32} />
              <p className="text-[10px] font-bold uppercase tracking-widest">Regional Context</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// ---------------------------------------------------------------------------
// LegacyAppContent — Sprint 1 tab-based shell.
// Rendered on the "/" route so existing App.test.tsx assertions continue to pass.
// ---------------------------------------------------------------------------

function LegacyAppContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);

  const handleSelectCountry = (country: CountryData) => {
    setSelectedCountry(country);
    setActiveTab('country-detail');
  };

  const handleBack = () => {
    setSelectedCountry(null);
    setActiveTab('overview');
  };

  return (
    <div className="flex min-h-screen bg-[#f9f9f9]">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 ml-64 min-h-screen">
        <TopBar
          title={activeTab === 'country-detail' ? 'Democratic Stress' : 'Global Overview'}
          subtitle={activeTab === 'country-detail' ? selectedCountry?.name : 'Institutional Archive'}
        />

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <GlobalOverview onSelectCountry={handleSelectCountry} />
              </motion.div>
            )}

            {activeTab === 'country-detail' && selectedCountry && (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CountryDetail country={selectedCountry} onBack={handleBack} />
              </motion.div>
            )}

            {(activeTab === 'compare' || activeTab === 'reports') && (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-[60vh] text-slate-400"
              >
                <Activity size={48} className="mb-4 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">Module Under Development</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="p-8 mt-12 border-t border-slate-200">
          <div className="max-w-4xl">
            <p className="text-xs text-slate-500 leading-relaxed">
              The <span className="font-bold text-navy-900">Democratic Stress Index (DSI)</span> utilizes 142 distinct institutional parameters to calculate real-time pressure on sovereign democratic frameworks. This dashboard reflects data archived as of <span className="font-mono bg-slate-100 px-1 rounded">2024-Q1</span>. For methodological inquiries, please contact the <span className="underline underline-offset-4 decoration-navy-900/30 font-medium text-navy-900">Analytics Bureau</span>.
            </p>
          </div>
        </footer>
      </main>

      {/* Floating Action Button */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-navy-900 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
        <Share2 size={24} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App — root component.
// Fetches public/data.json and provides it via DataContext.
// BrowserRouter routes:
//   /               → Sprint 1 legacy monolith (LegacyAppContent)
//   /country/:iso   → Sprint 2 CountryPage
// ---------------------------------------------------------------------------

export default function App() {
  const [data, setData] = useState<DataJson | null>(null);

  useEffect(() => {
    fetch('/data.json')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<DataJson>;
      })
      .then((json) => setData(json))
      .catch(() => {
        // Data load failure is non-fatal; Sprint 2 pages handle null DataContext gracefully.
      });
  }, []);

  return (
    <BrowserRouter>
      <DataContext.Provider value={data}>
        <Routes>
          <Route path="/" element={<LegacyAppContent />} />
          <Route path="/country/:iso" element={<CountryPageRoute />} />
        </Routes>
      </DataContext.Provider>
    </BrowserRouter>
  );
}
