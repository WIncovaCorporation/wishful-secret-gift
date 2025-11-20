import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Gift } from 'lucide-react';

const Footer = () => {
  const { language } = useLanguage();

  return (
    <footer className="border-t border-border bg-muted mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Gift className="h-6 w-6 text-primary" aria-hidden="true" />
              <span className="text-xl font-bold text-foreground">Givlyn</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              {language === 'es'
                ? 'La mejor manera de organizar tus regalos y celebraciones.'
                : 'The best way to organize your gifts and celebrations.'}
            </p>
            <p className="text-xs text-muted-foreground italic">
              {language === 'es'
                ? 'Givlyn es un producto de Wincova Corporation'
                : 'Givlyn is a product of Wincova Corporation'}
            </p>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              {language === 'es' ? 'Legal' : 'Legal'}
            </h3>
            <nav aria-label={language === 'es' ? 'Enlaces legales' : 'Legal links'}>
              <ul className="space-y-2">
                <li>
                  <Link 
                    to="/terms" 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    aria-label={language === 'es' ? 'Ver términos de servicio' : 'View terms of service'}
                  >
                    {language === 'es' ? 'Términos de Servicio' : 'Terms of Service'}
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/privacy" 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    aria-label={language === 'es' ? 'Ver política de privacidad' : 'View privacy policy'}
                  >
                    {language === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/how-it-works" 
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    aria-label={language === 'es' ? 'Cómo funciona Givlyn' : 'How Givlyn works'}
                  >
                    {language === 'es' ? 'Cómo Funciona' : 'How It Works'}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">
              {language === 'es' ? 'Contacto' : 'Contact'}
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex flex-col gap-1">
                <span className="font-medium text-foreground">
                  {language === 'es' ? 'Dirección:' : 'Address:'}
                </span>
                <span>2615 Medical Center Parkway, Suite 1560</span>
                <span>Murfreesboro, TN 37129</span>
              </li>
              <li>
                <span className="font-medium text-foreground">
                  {language === 'es' ? 'Teléfono:' : 'Phone:'}
                </span>{' '}
                <a 
                  href="tel:+16157289932" 
                  className="hover:text-primary transition-colors"
                >
                  +1 615-728-9932
                </a>
              </li>
              <li>
                <a 
                  href="mailto:hello@givlyn.com" 
                  className="hover:text-primary transition-colors"
                  aria-label={language === 'es' ? 'Enviar correo' : 'Send email'}
                >
                  hello@givlyn.com
                </a>
              </li>
              <li>
                <a 
                  href="mailto:support@givlyn.com" 
                  className="hover:text-primary transition-colors"
                  aria-label={language === 'es' ? 'Enviar correo a soporte' : 'Send email to support'}
                >
                  support@givlyn.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© 2025 Wincova Corporation. {language === 'es' ? 'Todos los derechos reservados.' : 'All rights reserved.'}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
