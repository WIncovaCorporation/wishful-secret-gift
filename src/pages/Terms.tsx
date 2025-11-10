import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Terms = () => {
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
            {language === 'es' ? 'Términos de Servicio' : 'Terms of Service'}
          </h1>
          <p className="text-muted-foreground mb-8">
            {language === 'es' ? 'Última actualización: 10 de noviembre de 2025' : 'Last updated: November 10, 2025'}
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {language === 'es' ? '1. Aceptación de los Términos' : '1. Acceptance of Terms'}
            </h2>
            <p className="text-foreground mb-4">
              {language === 'es' 
                ? 'Al acceder y usar GiftApp ("el Servicio"), aceptas estar sujeto a estos Términos de Servicio. Si no estás de acuerdo con alguna parte de estos términos, no puedes usar nuestro Servicio.'
                : 'By accessing and using GiftApp ("the Service"), you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our Service.'}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {language === 'es' ? '2. Descripción del Servicio' : '2. Service Description'}
            </h2>
            <p className="text-foreground mb-4">
              {language === 'es'
                ? 'GiftApp es una plataforma web que permite a los usuarios crear y gestionar listas de regalos, organizar grupos, planificar eventos especiales, buscar ideas de regalos y compartir listas con otros usuarios.'
                : 'GiftApp is a web platform that allows users to create and manage gift lists, organize groups, plan special events, search for gift ideas, and share lists with other users.'}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {language === 'es' ? '3. Elegibilidad' : '3. Eligibility'}
            </h2>
            <p className="text-foreground mb-4">
              {language === 'es'
                ? 'Debes tener al menos 16 años para usar este Servicio. Al registrarte, declaras que tienes la edad legal requerida, toda la información proporcionada es veraz y precisa, y mantendrás actualizada tu información de cuenta.'
                : 'You must be at least 16 years old to use this Service. By registering, you declare that you have the required legal age, all information provided is true and accurate, and you will keep your account information updated.'}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {language === 'es' ? '4. Uso Aceptable' : '4. Acceptable Use'}
            </h2>
            <div className="mb-4">
              <h3 className="text-xl font-medium text-foreground mb-2">
                {language === 'es' ? 'Está Permitido:' : 'Permitted:'}
              </h3>
              <ul className="list-disc pl-6 text-foreground space-y-2">
                <li>{language === 'es' ? 'Usar el Servicio para fines personales y no comerciales' : 'Use the Service for personal and non-commercial purposes'}</li>
                <li>{language === 'es' ? 'Crear y compartir listas de regalos' : 'Create and share gift lists'}</li>
                <li>{language === 'es' ? 'Colaborar con otros usuarios en grupos' : 'Collaborate with other users in groups'}</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-medium text-foreground mb-2">
                {language === 'es' ? 'Está Prohibido:' : 'Prohibited:'}
              </h3>
              <ul className="list-disc pl-6 text-foreground space-y-2">
                <li>{language === 'es' ? 'Usar el Servicio para actividades ilegales' : 'Use the Service for illegal activities'}</li>
                <li>{language === 'es' ? 'Publicar contenido ofensivo o discriminatorio' : 'Post offensive or discriminatory content'}</li>
                <li>{language === 'es' ? 'Intentar acceder a cuentas de otros usuarios' : 'Attempt to access other users\' accounts'}</li>
                <li>{language === 'es' ? 'Automatizar el acceso sin autorización' : 'Automate access without authorization'}</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {language === 'es' ? '5. Privacidad' : '5. Privacy'}
            </h2>
            <p className="text-foreground mb-4">
              {language === 'es'
                ? 'Tu privacidad es importante. Consulta nuestra '
                : 'Your privacy is important. Please review our '}
              <Link to="/privacy" className="text-primary hover:underline font-medium">
                {language === 'es' ? 'Política de Privacidad' : 'Privacy Policy'}
              </Link>
              {language === 'es'
                ? ' para entender cómo recopilamos, usamos y protegemos tu información.'
                : ' to understand how we collect, use, and protect your information.'}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {language === 'es' ? '6. Descargo de Responsabilidad' : '6. Disclaimer'}
            </h2>
            <p className="text-foreground mb-4">
              {language === 'es'
                ? 'EL SERVICIO SE PROPORCIONA "TAL CUAL" Y "SEGÚN DISPONIBILIDAD". NO GARANTIZAMOS QUE EL SERVICIO ESTÉ LIBRE DE ERRORES O INTERRUPCIONES. EN LA MÁXIMA MEDIDA PERMITIDA POR LEY, RECHAZAMOS TODAS LAS GARANTÍAS, EXPRESAS O IMPLÍCITAS.'
                : 'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE". WE DO NOT GUARANTEE THAT THE SERVICE WILL BE ERROR-FREE OR UNINTERRUPTED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED.'}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              {language === 'es' ? '7. Contacto' : '7. Contact'}
            </h2>
            <p className="text-foreground mb-4">
              {language === 'es' ? 'Para preguntas sobre estos Términos:' : 'For questions about these Terms:'}
            </p>
            <p className="text-foreground">
              <strong>Email:</strong> legal@giftapp.com<br />
              <strong>{language === 'es' ? 'Soporte' : 'Support'}:</strong> support@giftapp.com
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

export default Terms;
