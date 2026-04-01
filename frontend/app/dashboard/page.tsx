'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCcw, 
  ShieldAlert, 
  CheckCircle, 
  AlertTriangle,
  Info,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Tag as TagIcon,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  BarChart3,
  Clock,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
}

const PriorityBadge = ({ score }: { score: number }) => {
  const isCritical = score >= 8;
  const isHigh = score >= 6;
  const isMedium = score >= 4;

  const colorClass = isCritical ? 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse' :
                    isHigh ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                    isMedium ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                    'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';

  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1", colorClass)}>
      {isCritical ? <ShieldAlert className="h-3 w-3" /> : <Info className="h-3 w-3" />}
      Priority {score}/10
    </span>
  );
};

const StatusBadge = ({ status }: { status: Feedback['status'] }) => {
  const colors = {
    'New': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    'In Review': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'Resolved': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  };

  return (
    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider", colors[status])}>
      {status}
    </span>
  );
};

export default function AdminDashboard() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }, [router]);

  const fetchData = useCallback(async () => {
    const headers = getHeaders();
    if (!headers) return;

    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        category: filterCategory,
        status: filterStatus,
        search: searchQuery,
        page: page.toString(),
        limit: '10'
      });

      const [listRes, statsRes] = await Promise.all([
        fetch(`http://localhost:5000/api/feedback?${query}`, { headers }),
        fetch(`http://localhost:5000/api/feedback/summary`, { headers })
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
    }
  }, [filterCategory, filterStatus, searchQuery, page, getHeaders]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateStatus = async (id: string, status: string) => {
    const headers = getHeaders();
    if (!headers) return;

    try {
      const res = await fetch(`http://localhost:5000/api/feedback/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        setFeedback(prev => prev.map(f => f._id === id ? { ...f, status: status as any } : f));
        if (selectedFeedback?._id === id) setSelectedFeedback(prev => prev ? { ...prev, status: status as any } : null);
      }
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">Feed<span className="gradient-text">Pulse</span> Admin</h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted py-1.5 px-3 rounded-lg transition-all border">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 md:p-12 w-full flex-1 space-y-12">
        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase opacity-60">Total Feedback</p>
              <p className="text-2xl font-black">{stats?.totalItems || 0}</p>
            </div>
          </div>
          <div className="bg-card p-6 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase opacity-60">Pending / Open</p>
              <p className="text-2xl font-black">{stats?.openItems || 0}</p>
            </div>
          </div>
          <div className="bg-card p-6 rounded-2xl border shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase opacity-60">Avg AI Priority</p>
              <p className="text-2xl font-black">{stats?.avgPriority ? stats.avgPriority.toFixed(1) : '0.0'}/10</p>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              placeholder="Search by title, description or AI summary..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-3 bg-card rounded-xl border focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={filterCategory}
              onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
              className="px-4 py-3 bg-card rounded-xl border focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer shadow-sm min-w-[140px]"
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
              className="px-4 py-3 bg-card rounded-xl border focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer shadow-sm min-w-[140px]"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="In Review">In Review</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Table/List View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 border rounded-2xl bg-card shadow-sm flex flex-col h-[600px]">
            <div className="p-4 border-b bg-muted/20 flex items-center justify-between font-bold text-xs">
              <span>{feedback.length} ITEMS ON THIS PAGE</span>
              <button 
                onClick={fetchData}
                className="p-1 hover:bg-muted rounded transition-colors"
                disabled={isLoading}
              >
                <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y">
              <AnimatePresence>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-6 animate-pulse space-y-3">
                      <div className="flex gap-2">
                        <div className="h-4 bg-muted rounded w-20" />
                        <div className="h-4 bg-muted rounded w-16" />
                      </div>
                      <div className="h-5 bg-muted rounded w-full" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                  ))
                ) : feedback.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
                    <Info className="h-12 w-12 opacity-10" />
                    <p>No feedback found.</p>
                  </div>
                ) : (
                  feedback.map((item) => (
                    <motion.div 
                      key={item._id}
                      layoutId={item._id}
                      onClick={() => setSelectedFeedback(item)}
                      className={cn(
                        "p-5 cursor-pointer hover:bg-muted/30 transition-all border-l-4",
                        selectedFeedback?._id === item._id ? "bg-primary/[0.04] border-l-primary" : "border-l-transparent"
                      )}
                    >
                      <div className="flex gap-2 mb-2 flex-wrap">
                        <StatusBadge status={item.status} />
                        {item.ai_processed && <PriorityBadge score={item.ai_priority || 0} />}
                      </div>
                      <h3 className="font-bold text-sm line-clamp-1 mb-1">{item.title}</h3>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        <span>{item.category}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Pagination */}
            <div className="p-4 border-t flex items-center justify-between">
              <button 
                disabled={page === 1 || isLoading}
                onClick={() => setPage(p => p - 1)}
                className="p-1 disabled:opacity-30 hover:bg-muted rounded"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-xs font-bold">Page {page} of {totalPages}</span>
              <button 
                disabled={page === totalPages || isLoading}
                onClick={() => setPage(p => p + 1)}
                className="p-1 disabled:opacity-30 hover:bg-muted rounded"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedFeedback ? (
                <motion.div 
                  key={selectedFeedback._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-card border rounded-2xl shadow-lg flex flex-col h-full overflow-hidden"
                >
                  {/* Header */}
                  <div className="p-8 border-b bg-muted/10">
                    <div className="flex items-start justify-between mb-6">
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={selectedFeedback.status} />
                          {selectedFeedback.ai_processed && (
                            <>
                              <PriorityBadge score={selectedFeedback.ai_priority || 0} />
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                                selectedFeedback.ai_sentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                selectedFeedback.ai_sentiment === 'Negative' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                                'bg-slate-500/10 text-slate-500 border-slate-500/20'
                              )}>
                                {selectedFeedback.ai_sentiment} SENTIMENT
                              </span>
                            </>
                          )}
                        </div>
                        <h2 className="text-3xl font-black leading-tight tracking-tight">{selectedFeedback.title}</h2>
                        <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                          <span className="flex items-center gap-1.5 border-r pr-4">
                            <span className="h-2 w-2 rounded-full bg-primary" />
                            {selectedFeedback.submitterName || 'Anonymous User'}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(selectedFeedback.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => deleteItem(selectedFeedback._id)}
                          className="p-2 hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded-xl transition-all border"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {['New', 'In Review', 'Resolved'].map((s) => (
                        <button
                          key={s}
                          onClick={() => updateStatus(selectedFeedback._id, s)}
                          className={cn(
                            "px-4 py-2 text-xs font-black rounded-lg transition-all border",
                            selectedFeedback.status === s 
                              ? "bg-primary text-primary-foreground border-primary shadow-md" 
                              : "hover:bg-muted text-muted-foreground"
                          )}
                        >
                          Mark as {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-8 flex-1 grid grid-cols-1 md:grid-cols-12 gap-10 overflow-y-auto">
                    <div className="md:col-span-12 lg:col-span-8 space-y-10">
                      <section className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                          <MessageSquare className="h-3 w-3" />
                          Feedback Description
                        </h4>
                        <div className="bg-muted/20 p-8 rounded-3xl border border-dashed border-muted-foreground/20">
                          <p className="whitespace-pre-wrap leading-relaxed text-base font-medium opacity-90">{selectedFeedback.description}</p>
                        </div>
                      </section>

                      {selectedFeedback.ai_processed && (
                        <section className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                            <BarChart3 className="h-3 w-3" />
                            AI-Generated Insights
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 bg-primary/[0.02] border rounded-2xl">
                              <p className="text-[10px] font-black text-muted-foreground mb-3 uppercase tracking-wider">AI Summary</p>
                              <p className="text-sm font-bold leading-relaxed">{selectedFeedback.ai_summary}</p>
                            </div>
                            <div className="p-6 bg-primary/[0.02] border rounded-2xl">
                              <p className="text-[10px] font-black text-muted-foreground mb-3 uppercase tracking-wider">Suggested Tags</p>
                              <div className="flex flex-wrap gap-2">
                                {selectedFeedback.ai_tags?.map(tag => (
                                  <span key={tag} className="px-2 py-1 bg-background text-[10px] font-black border uppercase rounded-md shadow-sm">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </section>
                      )}
                    </div>
                    
                    {/* Submitter Info */}
                    <div className="md:col-span-12 lg:col-span-4 space-y-6">
                      <div className="p-6 bg-secondary/30 rounded-2xl border">
                        <h4 className="text-[10px] font-black uppercase tracking-wider mb-4 opacity-70">Submitter Info</h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase mb-1">Name</p>
                            <p className="text-sm font-bold">{selectedFeedback.submitterName || 'Not provided'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase mb-1">Email</p>
                            <p className="text-sm font-bold break-all">{selectedFeedback.submitterEmail || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-secondary/30 rounded-2xl border">
                        <h4 className="text-[10px] font-black uppercase tracking-wider mb-4 opacity-70">Meta Info</h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase mb-1">Category</p>
                            <span className="px-2 py-1 bg-white dark:bg-black rounded border text-[10px] font-bold">{selectedFeedback.category}</span>
                          </div>
                          {selectedFeedback.ai_processed && (
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase mb-1">AI Recommendation</p>
                              <p className="text-xs font-bold text-primary">{selectedFeedback.ai_category}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-3xl bg-muted/5 p-12 text-center text-muted-foreground">
                  <div className="p-6 bg-muted/20 rounded-full mb-6">
                    <BarChart3 className="h-10 w-10 opacity-20" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Workspace Dashboard</h3>
                  <p className="max-w-xs text-sm">Select a user submission from the left to start analyzing with AI and managing feedback status.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}
