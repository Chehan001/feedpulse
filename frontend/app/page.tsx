import FeedbackForm from '@/components/FeedbackForm';
import { Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white relative overflow-hidden flex flex-col items-center justify-center py-20 px-4">
      {/* Decorative background elements */}
      <div className="fixed inset-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[150px] opacity-30" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/20 rounded-full blur-[150px] opacity-30" />
      </div>

      <div className="max-w-4xl w-full space-y-10 text-center mb-16 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-sm font-medium shadow-xl">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-zinc-300">AI-Powered Submissions</span>
        </div>
        
        <div className="space-y-6">
          <h1 className="text-5xl md:text-8xl font-black tracking-tight leading-tight">
            Feed<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Pulse</span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed">
            Shape our products together. Share your brilliant ideas and let AI bring them to our roadmap.
          </p>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <FeedbackForm />
      </div>
      
      <footer className="mt-20 text-sm text-zinc-600 font-medium relative z-10">
        © 2026 FeedPulse Enterprise Platform
      </footer>
    </main>
  );
}
