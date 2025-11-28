import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Gift, Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import Footer from "@/components/Footer";

const Auth = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      toast.error(t("auth.nameRequired"));
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      toast.error("Por favor ingresa un correo válido");
      return;
    }

    if (password.length < 8) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    if (!(hasUpperCase && hasLowerCase && hasNumbers)) {
      toast.info("💡 Tip: Usa mayúsculas, minúsculas y números para mayor seguridad", {
        duration: 5000,
      });
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            display_name: displayName.trim(),
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      if (data.user && data.user.identities && data.user.identities.length === 0) {
        toast.error("Este correo ya está registrado. Inicia sesión o recupera tu contraseña.");
        return;
      }

      toast.success("🎉 ¡Cuenta creada! Revisa tu correo para confirmar.");
      setEmail("");
      setPassword("");
      setDisplayName("");
    } catch (error: any) {
      if (error.message.includes("already registered") || error.message.includes("User already registered")) {
        toast.error("Este correo ya está registrado. Inicia sesión o recupera tu contraseña.");
      } else {
        toast.error(error.message || "Error al crear cuenta. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      toast.error("Por favor ingresa un correo válido");
      return;
    }

    if (!password) {
      toast.error("Por favor ingresa tu contraseña");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) throw error;

      toast.success("¡Bienvenido de nuevo! 🎉");
      setEmail("");
      setPassword("");
    } catch (error: any) {
      console.error("Error de inicio de sesión:", error);
      
      if (error.message.includes("Invalid login credentials") || error.message.includes("Invalid") || error.message.includes("credentials")) {
        toast.error("Correo o contraseña incorrectos", {
          duration: 5000,
        });
      } else if (error.message.includes("Email not confirmed")) {
        toast.error("Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.", {
          duration: 6000,
        });
      } else {
        toast.error(error.message || "Error al iniciar sesión. Intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("Error al iniciar sesión con Google:", error);
      toast.error("Error al conectar con Google. Intenta nuevamente.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = resetEmail.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      toast.error("Por favor ingresa un correo válido");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: { email: normalizedEmail }
      });

      if (error) {
        console.error("Error al enviar correo:", error);
        throw error;
      }

      toast.success("✅ Correo de recuperación enviado", {
        duration: 6000,
      });
      toast.info("📧 Revisa tu bandeja de entrada y SPAM", {
        duration: 6000,
      });
      
      setShowResetPassword(false);
      setResetEmail("");
    } catch (error: any) {
      console.error("Error completo al enviar correo de recuperación:", error);
      
      if (error.message?.includes('Email not found') || error.message?.includes('User not found')) {
        toast.error("Este correo no está registrado. Verifica o crea una cuenta nueva.", {
          duration: 6000,
        });
      } else if (error.message?.includes('rate limit')) {
        toast.error("Demasiados intentos. Espera 5 minutos.", {
          duration: 6000,
        });
      } else {
        toast.error("Error al enviar correo. Intenta nuevamente.", {
          duration: 6000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string }) => (
    <div className="relative w-full overflow-hidden box-border">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        minLength={8}
        className="pl-10 pr-10 h-12 w-full max-w-full"
        autoComplete="current-password"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
        tabIndex={-1}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex flex-col">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      <div className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-warm rounded-2xl shadow-large mb-4">
              <Gift className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold">{t("auth.welcome")}</h1>
            <p className="text-muted-foreground mt-2 flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Ahorra hasta 40% comparando precios al instante</span>
            </p>
          </div>

          <Card className="shadow-large border-border/50">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">{t("auth.getStarted")}</CardTitle>
              <CardDescription>
                Encuentra los mejores precios en Amazon, Walmart, Target y más
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {showResetPassword ? (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-semibold">{t("auth.resetPassword")}</h3>
                    <p className="text-sm text-muted-foreground">
                      Te enviaremos un enlace para crear una nueva contraseña
                    </p>
                  </div>
                  <form onSubmit={handleResetPassword} className="space-y-4 w-full overflow-hidden">
                    <div className="space-y-2 w-full">
                      <Label htmlFor="reset-email">{t("auth.email")}</Label>
                      <div className="relative w-full overflow-hidden box-border">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                        <Input
                          id="reset-email"
                          type="email"
                          inputMode="email"
                          placeholder="tu@correo.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                          autoComplete="email"
                          className="pl-10 h-12 w-full max-w-full"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1 h-12 text-base font-semibold" disabled={loading}>
                        {loading ? "Enviando..." : "Enviar enlace"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="h-12"
                        onClick={() => {
                          setShowResetPassword(false);
                          setResetEmail("");
                        }}
                        disabled={loading}
                      >
                        Volver
                      </Button>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      El correo puede tardar hasta 5 minutos. Revisa SPAM si no lo ves.
                    </p>
                  </form>
                </div>
              ) : (
                <Tabs 
                  defaultValue="signin" 
                  className="w-full"
                  onValueChange={() => {
                    setEmail("");
                    setPassword("");
                    setDisplayName("");
                  }}
                >
                  <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                    <TabsTrigger value="signin" className="text-base font-medium">{t("auth.signIn")}</TabsTrigger>
                    <TabsTrigger value="signup" className="text-base font-medium">{t("auth.signUp")}</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin">
                    <div className="space-y-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border-gray-300 flex items-center justify-center gap-3 text-base"
                        onClick={handleGoogleSignIn}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continuar con Google
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">o con email</span>
                        </div>
                      </div>

                      <form onSubmit={handleSignIn} className="space-y-4 w-full overflow-hidden">
                        <div className="space-y-2 w-full">
                          <Label htmlFor="signin-email">{t("auth.email")}</Label>
                          <div className="relative w-full overflow-hidden box-border">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                            <Input
                              id="signin-email"
                              type="email"
                              inputMode="email"
                              placeholder={t("auth.emailPlaceholder")}
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="pl-10 h-12 w-full max-w-full"
                              autoComplete="email"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="signin-password">{t("auth.password")}</Label>
                            <Button 
                              type="button"
                              variant="link"
                              className="px-0 h-auto text-xs text-primary hover:text-primary/80"
                              onClick={() => setShowResetPassword(true)}
                            >
                              ¿Olvidaste tu contraseña?
                            </Button>
                          </div>
                          <PasswordInput
                            id="signin-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all" 
                          disabled={loading}
                        >
                          {loading ? "Ingresando..." : (
                            <span className="flex items-center gap-2">
                              Iniciar Sesión
                              <ArrowRight className="h-5 w-5" />
                            </span>
                          )}
                        </Button>
                      </form>
                    </div>
                  </TabsContent>

                  <TabsContent value="signup">
                    <div className="space-y-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border-gray-300 flex items-center justify-center gap-3 text-base"
                        onClick={handleGoogleSignIn}
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Registrarse con Google
                      </Button>

                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">o con email</span>
                        </div>
                      </div>

                      <form onSubmit={handleSignUp} className="space-y-4 w-full overflow-hidden">
                        <div className="space-y-2 w-full">
                          <Label htmlFor="signup-name">{t("auth.name")}</Label>
                          <div className="relative w-full overflow-hidden box-border">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                            <Input
                              id="signup-name"
                              type="text"
                              placeholder={t("auth.namePlaceholder")}
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              required
                              className="pl-10 h-12 w-full max-w-full"
                              autoComplete="name"
                            />
                          </div>
                        </div>
                        <div className="space-y-2 w-full">
                          <Label htmlFor="signup-email">{t("auth.email")}</Label>
                          <div className="relative w-full overflow-hidden box-border">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                            <Input
                              id="signup-email"
                              type="email"
                              inputMode="email"
                              placeholder={t("auth.emailPlaceholder")}
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="pl-10 h-12 w-full max-w-full"
                              autoComplete="email"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password">{t("auth.password")}</Label>
                          <PasswordInput
                            id="signup-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                          />
                          <p className="text-xs text-muted-foreground">
                            Incluye mayúsculas, minúsculas y números
                          </p>
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all" 
                          disabled={loading}
                        >
                          {loading ? "Creando cuenta..." : (
                            <span className="flex items-center gap-2">
                              Crear Cuenta Gratis
                              <ArrowRight className="h-5 w-5" />
                            </span>
                          )}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                          Al registrarte aceptas nuestros términos y política de privacidad
                        </p>
                      </form>
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Necesitas ayuda? <a href="/contact" className="text-primary hover:underline">Contáctanos</a>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Auth;
