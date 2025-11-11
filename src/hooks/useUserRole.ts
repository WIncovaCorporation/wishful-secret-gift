import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'free_user' | 'premium_user' | 'corporate_manager' | 'admin';

export function useUserRole() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchUserRoles();
  }, []);

  const fetchUserRoles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setRoles([]);
        setLoading(false);
        return;
      }

      const { data, error: rpcError } = await supabase.rpc('get_user_roles', {
        _user_id: user.id
      });

      if (rpcError) {
        throw rpcError;
      }

      const userRoles = data?.map((r: any) => r.role as AppRole) || [];
      setRoles(userRoles);
    } catch (err) {
      console.error('Error fetching user roles:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return roles.includes(role) || roles.includes('admin');
  };

  const isPremium = (): boolean => {
    return hasRole('premium_user') || hasRole('corporate_manager');
  };

  const isFree = (): boolean => {
    return roles.length === 1 && roles[0] === 'free_user';
  };

  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  return {
    roles,
    loading,
    error,
    hasRole,
    isPremium,
    isFree,
    isAdmin,
    refetch: fetchUserRoles
  };
}
