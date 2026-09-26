'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/api';
import { setTokens } from '@/lib/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agencySlug, setAgencySlug] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login({ email, password, agency_slug: agencySlug });
      setTokens(data.access_token, data.refresh_token, data.role);
      if (data.role === 'client_user') {
        router.push('/portal');
      } else {
        router.push('/dashboard');
      }
    } catch {
      setError('Invalid credentials or agency slug. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AgencyDesk</h1>
          <p className="text-gray-500 mt-1 text-sm">Sign in to your workspace</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Agency Slug</label>
            <input
              type="text"
              required
              value={agencySlug}
              onChange={(e) => setAgencySlug(e.target.value)}
              placeholder="e.g. alpha or beta"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Demo slugs: <code>alpha</code> / <code>beta</code></p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 border-t pt-5">
          <p className="text-xs text-gray-500 font-medium mb-2">Demo credentials:</p>
          <div className="space-y-1 text-xs text-gray-500">
            <p><code className="bg-gray-100 px-1 rounded">admin@alpha.com</code> / <code className="bg-gray-100 px-1 rounded">password123</code> — Agency Admin (slug: alpha)</p>
            <p><code className="bg-gray-100 px-1 rounded">member@alpha.com</code> / <code className="bg-gray-100 px-1 rounded">password123</code> — Agency Member (slug: alpha)</p>
            <p><code className="bg-gray-100 px-1 rounded">client@acme.com</code> / <code className="bg-gray-100 px-1 rounded">password123</code> — Client User (slug: alpha)</p>
            <p><code className="bg-gray-100 px-1 rounded">admin@beta.com</code> / <code className="bg-gray-100 px-1 rounded">password123</code> — Agency Admin (slug: beta)</p>
          </div>
        </div>
      </div>
    </div>
  );
}