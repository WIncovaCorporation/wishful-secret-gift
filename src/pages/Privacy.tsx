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
          <p className="text-muted-foreground mb-8">
            {language === 'es' ? 'Última actualización: 10 de noviembre de 2025' : 'Last updated: November 10, 2025'}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {language === 'es' ? '1. Introducción' : '1. Introduction'}
            </h2>
            <p className="text-foreground mb-4">
              {language === 'es'
                ? 'Bienvenido a GiftApp. Nos comprometemos a proteger tu privacidad y tus datos personales. Esta Política de Privacidad explica cómo recopilamos, usamos, almacenamos y protegemos tu información de acuerdo con el RGPD (Reglamento General de Protección de Datos) y la CCPA (Ley de Privacidad del Consumidor de California).'
                : 'Welcome to GiftApp. We are committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, store, and protect your information in accordance with GDPR (General Data Protection Regulation) and CCPA (California Consumer Privacy Act).'}
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
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {language === 'es' ? '4. Tus Derechos' : '4. Your Rights'}
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
              <a href="mailto:privacy@giftapp.com" className="text-primary hover:underline">privacy@giftapp.com</a>
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
            <p className="text-foreground mb-4">
              {language === 'es' ? 'Para preguntas sobre privacidad:' : 'For privacy questions:'}
            </p>
            <p className="text-foreground">
              <strong>Email:</strong> privacy@giftapp.com<br />
              <strong>{language === 'es' ? 'Responsable de Protección de Datos' : 'Data Protection Officer'}:</strong> dpo@giftapp.com
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              <strong>{language === 'es' ? 'Versión:' : 'Version:'}</strong> 1.0<br />
              <strong>{language === 'es' ? 'Fecha de entrada en vigor:' : 'Effective date:'}</strong>{' '}
              {language === 'es' ? '10 de noviembre de 2025' : 'November 10, 2025'}
            </p>
          </div>
        </article>
      </main>
    </div>
  );
};

export default Privacy;
