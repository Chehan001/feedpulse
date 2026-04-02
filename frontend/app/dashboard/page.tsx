'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Trash2, Search, Filter, RefreshCcw, ShieldAlert, CheckCircle, AlertTriangle,
  Info, ChevronLeft, ChevronRight as ChevronRightIcon, BarChart3, Clock, LogOut, Loader2, Sparkles, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface Feedback {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: 'New' | 'In Review' | 'Resolved';
  submitterName?: string;
  submitterEmail?: string;
  ai_category?: string;
  ai_sentiment?: 'Positive' | 'Neutral' | 'Negative';
  ai_priority?: number;
  ai_summary?: string;
  ai_tags?: string[];
  ai_processed: boolean;
  createdAt: string;
}

interface Stats {
  totalItems: number;
  openItems: number;
  avgPriority: number;
  aiThemes?: { theme: string; description: string; sentiment: string; occurrence: number }[];
}

// Badges
const PriorityBadge = ({ score }: { score: number }) => {
  const isCritical = score >= 8;
  const isHigh = score >= 6;
  const isMedium = score >= 4;
  const colorClass = isCritical ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                    isHigh ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                    isMedium ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

  return (
    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-black border flex items-center gap-1 shadow-sm", colorClass)}>
      {isCritical ? <ShieldAlert className="h-3 w-3" /> : <Zap className="h-3 w-3" />}
      P{score}
    </span>
  );
};

const SentimentBadge = ({ sentiment }: { sentiment: string }) => {
  const colorClass = sentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                     sentiment === 'Negative' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                     'bg-slate-500/10 text-slate-400 border-slate-500/20';
                     
  return (
    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider", colorClass)}>
      {sentiment}
    </span>
  );
};

const StatusBadge = ({ status }: { status: Feedback['status'] }) => {
  const colors = {
    'New': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    'In Review': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Resolved': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider shadow-sm", colors[status])}>
      {status}
    </span>
  );
};

