'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthGuard';

export default function DashboardRedirect() {
  const router = useRouter();
  const { role } = useAuth();

  useEffect(() => {
    router.replace(role === 'admin' ? '/admin/dashboard' : '/user/dashboard');
  }, [role, router]);

  return null;
}
