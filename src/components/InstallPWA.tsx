import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPWA = () => {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Detectar si ya está instalado (standalone mode)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(isInStandaloneMode);

    // Handler para el evento beforeinstallprompt (Android/Desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Solo mostrar si no se ha rechazado antes
      const hasDeclinedInstall = localStorage.getItem('pwa-install-declined');
      const declineTimestamp = hasDeclinedInstall ? parseInt(hasDeclinedInstall) : 0;
      const daysSinceDecline = (Date.now() - declineTimestamp) / (1000 * 60 * 60 * 24);
      
      // Mostrar de nuevo después de 7 días
      if (!hasDeclinedInstall || daysSinceDecline > 7) {
        // Esperar 5 segundos antes de mostrar el banner
        setTimeout(() => setShowBanner(true), 5000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // En iOS, mostrar banner después de 10 segundos si no está instalado
    if (isIOSDevice && !isInStandaloneMode) {
      const hasDeclinedInstall = localStorage.getItem('pwa-install-declined-ios');
      if (!hasDeclinedInstall) {
        setTimeout(() => setShowBanner(true), 10000);
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // Para iOS, el banner ya muestra las instrucciones
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowBanner(false);
      localStorage.removeItem('pwa-install-declined');
    } else {
      localStorage.setItem('pwa-install-declined', Date.now().toString());
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    if (isIOS) {
      localStorage.setItem('pwa-install-declined-ios', 'true');
    } else {
      localStorage.setItem('pwa-install-declined', Date.now().toString());
    }
  };

  // No mostrar si ya está instalado
  if (isStandalone || !showBanner) return null;

  return (
    <Card className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-[100] p-4 shadow-2xl bg-card border-2 border-primary/20 animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-lg bg-gradient-warm flex items-center justify-center flex-shrink-0 shadow-soft">
          <Download className="w-6 h-6 text-primary-foreground" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base mb-1">
            {isIOS ? '📲 Instala Givlyn' : '🚀 Instala Givlyn'}
          </h3>
          
          {isIOS ? (
            <div className="text-sm text-muted-foreground space-y-2 mb-3">
              <p className="mb-2">Accede más rápido desde tu pantalla de inicio:</p>
              <ol className="text-xs space-y-1 pl-4">
                <li>1. Toca el botón <strong>Compartir</strong> ⬆️</li>
                <li>2. Selecciona <strong>"Añadir a pantalla de inicio"</strong></li>
                <li>3. Toca <strong>"Añadir"</strong></li>
              </ol>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-3">
              Accede más rápido y usa la app sin conexión
            </p>
          )}
          
          <div className="flex gap-2">
            {!isIOS && (
              <Button 
                onClick={handleInstallClick} 
                size="sm" 
                className="flex-1 min-h-[48px]"
              >
                <Download className="w-4 h-4 mr-2" />
                Instalar
              </Button>
            )}
            <Button 
              onClick={handleDismiss} 
              size={isIOS ? "sm" : "icon"}
              variant="ghost"
              className={isIOS ? "flex-1 min-h-[48px]" : "min-w-[48px] min-h-[48px]"}
              aria-label="Cerrar"
            >
              {isIOS ? 'Entendido' : <X className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
