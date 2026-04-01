'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
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
    <div className="w-full max-w-2xl mx-auto p-6 space-y-8 bg-card rounded-2xl border shadow-xl">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight gradient-text">Submit Your Feedback</h2>
        <p className="text-muted-foreground">Help us improve by sharing your thoughts or reporting issues.</p>
      </div>

      <AnimatePresence mode="wait">
        {submitStatus === 'success' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-10 space-y-4 text-center"
          >
            <div className="h-16 w-16 text-green-500 bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Thank you for your feedback!</h3>
              <p className="text-muted-foreground">Our team (and AI) will analyze it shortly.</p>
            </div>
            <button
              onClick={() => setSubmitStatus('idle')}
              className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all font-medium"
            >
              Submit Another
            </button>
          </motion.div>
        ) : (
          <motion.form
            onSubmit={handleSubmit(onSubmit)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {submitStatus === 'error' && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-lg flex items-center gap-3">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">{errorMessage}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name (Optional)</label>
                <input
                  {...register('submitterName')}
                  placeholder="Your Name"
                  className="w-full px-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email (Optional)</label>
                <input
                  {...register('submitterEmail')}
                  placeholder="your@email.com"
                  className="w-full px-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
                {errors.submitterEmail && <p className="text-xs text-destructive mt-1">{errors.submitterEmail.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Feedback Category</label>
              <select
                {...register('category')}
                className="w-full px-4 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
              >
                <option value="Bug">Bug Report</option>
                <option value="Feature Request">Feature Request</option>
                <option value="Improvement">Improvement</option>
                <option value="Other">Other / General</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Subject / Title</label>
              <input
                {...register('title')}
                placeholder="Give it a clear title"
                className={cn(
                  "w-full px-4 py-2 rounded-lg border bg-background outline-none transition-all focus:ring-2",
                  errors.title ? "border-destructive focus:ring-destructive/20" : "focus:ring-primary/20"
                )}
              />
              {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Description</label>
                <span className={cn(
                  "text-xs",
                  description.length < 20 ? "text-muted-foreground" : "text-green-500"
                )}>
                  {description.length} / 20 min characters
                </span>
              </div>
              <textarea
                {...register('description')}
                rows={5}
                placeholder="Describe your feedback in detail..."
                className={cn(
                  "w-full px-4 py-2 rounded-lg border bg-background outline-none transition-all focus:ring-2 resize-none",
                  errors.description ? "border-destructive focus:ring-destructive/20" : "focus:ring-primary/20"
                )}
              />
              {errors.description && <p className="text-xs text-destructive mt-1">{errors.description.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Submit Feedback
                </>
              )}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
