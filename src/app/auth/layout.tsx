/**
 * Auth Layout
 * Centered card layout for authentication pages
 */

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

        {/* Auth Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-6">
          &copy; {new Date().getFullYear()} GTO Poker Pro. All rights reserved.
        </p>
      </div>
    </div>
  );
}
