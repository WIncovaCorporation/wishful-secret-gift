import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';
import { FeatureGate } from '@/components/FeatureGate';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { CheckCircle, XCircle, Shield, Sparkles } from 'lucide-react';

export default function RolesTest() {
  const { roles, loading, isPremium, isFree, isAdmin, hasRole } = useUserRole();
  const [testResults, setTestResults] = useState<any[]>([]);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
    }
  };

  const runTests = async () => {
    const results = [];

    // Test 1: Check if user has free_user role
    const hasFreeRole = hasRole('free_user');
    results.push({
      name: 'Usuario tiene rol free_user',
      passed: hasFreeRole,
      details: `hasRole('free_user') = ${hasFreeRole}`
    });

    // Test 2: Check if isFree() works
    results.push({
      name: 'Función isFree() detecta usuario gratuito',
      passed: isFree(),
      details: `isFree() = ${isFree()}`
    });

    // Test 3: Check if isPremium() returns false for free users
    results.push({
      name: 'Función isPremium() retorna false para free users',
      passed: !isPremium(),
      details: `isPremium() = ${isPremium()} (debe ser false)`
    });

    // Test 4: Test get_user_roles RPC
    try {
      const { data: rpcRoles, error } = await supabase.rpc('get_user_roles', {
        _user_id: userId
      });
      
      results.push({
        name: 'RPC get_user_roles funciona',
        passed: !error && rpcRoles?.length > 0,
        details: `Roles retornados: ${JSON.stringify(rpcRoles)}`
      });
    } catch (err) {
      results.push({
        name: 'RPC get_user_roles funciona',
        passed: false,
        details: `Error: ${err}`
      });
    }

    // Test 5: Test has_role RPC
    try {
      const { data: hasFree, error } = await supabase.rpc('has_role', {
        _user_id: userId,
        _role: 'free_user'
      });
      
      results.push({
        name: 'RPC has_role funciona',
        passed: !error && hasFree === true,
        details: `has_role('free_user') = ${hasFree}`
      });
    } catch (err) {
      results.push({
        name: 'RPC has_role funciona',
        passed: false,
        details: `Error: ${err}`
      });
    }

    setTestResults(results);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-muted-foreground">Cargando...</div>
        </div>
      </div>
    );
  }

  const passedTests = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Sistema de Roles - Testing</h1>
        <p className="text-muted-foreground">
          Verifica que el sistema de roles y permisos esté funcionando correctamente
        </p>
      </div>

      {/* Estado Actual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Estado Actual del Usuario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm text-muted-foreground mb-2">User ID:</div>
            <code className="text-xs bg-muted px-2 py-1 rounded">{userId}</code>
          </div>
          
          <div>
            <div className="text-sm text-muted-foreground mb-2">Roles asignados:</div>
            <div className="flex gap-2">
              {roles.map(role => (
                <Badge key={role} variant="secondary">
                  {role}
                </Badge>
              ))}
              {roles.length === 0 && (
                <span className="text-sm text-muted-foreground">Sin roles asignados</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Es usuario gratuito</div>
              <div className="font-semibold">{isFree() ? 'Sí' : 'No'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Es usuario premium</div>
              <div className="font-semibold">{isPremium() ? 'Sí' : 'No'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Es administrador</div>
              <div className="font-semibold">{isAdmin() ? 'Sí' : 'No'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tests Automáticos */}
      <Card>
        <CardHeader>
          <CardTitle>Tests Automáticos</CardTitle>
          <CardDescription>
            Verifica las funciones de roles y RPC
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runTests} disabled={!userId}>
            Ejecutar Tests
          </Button>

          {testResults.length > 0 && (
            <>
              <div className="flex items-center gap-2 pt-4 border-t">
                <span className="font-semibold">Resultado:</span>
                <span className={passedTests === totalTests ? 'text-green-600' : 'text-red-600'}>
                  {passedTests}/{totalTests} tests pasados
                </span>
              </div>

              <div className="space-y-2">
                {testResults.map((result, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    {result.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{result.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {result.details}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Test de FeatureGate */}
      <Card>
        <CardHeader>
          <CardTitle>Test de FeatureGate Component</CardTitle>
          <CardDescription>
            Verifica que el componente bloquee features premium correctamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeatureGate
            feature="ai_suggestions"
            requiredRole="premium_user"
          >
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-green-600">
                <Sparkles className="w-5 h-5" />
                <span className="font-semibold">
                  ¡Contenido Premium Desbloqueado!
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Si ves este mensaje, tienes acceso premium
              </p>
            </div>
          </FeatureGate>
        </CardContent>
      </Card>

      {/* Test de UpgradePrompt */}
      <Card>
        <CardHeader>
          <CardTitle>Test de UpgradePrompt Component</CardTitle>
          <CardDescription>
            Prompt de actualización a premium
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UpgradePrompt
            title="Desbloquea Sugerencias con IA"
            description="Obtén recomendaciones personalizadas de regalos usando inteligencia artificial"
            feature="ai_suggestions"
          />
        </CardContent>
      </Card>
    </div>
  );
}