// Main Component
export default function AdminDashboard() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingThemes, setIsGeneratingThemes] = useState(false);
  const [isRetriggering, setIsRetriggering] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/login');
      return null;
    }
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  }, [router]);

  const fetchData = useCallback(async (generateTheme = false) => {
    const headers = getHeaders();
    if (!headers) return;

    if (generateTheme) setIsGeneratingThemes(true);
    else setIsLoading(true);

    try {
      const query = new URLSearchParams({ category: filterCategory, status: filterStatus, search: searchQuery, page: page.toString(), limit: '10' });
      const [listRes, statsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/feedback?${query}`, { headers }),
        fetch(`http://localhost:5000/api/feedback/summary?generateTheme=${generateTheme}`, { headers })
      ]);

      const listData = await listRes.json();
      const statsData = await statsRes.json();

      if (listData.success) {
        setFeedback(listData.data);
        setTotalPages(listData.pagination.pages);
      }
      if (statsData.success) setStats(statsData.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsGeneratingThemes(false);
    }
  }, [filterCategory, filterStatus, searchQuery, page, getHeaders]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const updateStatus = async (id: string, status: string) => {
    const headers = getHeaders();
    if (!headers) return;
    try {
      const res = await fetch(`http://localhost:5000/api/feedback/${id}`, { method: 'PATCH', headers, body: JSON.stringify({ status }) });
      const data = await res.json();
      if (data.success) {
        setFeedback(prev => prev.map(f => f._id === id ? { ...f, status: status as any } : f));
        if (selectedFeedback?._id === id) setSelectedFeedback(prev => prev ? { ...prev, status: status as any } : null);
      }
    } catch (err) {}
  };

  const reanalyzeItem = async (id: string) => {
    const headers = getHeaders();
    if (!headers) return;
    setIsRetriggering(true);
    try {
      const res = await fetch(`http://localhost:5000/api/feedback/${id}/reanalyze`, { method: 'POST', headers });
      const data = await res.json();
      if (data.success) {
        setFeedback(prev => prev.map(f => f._id === id ? data.data : f));
        if (selectedFeedback?._id === id) setSelectedFeedback(data.data);
      } else {
        alert("AI re-analysis failed.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRetriggering(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Permanent delete?')) return;
    const headers = getHeaders();
    if (!headers) return;
    try {
      const res = await fetch(`http://localhost:5000/api/feedback/${id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (data.success) {
        setFeedback(prev => prev.filter(f => f._id !== id));
        if (selectedFeedback?._id === id) setSelectedFeedback(null);
      }
    } catch (err) {}
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/login');
  };

  return (
    <main className="min-h-screen flex flex-col font-sans selection:bg-indigo-500/30">
      <nav className="border-b border-border bg-background/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20 text-indigo-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Feed<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Pulse</span> Admin</h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 py-2 px-4 rounded-xl transition-all border border-zinc-800 uppercase tracking-wider">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 md:p-8 w-full flex-1 flex flex-col gap-8">
        
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/50 backdrop-blur-lg p-6 rounded-3xl border border-zinc-800 shadow-xl flex items-center gap-4 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0">
               <MessageSquare className="h-6 w-6" />
             </div>
             <div>
               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total</p>
               <p className="text-3xl font-black">{stats?.totalItems || 0}</p>
             </div>
          </div>
          <div className="bg-zinc-900/50 backdrop-blur-lg p-6 rounded-3xl border border-zinc-800 shadow-xl flex items-center gap-4 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="h-14 w-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 shrink-0">
               <Clock className="h-6 w-6" />
             </div>
             <div>
               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Pending</p>
               <p className="text-3xl font-black">{stats?.openItems || 0}</p>
             </div>
          </div>
          <div className="bg-zinc-900/50 backdrop-blur-lg p-6 rounded-3xl border border-zinc-800 shadow-xl flex items-center gap-4 relative overflow-hidden group">
             <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="h-14 w-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-400 border border-rose-500/20 shrink-0">
               <ShieldAlert className="h-6 w-6" />
             </div>
             <div>
               <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Avg Priority</p>
               <p className="text-3xl font-black">{stats?.avgPriority ? stats.avgPriority.toFixed(1) : '0.0'}<span className="text-sm opacity-50">/10</span></p>
             </div>
          </div>
          
          {/* Generate Themes Button */}
          <div className="bg-zinc-900/50 backdrop-blur-lg p-6 rounded-3xl border border-zinc-800 shadow-xl flex flex-col justify-center items-center gap-2 relative overflow-hidden group">
            <button 
              onClick={() => fetchData(true)}
              disabled={isGeneratingThemes}
              className="w-full flex-1 rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/40 hover:to-purple-500/40 border border-indigo-500/30 text-indigo-300 font-bold flex flex-col items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isGeneratingThemes ? <Loader2 className="h-6 w-6 animate-spin" /> : <Sparkles className="h-6 w-6" />}
              <span className="text-xs uppercase tracking-wider">Generate Themes</span>
            </button>
          </div>
        </div>

        {/* Dynamic AI Themes Area */}
        <AnimatePresence>
          {stats?.aiThemes && stats.aiThemes.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-zinc-900/80 border border-purple-500/30 rounded-3xl p-6 shadow-2xl shadow-purple-500/5 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="text-purple-400 h-5 w-5" />
                <h3 className="font-bold uppercase tracking-widest text-sm text-purple-200">AI Discovered Themes (Last 7 Days)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.aiThemes.map((theme, idx) => (
                  <div key={idx} className="bg-zinc-950/50 rounded-2xl border border-zinc-800 p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-black text-indigo-300 text-lg">{theme.theme}</h4>
                        <span className="bg-zinc-800 px-2 py-1 rounded text-[10px] font-bold text-zinc-400 border border-zinc-700">x{theme.occurrence}</span>
                      </div>
                      <p className="text-sm font-medium text-zinc-400">{theme.description}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-zinc-800/50">
                      <SentimentBadge sentiment={theme.sentiment} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 bg-zinc-900/30 p-2 rounded-2xl border border-zinc-800/50">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              placeholder="Search feedback..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-12 pr-4 py-3 bg-zinc-950/50 rounded-xl border border-transparent focus:border-zinc-700 text-sm font-medium outline-none transition-all placeholder:text-zinc-600"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
              className="px-4 py-3 bg-zinc-950/50 rounded-xl border border-transparent focus:border-zinc-700 text-sm font-bold outline-none transition-all cursor-pointer min-w-[140px] appearance-none"
            >
              <option value="All">All Categories</option>
              <option value="Bug">Bugs</option>
              <option value="Feature Request">Features</option>
              <option value="Improvement">Improvements</option>
              <option value="Other">Other</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
              className="px-4 py-3 bg-zinc-950/50 rounded-xl border border-transparent focus:border-zinc-700 text-sm font-bold outline-none transition-all cursor-pointer min-w-[140px] appearance-none"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="In Review">In Review</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
          
          {/* List Area */}
          <div className="lg:col-span-5 xl:col-span-4 border border-zinc-800 rounded-3xl bg-zinc-900/50 backdrop-blur-xl flex flex-col h-[600px] overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Submissions Queue</span>
              <button onClick={() => fetchData()} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 group">
                <RefreshCcw className={cn("h-4 w-4 group-hover:text-white transition-colors", isLoading && "animate-spin")} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar divide-y divide-zinc-800/50">
              <AnimatePresence>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-6 animate-pulse space-y-3">
                      <div className="h-6 bg-zinc-800 rounded-md w-3/4" />
                      <div className="h-4 bg-zinc-800 rounded-md w-1/2" />
                    </div>
                  ))
                ) : feedback.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center gap-4 text-zinc-600">
                     <Info className="h-10 w-10 opacity-20" />
                     <p className="text-sm font-bold">No feedback matches your criteria.</p>
                  </div>
                ) : (
                  feedback.map((item) => (
                    <motion.div 
                      key={item._id} layoutId={`card-${item._id}`} onClick={() => setSelectedFeedback(item)}
                      className={cn(
                        "p-5 cursor-pointer hover:bg-zinc-800/50 transition-all border-l-4 relative group",
                        selectedFeedback?._id === item._id ? "bg-zinc-800/80 border-l-indigo-500 shadow-inner" : "border-l-transparent bg-transparent"
                      )}
                    >
                      <div className="flex gap-2 mb-3 flex-wrap">
                        <StatusBadge status={item.status} />
                        {item.ai_processed && (
                          <>
                            <PriorityBadge score={item.ai_priority || 0} />
                            {item.ai_sentiment && <SentimentBadge sentiment={item.ai_sentiment} />}
                          </>
                        )}
                      </div>
                      <h3 className="font-bold text-sm tracking-tight leading-snug line-clamp-2 mb-3 mt-1 group-hover:text-indigo-300 transition-colors">{item.title}</h3>
                      <div className="flex justify-between items-center mt-auto">
                         <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider bg-zinc-950/80 px-2 py-1 rounded-md border border-zinc-800">{item.category}</span>
                         <span className="text-[10px] font-bold text-zinc-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            <div className="p-3 border-t border-zinc-800 bg-zinc-950/50 flex flex-col justify-center items-center relative">
               <div className="flex items-center gap-4">
                 <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 disabled:opacity-30 hover:bg-zinc-800 rounded-md bg-zinc-900 border border-zinc-800 shadow-sm"><ChevronLeft className="h-4 w-4" /></button>
                 <span className="text-[10px] uppercase font-black tracking-widest text-zinc-500 bg-zinc-900 px-3 py-1.5 rounded-md border border-zinc-800">Pg {page} / {totalPages}</span>
                 <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 disabled:opacity-30 hover:bg-zinc-800 rounded-md bg-zinc-900 border border-zinc-800 shadow-sm"><ChevronRightIcon className="h-4 w-4" /></button>
               </div>
            </div>
          </div>

          {/* Details Area */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col h-[600px]">
            <AnimatePresence mode="wait">
              {selectedFeedback ? (
                <motion.div 
                  key={selectedFeedback._id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl flex flex-col h-full overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
                  
                  {/* Header */}
                  <div className="p-6 md:p-8 border-b border-zinc-800 bg-zinc-950/20 relative z-10 flex flex-col gap-6">
                     <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
                        <div className="space-y-4 max-w-2xl">
                           <div className="flex gap-2 flex-wrap">
                             <StatusBadge status={selectedFeedback.status} />
                             {selectedFeedback.ai_processed && <PriorityBadge score={selectedFeedback.ai_priority || 0} />}
                           </div>
                           <h2 className="text-2xl md:text-3xl font-black leading-tight tracking-tight">{selectedFeedback.title}</h2>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                           <button 
                             onClick={() => reanalyzeItem(selectedFeedback._id)} 
                             disabled={isRetriggering}
                             className="px-3 py-2 text-xs font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 tracking-wider shadow-sm"
                           >
                             {isRetriggering ? <Loader2 className="h-3 w-3 animate-spin"/> : <Sparkles className="h-3 w-3"/>}
                             {isRetriggering ? "Analyzing" : "Re-trigger AI"}
                           </button>
                           <button onClick={() => deleteItem(selectedFeedback._id)} className="p-2 hover:bg-red-500/10 hover:text-red-400 text-zinc-500 bg-zinc-900 border border-zinc-800 rounded-xl transition-all shadow-sm">
                             <Trash2 className="h-4 w-4" />
                           </button>
                        </div>
                     </div>
                     <div className="flex flex-wrap gap-2 items-center bg-zinc-950/50 w-fit p-1 rounded-xl border border-zinc-800/50 shadow-inner">
                        {['New', 'In Review', 'Resolved'].map((s) => (
                          <button
                            key={s} onClick={() => updateStatus(selectedFeedback._id, s)}
                            className={cn(
                              "px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all",
                              selectedFeedback.status === s 
                                ? "bg-zinc-800 text-white shadow-md border border-zinc-700" 
                                : "text-zinc-500 hover:text-white"
                            )}
                          >
                            {s}
                          </button>
                        ))}
                     </div>
                  </div>

                  {/* Body */}
                  <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar relative z-10 space-y-8">
                     <section className="space-y-3 relative group">
                        <h4 className="text-[10px] font-black w-fit uppercase tracking-[0.2em] text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-md border border-indigo-500/20 shadow-sm flex items-center gap-2">
                           <MessageSquare className="h-3 w-3" /> Original Context
                        </h4>
                        <div className="bg-zinc-950/50 p-6 rounded-2xl border border-zinc-800/50 text-zinc-300 shadow-inner">
                           <p className="whitespace-pre-wrap leading-relaxed text-sm">{selectedFeedback.description}</p>
                           <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-zinc-800/50 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 bg-zinc-600 rounded-full" /> {selectedFeedback.submitterName || 'Anon User'}</span>
                              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 bg-zinc-600 rounded-full" /> {selectedFeedback.submitterEmail || 'N/A'}</span>
                              <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 bg-zinc-600 rounded-full" /> {selectedFeedback.category}</span>
                           </div>
                        </div>
                     </section>

                     {selectedFeedback.ai_processed && (
                       <section className="space-y-3">
                         <h4 className="text-[10px] font-black w-fit uppercase tracking-[0.2em] text-purple-400 bg-purple-500/10 px-3 py-1 rounded-md border border-purple-500/20 shadow-sm flex items-center gap-2">
                            <Sparkles className="h-3 w-3" /> AI Engine Analysis
                         </h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-sm relative overflow-hidden group">
                               <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-bl-[100px] pointer-events-none group-hover:bg-purple-500/10 transition-colors"/>
                               <p className="text-[10px] font-black text-zinc-500 mb-3 uppercase tracking-wider">Executive Summary</p>
                               <p className="text-sm font-medium leading-relaxed text-zinc-200">{selectedFeedback.ai_summary}</p>
                            </div>
                            <div className="space-y-4">
                               <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-sm flex items-center justify-between">
                                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Detected Sentiment</p>
                                  {selectedFeedback.ai_sentiment && <SentimentBadge sentiment={selectedFeedback.ai_sentiment} />}
                               </div>
                               <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 shadow-sm">
                                  <p className="text-[10px] font-black text-zinc-500 mb-3 uppercase tracking-wider">Categorization & Tags</p>
                                  <div className="flex flex-wrap gap-2">
                                     <span className="px-2.5 py-1 text-[10px] font-black uppercase text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-md shadow-sm">{selectedFeedback.ai_category}</span>
                                     {selectedFeedback.ai_tags?.map(tag => (
                                       <span key={tag} className="px-2.5 py-1 bg-zinc-950 text-[10px] font-bold text-zinc-400 border border-zinc-800 uppercase rounded-md shadow-sm">
                                         {tag}
                                       </span>
                                     ))}
                                  </div>
                               </div>
                            </div>
                         </div>
                       </section>
                     )}
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-zinc-800/50 rounded-3xl bg-zinc-950/20 p-12 text-center text-zinc-500">
                  <div className="p-6 bg-zinc-900/50 border border-zinc-800 rounded-full mb-6 shadow-inner">
                    <Sparkles className="h-10 w-10 text-indigo-500/30" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-zinc-400">Intelligence Workspace</h3>
                  <p className="max-w-xs text-sm font-medium">Select a submission from the queue to review AI insights and metrics.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #27272a; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}} />
    </main>
  );
}
