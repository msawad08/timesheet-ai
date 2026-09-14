import Link from 'next/link';
import { ArrowRight, Bot, ShieldCheck, Clock, Layers } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium">
          <Bot className="w-4 h-4" /> Next-Generation AI Timesheets
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Intelligent Time Tracking with Conversational AI
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
          Log work in natural language, automatically match entries to active projects using semantic vector embeddings, and manage teams with dynamic CASL authorization.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-lg shadow-blue-600/20"
          >
            Launch Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 text-slate-200 font-medium transition-colors"
          >
            Sign In
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 text-left">
          <div className="glass-panel p-6 rounded-xl space-y-3">
            <Clock className="w-6 h-6 text-blue-400" />
            <h3 className="font-semibold text-lg text-white">Natural Language Logging</h3>
            <p className="text-sm text-slate-400">
              Describe your day casually. The AI worker extracts duration, activities, and transforms summaries.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-xl space-y-3">
            <Layers className="w-6 h-6 text-violet-400" />
            <h3 className="font-semibold text-lg text-white">Semantic Project Matching</h3>
            <p className="text-sm text-slate-400">
              Combines lexical fuzzy search with pgvector cosine similarity to automatically assign entries.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-xl space-y-3">
            <ShieldCheck className="w-6 h-6 text-teal-400" />
            <h3 className="font-semibold text-lg text-white">Dynamic CASL ABAC</h3>
            <p className="text-sm text-slate-400">
              Multi-tenant data isolation and dynamic database-driven permission rules cached with Redis.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
