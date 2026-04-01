import FeedbackForm from '@/components/FeedbackForm';

export default function Home() {
  return (
    <main className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center py-20 px-4">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] opacity-20" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px] opacity-20" />
      </div>

      <div className="max-w-4xl w-full space-y-12 text-center mb-16">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Feed<span className="gradient-text">Pulse</span>
          </h1>
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
            The next generation of product feedback. 
            Powered by AI to categorize, summarize, and prioritize your thoughts instantly.
          </p>
        </div>
      </div>

      <FeedbackForm />
      
      <footer className="mt-20 text-sm text-muted-foreground">
        © 2026 FeedPulse - AI-Powered Platform
      </footer>
    </main>
  );
}
