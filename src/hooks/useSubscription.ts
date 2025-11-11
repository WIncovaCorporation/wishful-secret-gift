import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  features: any;
}

interface UserSubscription {
  id: string;
  status: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  plan: SubscriptionPlan;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [features, setFeatures] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Obtener suscripción activa
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'trialing'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) {
        throw subError;
      }

      if (subData) {
        setSubscription(subData as any);
        setFeatures(subData.plan.features);
      } else {
        // Si no tiene suscripción, usar plan free
        const { data: freePlan } = await supabase
          .from('subscription_plans')
          .select('features')
          .eq('name', 'free')
          .single();

        if (freePlan) {
          setFeatures(freePlan.features);
        }
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  const hasFeature = (feature: string): boolean => {
    if (!features) return false;
    
    switch (feature) {
      case 'unlimited_groups':
        return features.max_groups >= 999;
      case 'ai_suggestions':
        return features.ai_suggestions_per_month > 0;
      case 'premium_lists':
        return features.max_wishlists > 1;
      case 'remove_branding':
        return features.can_remove_branding === true;
      case 'priority_support':
        return features.priority_support === true;
      default:
        return false;
    }
  };

  const getLimit = (limitType: 'groups' | 'participants' | 'wishlists' | 'ai'): number => {
    if (!features) return 0;
    
    switch (limitType) {
      case 'groups':
        return features.max_groups || 0;
      case 'participants':
        return features.max_participants_per_group || 0;
      case 'wishlists':
        return features.max_wishlists || 0;
      case 'ai':
        return features.ai_suggestions_per_month || 0;
      default:
        return 0;
    }
  };

  return {
    subscription,
    features,
    loading,
    error,
    hasFeature,
    getLimit,
    refetch: fetchSubscription,
  };
}
