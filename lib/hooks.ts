'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminUser } from './types';
import { getUser, getToken } from './auth';

export function useAuth() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    const u = getUser();
    if (!token || !u) {
      router.replace('/login');
    } else {
      setUser(u);
    }
    setLoading(false);
  }, [router]);

  return { user, loading };
}
