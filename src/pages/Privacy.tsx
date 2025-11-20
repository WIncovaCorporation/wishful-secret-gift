import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Privacy = () => {
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {language === 'es' ? 'Volver' : 'Back'}
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {language === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}
          </h1>
          <p className="text-muted-foreground mb-4">
            {language === 'es' ? 'Última actualización: 20 de noviembre de 2025' : 'Last updated: November 20, 2025'}
          </p>
          <p className="text-sm text-muted-foreground mb-8">
            {language === 'es' ? 'Responsable del Tratamiento: Wincova Corporation' : 'Data Controller: Wincova Corporation'}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {language === 'es' ? '1. Introducción' : '1. Introduction'}
            </h2>
            <p className="text-foreground mb-4">
              {language === 'es'
                ? 'Bienvenido a Givlyn, un producto de Wincova Corporation. Nos comprometemos a proteger tu privacidad y tus datos personales. Esta Política de Privacidad explica cómo recopilamos, usamos, almacenamos y protegemos tu información de acuerdo con el RGPD (Reglamento General de Protección de Datos) y la CCPA (Ley de Privacidad del Consumidor de California).'
                : 'Welcome to Givlyn, a product of Wincova Corporation. We are committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, store, and protect your information in accordance with GDPR (General Data Protection Regulation) and CCPA (California Consumer Privacy Act).'}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {language === 'es' ? '2. Información que Recopilamos' : '2. Information We Collect'}
            </h2>
            <div className="mb-4">
              <h3 className="text-xl font-medium text-foreground mb-2">
                {language === 'es' ? 'Información que Proporcionas:' : 'Information You Provide:'}
              </h3>
              <ul className="list-disc pl-6 text-foreground space-y-2">
                <li>{language === 'es' ? 'Datos de cuenta: correo electrónico, nombre, contraseña (encriptada)' : 'Account data: email, name, password (encrypted)'}</li>
                <li>{language === 'es' ? 'Listas de regalos: títulos, descripciones, productos guardados' : 'Gift lists: titles, descriptions, saved products'}</li>
                <li>{language === 'es' ? 'Grupos y eventos: nombres, fechas, participantes' : 'Groups and events: names, dates, participants'}</li>
                <li>{language === 'es' ? 'Preferencias: configuración de idioma, notificaciones' : 'Preferences: language settings, notifications'}</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-medium text-foreground mb-2">
                {language === 'es' ? 'Información Recopilada Automáticamente:' : 'Automatically Collected Information:'}
              </h3>
              <ul className="list-disc pl-6 text-foreground space-y-2">
                <li>{language === 'es' ? 'Datos técnicos: dirección IP, tipo de navegador, sistema operativo' : 'Technical data: IP address, browser type, operating system'}</li>
                <li>{language === 'es' ? 'Datos de uso: páginas visitadas, funciones utilizadas' : 'Usage data: pages visited, features used'}</li>
                <li>{language === 'es' ? 'Cookies: identificadores de sesión, preferencias' : 'Cookies: session identifiers, preferences'}</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {language === 'es' ? '3. Cómo Usamos tu Información' : '3. How We Use Your Information'}
            </h2>
            <ul className="list-disc pl-6 text-foreground space-y-2">
              <li>{language === 'es' ? 'Proporcionar y mejorar nuestros servicios' : 'Provide and improve our services'}</li>
              <li>{language === 'es' ? 'Personalizar tu experiencia' : 'Personalize your experience'}</li>
              <li>{language === 'es' ? 'Enviar notificaciones relacionadas con el servicio' : 'Send service-related notifications'}</li>
              <li>{language === 'es' ? 'Analizar el uso de la plataforma' : 'Analyze platform usage'}</li>
              <li>{language === 'es' ? 'Proteger contra fraude y abuso' : 'Protect against fraud and abuse'}</li>
              <li>{language === 'es' ? 'Generar enlaces de afiliados para recomendaciones de productos' : 'Generate affiliate links for product recommendations'}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {language === 'es' ? '4. Divulgación de Enlaces de Afiliados' : '4. Affiliate Links Disclosure'}
            </h2>
            <div className="bg-muted/50 border-l-4 border-primary p-6 rounded-lg mb-4">
              <p className="text-foreground mb-4">
                {language === 'es'
                  ? 'Givlyn participa en programas de afiliados con Amazon, Walmart, Target, Best Buy, Etsy y otros retailers. Cuando haces clic en un enlace de producto y realizas una compra, podemos recibir una pequeña comisión sin costo adicional para ti.'
                  : 'Givlyn participates in affiliate programs with Amazon, Walmart, Target, Best Buy, Etsy, and other retailers. When you click on a product link and make a purchase, we may receive a small commission at no additional cost to you.'}
              </p>
              <p className="text-foreground mb-4">
                <strong>{language === 'es' ? 'Cómo funciona:' : 'How it works:'}</strong>
              </p>
              <ul className="list-disc pl-6 text-foreground space-y-2 mb-4">
                <li>{language === 'es' ? 'Tú pagas el mismo precio que pagarías comprando directamente en la tienda' : 'You pay the same price you would pay buying directly from the store'}</li>
                <li>{language === 'es' ? 'La tienda nos compensa con una comisión (típicamente 3-10%) de su margen de ganancia' : 'The store compensates us with a commission (typically 3-10%) from their profit margin'}</li>
                <li>{language === 'es' ? 'Usamos estas comisiones para mantener Givlyn 100% gratis para ti' : 'We use these commissions to keep Givlyn 100% free for you'}</li>
                <li>{language === 'es' ? 'Nunca recomendamos productos basados en comisiones, sino en valor real para el usuario' : 'We never recommend products based on commissions, but on real value for the user'}</li>
              </ul>
              <p className="text-foreground">
                {language === 'es'
                  ? 'Participamos en el Programa de Asociados de Amazon Services LLC, un programa de publicidad de afiliados diseñado para proporcionar un medio para que los sitios ganen tarifas de publicidad mediante la publicidad y el enlace a Amazon.com. También participamos en programas similares con Walmart.com, Target.com, BestBuy.com y Etsy.com.'
                  : 'We participate in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.com. We also participate in similar programs with Walmart.com, Target.com, BestBuy.com, and Etsy.com.'}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              {language === 'es'
                ? 'Para más detalles sobre cómo funciona nuestro modelo de comisiones, visita nuestra página '
                : 'For more details on how our commission model works, visit our '}
              <Link to="/how-it-works" className="text-primary hover:underline">
                {language === 'es' ? 'Cómo Funciona' : 'How It Works'}
              </Link>
              {language === 'es' ? '.' : ' page.'}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {language === 'es' ? '5. Tus Derechos' : '5. Your Rights'}
            </h2>
            <div className="mb-4">
              <h3 className="text-xl font-medium text-foreground mb-2">
                {language === 'es' ? 'Derechos bajo RGPD (Usuarios en la UE):' : 'Rights under GDPR (EU Users):'}
              </h3>
              <ul className="list-disc pl-6 text-foreground space-y-2">
                <li><strong>{language === 'es' ? 'Acceso' : 'Access'}:</strong> {language === 'es' ? 'solicitar una copia de tus datos' : 'request a copy of your data'}</li>
                <li><strong>{language === 'es' ? 'Rectificación' : 'Rectification'}:</strong> {language === 'es' ? 'corregir datos incorrectos' : 'correct incorrect data'}</li>
                <li><strong>{language === 'es' ? 'Supresión' : 'Erasure'}:</strong> {language === 'es' ? 'solicitar la eliminación de tus datos ("derecho al olvido")' : 'request deletion of your data ("right to be forgotten")'}</li>
                <li><strong>{language === 'es' ? 'Portabilidad' : 'Portability'}:</strong> {language === 'es' ? 'recibir tus datos en formato estructurado' : 'receive your data in a structured format'}</li>
                <li><strong>{language === 'es' ? 'Oposición' : 'Objection'}:</strong> {language === 'es' ? 'oponerte al procesamiento de tus datos' : 'object to processing of your data'}</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-medium text-foreground mb-2">
                {language === 'es' ? 'Derechos bajo CCPA (Usuarios en California):' : 'Rights under CCPA (California Users):'}
              </h3>
              <ul className="list-disc pl-6 text-foreground space-y-2">
                <li><strong>{language === 'es' ? 'Conocer' : 'Know'}:</strong> {language === 'es' ? 'qué información recopilamos sobre ti' : 'what information we collect about you'}</li>
                <li><strong>{language === 'es' ? 'Eliminar' : 'Delete'}:</strong> {language === 'es' ? 'solicitar la eliminación de tu información' : 'request deletion of your information'}</li>
                <li><strong>{language === 'es' ? 'No vender' : 'Do not sell'}:</strong> {language === 'es' ? 'no vendemos tus datos' : 'we do not sell your data'}</li>
                <li><strong>{language === 'es' ? 'No discriminación' : 'Non-discrimination'}:</strong> {language === 'es' ? 'no serás discriminado por ejercer tus derechos' : 'you will not be discriminated against for exercising your rights'}</li>
              </ul>
            </div>
            <p className="text-foreground mt-4">
              {language === 'es' ? 'Para ejercer estos derechos, contacta: ' : 'To exercise these rights, contact: '}
              <a href="mailto:privacy@givlyn.com" className="text-primary hover:underline">privacy@givlyn.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {language === 'es' ? '5. Seguridad de Datos' : '5. Data Security'}
            </h2>
            <p className="text-foreground mb-4">
              {language === 'es'
                ? 'Implementamos medidas de seguridad técnicas y organizativas: encriptación SSL/TLS para datos en tránsito, encriptación de contraseñas (hashing), autenticación segura con tokens JWT, y políticas de seguridad a nivel de fila (RLS) en base de datos.'
                : 'We implement technical and organizational security measures: SSL/TLS encryption for data in transit, password encryption (hashing), secure authentication with JWT tokens, and row-level security (RLS) policies in the database.'}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {language === 'es' ? '6. Cookies' : '6. Cookies'}
            </h2>
            <p className="text-foreground mb-4">
              {language === 'es'
                ? 'Usamos cookies para mantener tu sesión activa, recordar tus preferencias y analizar el uso de la plataforma. Puedes controlar las cookies a través de la configuración de tu navegador.'
                : 'We use cookies to keep your session active, remember your preferences, and analyze platform usage. You can control cookies through your browser settings.'}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {language === 'es' ? '7. Contacto' : '7. Contact'}
            </h2>
            <div className="space-y-2 text-foreground">
              <p><strong>{language === 'es' ? 'Responsable del Tratamiento:' : 'Data Controller:'}</strong> Wincova Corporation</p>
              <p><strong>{language === 'es' ? 'Dirección:' : 'Address:'}</strong> 2615 Medical Center Parkway, Suite 1560, Murfreesboro, TN 37129</p>
              <p><strong>{language === 'es' ? 'Teléfono:' : 'Phone:'}</strong> +1 615-728-9932</p>
              <p><strong>Email Privacidad:</strong> <a href="mailto:privacy@givlyn.com" className="text-primary hover:underline">privacy@givlyn.com</a></p>
              <p><strong>Email Soporte:</strong> <a href="mailto:support@givlyn.com" className="text-primary hover:underline">support@givlyn.com</a></p>
              <p><strong>Email General:</strong> <a href="mailto:hello@givlyn.com" className="text-primary hover:underline">hello@givlyn.com</a></p>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <strong>{language === 'es' ? 'Versión:' : 'Version:'}</strong> 2.0<br />
              <strong>{language === 'es' ? 'Fecha de entrada en vigor:' : 'Effective date:'}</strong>{' '}
              {language === 'es' ? '20 de noviembre de 2025' : 'November 20, 2025'}
            </p>
          </div>
        </article>
      </main>
    </div>
  );
};

export default Privacy;
