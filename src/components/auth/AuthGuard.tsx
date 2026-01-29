'use client';

/**
 * Auth Guard Component
 * Protects routes that require authentication
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from './AuthProvider';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, isLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, isLoading, router]);

  // Show loading state
  if (isLoading) {
    return fallback || <LoadingSpinner />;
  }

  // Not authenticated - will redirect
  if (!user) {
    return fallback || <LoadingSpinner />;
  }

  // Authenticated - render children
  return <>{children}</>;
}

function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}
