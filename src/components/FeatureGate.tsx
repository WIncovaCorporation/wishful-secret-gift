import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

interface FeatureGateProps {
  feature: 'unlimited_groups' | 'ai_suggestions' | 'premium_lists' | 'corporate_features';
  requiredRole: 'premium_user' | 'corporate_manager';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({ feature, requiredRole, children, fallback }: FeatureGateProps) {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setHasAccess(false);
      setLoading(false);
      return;
    }

    const { data: roles, error } = await supabase.rpc('get_user_roles', { 
      _user_id: user.id 
    });

    if (error) {
      console.error('Error checking roles:', error);
      setHasAccess(false);
      setLoading(false);
      return;
    }

    const hasRole = roles?.some((r: any) => r.role === requiredRole || r.role === 'admin');
    setHasAccess(hasRole || false);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!hasAccess) {
    return fallback || (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/50">
        <Lock className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Función Premium</h3>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Esta función requiere una suscripción Premium
        </p>
        <Button onClick={() => navigate('/pricing')}>
          Ver Planes
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
