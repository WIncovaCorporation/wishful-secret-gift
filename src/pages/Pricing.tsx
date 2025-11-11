import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Check, Sparkles, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const plans = [
    {
      id: 'free',
      name: 'Gratuito',
      price: { monthly: 0, annual: 0 },
      description: 'Perfecto para probar',
      features: [
        'Hasta 3 grupos',
        'Máx. 10 participantes por grupo',
        '1 lista de deseos',
        'Mensajería anónima',
        'Sorteo automático',
      ],
      cta: 'Empezar Gratis',
      highlighted: false,
      popular: false,
    },
    {
      id: 'premium_individual',
      name: 'Premium Individual',
      price: { monthly: 4.99, annual: 49.99 },
      description: 'Para usuarios activos',
      features: [
        'Grupos ilimitados',
        'Hasta 50 participantes',
        '5 listas de deseos',
        '10 sugerencias IA/mes',
        'Sin marca de agua',
        'Historial completo',
        'Soporte prioritario',
      ],
      cta: 'Elegir Premium',
      highlighted: true,
      popular: true,
    },
    {
      id: 'premium_business',
      name: 'Premium Business',
      price: { monthly: 19.99, annual: 199.99 },
      description: 'Para equipos y empresas',
      features: [
        'Todo lo de Premium',
        'Participantes ilimitados',
        'Listas ilimitadas',
        'IA ilimitado',
        'Branding personalizado',
        'Soporte prioritario 24/7',
        'Integración HR',
        'Paquetes corporativos',
      ],
      cta: 'Elegir Business',
      highlighted: false,
      popular: false,
    },
  ];

  const handleSelectPlan = async (planName: string) => {
    if (planName === 'free') {
      navigate('/auth');
      return;
    }

    setLoading(planName);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Debes iniciar sesión primero');
        navigate('/auth');
        return;
      }

      // Obtener plan_id de la base de datos
      const { data: planData, error: planError } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('name', planName)
        .single();

      if (planError || !planData) {
        toast.error('Error al obtener información del plan');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          plan_id: planData.id,
          billing_cycle: billingCycle,
        },
      });

      if (error) {
        console.error('Error:', error);
        toast.error('Error al crear sesión de pago');
        return;
      }

      if (data.error) {
        toast.info('Stripe está en configuración', {
          description: 'Las funcionalidades de pago estarán disponibles pronto',
        });
        return;
      }

      // Redirigir a Stripe Checkout
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err) {
      console.error('Error selecting plan:', err);
      toast.error('Error al procesar tu solicitud');
    } finally {
      setLoading(null);
    }
  };

  const savingsPercentage = Math.round(
    ((1 - plans[1].price.annual / (plans[1].price.monthly * 12)) * 100)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Dashboard
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Elige tu plan perfecto</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Comienza gratis. Actualiza cuando lo necesites.
          </p>

          {/* Toggle Monthly/Annual */}
          <div className="flex items-center justify-center gap-4">
            <span className={billingCycle === 'monthly' ? 'font-semibold' : 'text-muted-foreground'}>
              Mensual
            </span>
            <Switch
              checked={billingCycle === 'annual'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'annual' : 'monthly')}
            />
            <span className={billingCycle === 'annual' ? 'font-semibold' : 'text-muted-foreground'}>
              Anual
              <span className="ml-2 text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded">
                Ahorra {savingsPercentage}%
              </span>
            </span>
          </div>
        </div>

        {/* Plan Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${plan.highlighted ? 'border-primary shadow-lg md:scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Más Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="pt-8">
                <CardTitle className="flex items-center gap-2">
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    ${plan.price[billingCycle]}
                  </span>
                  {plan.price[billingCycle] > 0 && (
                    <span className="text-muted-foreground">
                      /{billingCycle === 'monthly' ? 'mes' : 'año'}
                    </span>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <Button
                  className="w-full mb-6"
                  variant={plan.highlighted ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={loading === plan.id}
                >
                  {loading === plan.id ? 'Procesando...' : plan.cta}
                </Button>
                
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Preguntas Frecuentes</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">¿Puedo cancelar en cualquier momento?</h3>
              <p className="text-muted-foreground">
                Sí, puedes cancelar tu suscripción en cualquier momento desde tu panel de control. 
                No hay contratos de permanencia.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">¿Qué métodos de pago aceptan?</h3>
              <p className="text-muted-foreground">
                Aceptamos todas las tarjetas de crédito y débito principales a través de Stripe.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">¿Hay reembolsos?</h3>
              <p className="text-muted-foreground">
                Ofrecemos reembolsos completos dentro de los primeros 14 días si no estás satisfecho.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
