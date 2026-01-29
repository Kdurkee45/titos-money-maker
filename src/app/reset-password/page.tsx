'use client';

/**
 * Reset Password Page
 * User lands here after clicking the reset link in their email
 */

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsValidSession(true);
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;
      
      setSuccess(true);
      
      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        router.push('/auth/signin');
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    }

    setIsSubmitting(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Invalid session
  if (!isValidSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Invalid or Expired Link
            </h2>
            <p className="text-slate-400 mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link 
              href="/auth/forgot-password"
              className="inline-block py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Password Updated
            </h2>
            <p className="text-slate-400 mb-6">
              Your password has been successfully reset. Redirecting to sign in...
            </p>
            <Link 
              href="/auth/signin"
              className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Go to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            GTO Poker Pro
          </h1>
          <p className="text-slate-400 text-sm">
            Game Theory Optimal Texas Hold&apos;em
          </p>
        </div>

        {/* Reset Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-2">
            Set New Password
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            Enter your new password below.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                placeholder="••••••••"
              />
              <p className="text-slate-500 text-xs mt-1">
                At least 8 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium text-slate-300 mb-1"
              >
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                placeholder="••••••••"
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
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
