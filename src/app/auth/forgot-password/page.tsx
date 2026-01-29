'use client';

/**
 * Forgot Password Page
 */

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { resetPassword, error } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const result = await resetPassword(email);
    
    if (result) {
      setSuccess(true);
    }
    
    setIsSubmitting(false);
  };

  // Show success message
  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Check your email
        </h2>
        <p className="text-slate-400 mb-6">
          If an account exists for <span className="text-white">{email}</span>, 
          you&apos;ll receive a password reset link.
        </p>
        <Link 
          href="/auth/signin"
          className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">
        Forgot Password
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        Enter your email address and we&apos;ll send you a link to reset your password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium text-slate-300 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
            placeholder="you@example.com"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            'Send Reset Link'
          )}
        </button>
      </form>

      {/* Back to Sign In */}
      <div className="mt-6 text-center">
        <Link 
          href="/auth/signin"
          className="text-slate-400 hover:text-slate-300 text-sm transition-colors"
        >
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
