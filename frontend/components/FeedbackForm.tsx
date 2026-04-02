'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const feedbackSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.enum(['Bug', 'Feature Request', 'Improvement', 'Other']),
  submitterName: z.string().optional(),
  submitterEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export default function FeedbackForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      category: 'Other',
    },
  });

  const description = watch('description', '');

  const onSubmit = async (data: FeedbackFormValues) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      const response = await fetch('http://localhost:5000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const resData = await response.json();
      if (!resData.success) {
        throw new Error(resData.error || 'Failed to submit feedback');
      }

      setSubmitStatus('success');
      reset();
    } catch (error: any) {
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full mx-auto p-8 md:p-10 bg-zinc-900/50 backdrop-blur-xl rounded-[2rem] border border-zinc-800 shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
      
      <AnimatePresence mode="wait">
        {submitStatus === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-20 space-y-6 text-center relative z-10"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="h-24 w-24 text-green-400 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/20 shadow-lg shadow-green-500/20"
            >
              <CheckCircle2 className="h-12 w-12" />
            </motion.div>
            <div className="space-y-3">
              <h3 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Awesome! Request Received.</h3>
              <p className="text-zinc-400 font-medium max-w-sm">Our AI will now categorize and prioritize your feedback for the product team.</p>
            </div>
            <button
              onClick={() => setSubmitStatus('idle')}
              className="mt-6 px-8 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-all font-bold border border-zinc-700 shadow-lg"
            >
              Submit Another Idea
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={handleSubmit(onSubmit)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 relative z-10"
          >
            {submitStatus === 'error' && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">{errorMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Name (Optional)</label>
                <input
                  {...register('submitterName')}
                  placeholder="E.g. Jane Doe"
                  className="w-full px-5 py-3.5 rounded-xl border border-zinc-800 bg-zinc-950/50 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Email (Optional)</label>
                <input
                  {...register('submitterEmail')}
                  placeholder="jane@company.com"
                  className="w-full px-5 py-3.5 rounded-xl border border-zinc-800 bg-zinc-950/50 text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all shadow-inner"
                />
                {errors.submitterEmail && <p className="text-xs text-red-400 font-medium mt-1">{errors.submitterEmail.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Category</label>
              <select
                {...register('category')}
                className="w-full px-5 py-3.5 rounded-xl border border-zinc-800 bg-zinc-950/50 text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all cursor-pointer shadow-inner appearance-none"
              >
                <option value="Bug">🐛 Bug Report</option>
                <option value="Feature Request">✨ Feature Request</option>
                <option value="Improvement">📈 Improvement</option>
                <option value="Other">💬 Other / General</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Subject / Title</label>
              <input
                {...register('title')}
                placeholder="What's this about?"
                className={cn(
                  "w-full px-5 py-3.5 rounded-xl border bg-zinc-950/50 text-white placeholder:text-zinc-600 outline-none transition-all shadow-inner",
                  errors.title ? "border-red-500 focus:ring-red-500/20" : "border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                )}
              />
              {errors.title && <p className="text-xs text-red-400 font-medium mt-1">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Description</label>
                <span className={cn(
                  "text-[10px] font-bold tracking-widest",
                  description.length < 20 ? "text-zinc-600" : "text-green-400"
                )}>
                  {description.length}/20 MIN chars
                </span>
              </div>
              <textarea
                {...register('description')}
                rows={6}
                placeholder="Provide as much detail as possible..."
                className={cn(
                  "w-full px-5 py-3.5 rounded-xl border bg-zinc-950/50 text-white placeholder:text-zinc-600 outline-none transition-all shadow-inner resize-none",
                  errors.description ? "border-red-500 focus:ring-red-500/20" : "border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                )}
              />
              {errors.description && <p className="text-xs text-red-400 font-medium mt-1">{errors.description.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-indigo-500 hover:from-indigo-400 to-purple-600 hover:to-purple-500 text-white rounded-xl font-bold shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  AI is analyzing...
                </>
              ) : (
                <>
                   Send to AI Brain <Sparkles className="h-5 w-5" />
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
