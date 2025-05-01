'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth, AuthProvider } from '../../../lib/auth';

function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const { signup, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await signup(email, password, displayName);
    } catch (err) {
      setError('Unable to create account. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-full max-w-md px-6 py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-semibold text-gray-800">Create account</h1>
          <p className="mt-3 text-gray-600 text-lg">Join us today</p>
        </div>
        
        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-base rounded-r-md">
            {error}
          </div>
        )}
        
        <form className="space-y-8 flex flex-col items-center" onSubmit={handleSubmit}>
          <div className="space-y-6 w-full">
            <div className="flex justify-center">
              <input
                id="display-name"
                name="displayName"
                type="text"
                required
                className="w-full px-5 py-4 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm transition-all"
                placeholder="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="flex justify-center">
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-5 py-4 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm transition-all"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex justify-center">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full px-5 py-4 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm transition-all"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-center w-full">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 text-white bg-primary-600 hover:bg-primary-700 rounded-xl text-base font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
          
          <div className="text-center mt-8 w-full">
            <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 text-base">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SignUp() {
  return (
    <AuthProvider>
      <SignUpForm />
    </AuthProvider>
  );
} 