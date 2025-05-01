'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface from '../components/ChatInterface';
import { AuthProvider, useAuth } from '../lib/auth';

function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <ChatInterface />;
}

export default function HomePageWithAuth() {
  return (
    <AuthProvider>
      <HomePage />
    </AuthProvider>
  );
} 