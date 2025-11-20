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
    
    // Validación básica
    if (!displayName.trim()) {
      toast.error(t("auth.nameRequired"));
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      toast.error(t("auth.signUpFailed"));
      return;
    }

    if (password.length < 6) {
      toast.error(t("auth.passwordMinLength"));
      return;
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

      // Verificar si el usuario ya existe
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        toast.error(t("auth.emailAlreadyExists"));
        return;
      }

      toast.success(t("auth.accountCreated"));
      // Limpiar formulario
      setEmail("");
      setPassword("");
      setDisplayName("");
    } catch (error: any) {
      if (error.message.includes("already registered") || error.message.includes("User already registered")) {
        toast.error(t("auth.emailAlreadyExists"));
      } else {
        toast.error(error.message || t("auth.signUpFailed"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    // Validación básica
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
      // Limpiar formulario
      setEmail("");
      setPassword("");
    } catch (error: any) {
      console.error("Error de inicio de sesión:", error);
      
      if (error.message.includes("Invalid login credentials") || error.message.includes("Invalid") || error.message.includes("credentials")) {
        toast.error("❌ Correo o contraseña incorrectos. Verifica tus datos.", {
          duration: 6000,
        });
        toast.info("💡 Si olvidaste tu contraseña, usa 'Olvidé mi contraseña'", {
          duration: 6000,
        });
      } else if (error.message.includes("Email not confirmed")) {
        toast.error("⚠️ Debes confirmar tu correo antes de iniciar sesión", {
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

    // Validación básica
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      toast.error("Por favor ingresa un correo válido");
      return;
    }

    setLoading(true);

    try {
      // Call edge function to generate link and send email
      const { error } = await supabase.functions.invoke('send-password-reset', {
        body: { email: normalizedEmail }
      });

      if (error) {
        console.error("Error al enviar correo:", error);
        throw error;
      }

      toast.success("✅ Correo de recuperación enviado exitosamente", {
        duration: 8000,
      });
      toast.info("📧 Revisa tu bandeja de entrada y SPAM. El correo puede tardar hasta 5 minutos.", {
        duration: 8000,
      });
      
      setShowResetPassword(false);
      setResetEmail("");
    } catch (error: any) {
      console.error("Error completo al enviar correo de recuperación:", error);
      
      if (error.message?.includes('Email not found') || error.message?.includes('User not found')) {
        toast.error("❌ Este correo no está registrado. Verifica el correo o regístrate primero.", {
          duration: 6000,
        });
      } else if (error.message?.includes('rate limit')) {
        toast.error("⏳ Demasiados intentos. Espera 5 minutos e intenta nuevamente.", {
          duration: 6000,
        });
      } else {
        toast.error("❌ Error al enviar correo. Intenta nuevamente o crea una cuenta nueva.", {
          duration: 6000,
        });
      }
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
                  <h3 className="text-lg font-semibold">{t("auth.resetPassword")}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t("auth.resetPasswordDesc")}
                  </p>
                </div>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">{t("auth.email")}</Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="tu-email@ejemplo.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                    <p className="text-xs text-muted-foreground">
                      ✉️ Ingresa el correo <strong>exacto</strong> con el que te registraste
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? "Enviando..." : "Enviar enlace de recuperación"}
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
                  <div className="space-y-2">
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 mb-1">
                        ⚠️ IMPORTANTE: Problemas con correo de recuperación
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Si no recibes el correo en 5 minutos:<br/>
                        1. Revisa SPAM/Promociones<br/>
                        2. Intenta crear una cuenta nueva con otro email<br/>
                        3. Contacta soporte si el problema persiste
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-xs text-muted-foreground">
                        💡 <strong>Alternativa:</strong> Si no funciona, puedes crear una nueva cuenta con un correo diferente.
                      </p>
                    </div>
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
                  <div className="space-y-4">
                    {/* Google Sign In Button */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-white hover:bg-gray-50 text-gray-700 border-gray-300 flex items-center justify-center gap-2"
                      onClick={handleGoogleSignIn}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continuar con Google
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">O continúa con email</span>
                      </div>
                    </div>

                    <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">{t("auth.email")}</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder={t("auth.emailPlaceholder")}
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
                        placeholder={t("auth.passwordPlaceholder")}
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
                      {t("auth.forgotPassword")}
                    </Button>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? t("auth.signingIn") : t("auth.signIn")}
                      </Button>
                    </form>
                  </div>
                </TabsContent>

                <TabsContent value="signup">
                  <div className="space-y-4">
                    {/* Google Sign In Button */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full bg-white hover:bg-gray-50 text-gray-700 border-gray-300 flex items-center justify-center gap-2"
                      onClick={handleGoogleSignIn}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continuar con Google
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">O continúa con email</span>
                      </div>
                    </div>

                    <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">{t("auth.name")}</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder={t("auth.namePlaceholder")}
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{t("auth.email")}</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder={t("auth.emailPlaceholder")}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{t("auth.password")}</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder={t("auth.passwordPlaceholder")}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <p className="text-xs text-muted-foreground">
                        {t("auth.passwordMinLength")}
                      </p>
                    </div>
                      <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
                      </Button>
                    </form>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Auth;