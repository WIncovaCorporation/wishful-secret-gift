import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Gift } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      // Check if user already exists
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        toast.error("Este correo ya está registrado. Por favor, inicia sesión.");
        return;
      }

      toast.success("Cuenta creada exitosamente. ¡Bienvenido!");
      // Clear form
      setEmail("");
      setPassword("");
      setDisplayName("");
    } catch (error: any) {
      if (error.message.includes("already registered")) {
        toast.error("Este correo ya está registrado. Por favor, inicia sesión.");
      } else {
        toast.error(error.message || "Error al crear la cuenta");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("¡Bienvenido de vuelta!");
      // Clear form
      setEmail("");
      setPassword("");
    } catch (error: any) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Correo o contraseña incorrectos. Verifica tus datos.");
      } else {
        toast.error(error.message || "Error al iniciar sesión");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast.success("Te hemos enviado un correo para restablecer tu contraseña");
      setShowResetPassword(false);
      setResetEmail("");
    } catch (error: any) {
      toast.error(error.message || "Error al enviar el correo de recuperación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
      {/* Language Selector - Fixed Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-warm rounded-2xl shadow-large mb-4">
            <Gift className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">{t("auth.welcome")}</h1>
          <p className="text-muted-foreground mt-2">{t("auth.tagline")}</p>
        </div>

        <Card className="shadow-large border-border/50">
          <CardHeader>
            <CardTitle>{t("auth.getStarted")}</CardTitle>
            <CardDescription>{t("auth.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {showResetPassword ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Recuperar Contraseña</h3>
                  <p className="text-sm text-muted-foreground">
                    Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña
                  </p>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Correo Electrónico</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? "Enviando..." : "Enviar Enlace"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowResetPassword(false);
                        setResetEmail("");
                      }}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <Tabs 
                defaultValue="signin" 
                className="w-full"
                onValueChange={() => {
                  // Clear form when switching tabs
                  setEmail("");
                  setPassword("");
                  setDisplayName("");
                }}
              >
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="signin">{t("auth.signIn")}</TabsTrigger>
                  <TabsTrigger value="signup">{t("auth.signUp")}</TabsTrigger>
                </TabsList>

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">{t("auth.email")}</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">{t("auth.password")}</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                    <Button 
                      type="button"
                      variant="link"
                      className="px-0 text-sm"
                      onClick={() => setShowResetPassword(true)}
                    >
                      ¿Olvidaste tu contraseña?
                    </Button>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? t("auth.signingIn") : t("auth.signIn")}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Nombre</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Tu nombre"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Correo Electrónico</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Contraseña</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        Mínimo 6 caracteres
                      </p>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Creando cuenta..." : "Crear Cuenta"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;