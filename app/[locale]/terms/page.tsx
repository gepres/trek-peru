import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { FileText } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: locale === 'es' ? 'Términos de Uso | TrekPeru' : 'Terms of Use | TrekPeru',
    description:
      locale === 'es'
        ? 'Lee los términos y condiciones de uso de la plataforma TrekPeru.'
        : 'Read the terms and conditions of use for the TrekPeru platform.',
  };
}

// Sección de texto con título
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

// Página de Términos de Uso
export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const es = locale === 'es';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header locale={locale} />

      <main className="flex-1 pt-24 pb-16">
        {/* Header */}
        <section className="bg-muted/40 border-b py-14">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {es ? 'Documento legal' : 'Legal document'}
              </span>
            </div>
            <h1 className="text-4xl font-black text-foreground">
              {es ? 'Términos de Uso' : 'Terms of Use'}
            </h1>
            <p className="mt-3 text-muted-foreground">
              {es ? 'Última actualización: marzo de 2026' : 'Last updated: March 2026'}
            </p>
          </div>
        </section>

        {/* Contenido */}
        <article className="max-w-3xl mx-auto px-4 py-14 space-y-10">
          <Section title={es ? '1. Aceptación de los términos' : '1. Acceptance of Terms'}>
            <p>
              {es
                ? 'Al acceder y utilizar TrekPeru, aceptas estar sujeto a estos Términos de Uso. Si no estás de acuerdo con alguna parte de los términos, no podrás acceder al servicio.'
                : 'By accessing and using TrekPeru, you agree to be bound by these Terms of Use. If you disagree with any part of the terms, you may not access the service.'}
            </p>
          </Section>

          <Section title={es ? '2. Descripción del servicio' : '2. Description of Service'}>
            <p>
              {es
                ? 'TrekPeru es una plataforma colaborativa que permite a los usuarios registrar, compartir y organizar rutas de trekking en el Perú. El servicio incluye la publicación de rutas, gestión de grupos, comentarios y favoritos.'
                : 'TrekPeru is a collaborative platform that allows users to register, share and organize trekking routes in Peru. The service includes route publishing, group management, comments and favorites.'}
            </p>
          </Section>

          <Section title={es ? '3. Cuentas de usuario' : '3. User Accounts'}>
            <p>
              {es
                ? 'Para utilizar algunas funciones de TrekPeru debes crear una cuenta. Eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran bajo tu cuenta.'
                : 'To use some features of TrekPeru you must create an account. You are responsible for maintaining the confidentiality of your password and all activities that occur under your account.'}
            </p>
            <p>
              {es
                ? 'Debes proporcionar información precisa y completa al registrarte. No puedes usar una dirección de correo electrónico de otra persona ni crear una cuenta en su nombre.'
                : 'You must provide accurate and complete information when registering. You may not use another person\'s email address or create an account on their behalf.'}
            </p>
          </Section>

          <Section title={es ? '4. Contenido del usuario' : '4. User Content'}>
            <p>
              {es
                ? 'Al publicar rutas, comentarios, imágenes u otro contenido en TrekPeru, otorgas a la plataforma una licencia no exclusiva, libre de regalías y mundial para usar, reproducir y mostrar dicho contenido en el contexto del servicio.'
                : 'By posting routes, comments, images or other content on TrekPeru, you grant the platform a non-exclusive, royalty-free, worldwide license to use, reproduce and display such content in the context of the service.'}
            </p>
            <p>
              {es
                ? 'Eres el único responsable del contenido que publicas. No puedes publicar contenido que sea ilegal, ofensivo, engañoso o que infrinja derechos de terceros.'
                : 'You are solely responsible for the content you post. You may not post content that is illegal, offensive, misleading or that infringes third-party rights.'}
            </p>
          </Section>

          <Section title={es ? '5. Seguridad y responsabilidad' : '5. Safety and Liability'}>
            <p>
              {es
                ? 'TrekPeru proporciona información sobre rutas de trekking con fines informativos. La práctica del trekking implica riesgos inherentes. Eres responsable de evaluar tu nivel de experiencia, condición física y de tomar las precauciones de seguridad adecuadas antes de emprender cualquier ruta.'
                : 'TrekPeru provides trekking route information for informational purposes only. Trekking involves inherent risks. You are responsible for evaluating your experience level, physical condition and taking appropriate safety precautions before undertaking any route.'}
            </p>
            <p>
              {es
                ? 'TrekPeru no se hace responsable de accidentes, lesiones, pérdidas o daños que puedan ocurrir durante la práctica del trekking, independientemente de la información proporcionada en la plataforma.'
                : 'TrekPeru is not responsible for accidents, injuries, losses or damages that may occur during trekking, regardless of the information provided on the platform.'}
            </p>
          </Section>

          <Section title={es ? '6. Conducta prohibida' : '6. Prohibited Conduct'}>
            <p>{es ? 'Está prohibido:' : 'The following is prohibited:'}</p>
            <ul className="list-disc pl-5 space-y-1">
              {(es
                ? [
                    'Publicar información falsa o engañosa sobre rutas.',
                    'Acosar, intimidar o amenazar a otros usuarios.',
                    'Intentar acceder sin autorización a otros sistemas o cuentas.',
                    'Usar la plataforma para actividades comerciales no autorizadas.',
                    'Publicar contenido que infrinja derechos de autor o propiedad intelectual.',
                  ]
                : [
                    'Posting false or misleading route information.',
                    'Harassing, intimidating, or threatening other users.',
                    'Attempting unauthorized access to other systems or accounts.',
                    'Using the platform for unauthorized commercial activities.',
                    'Posting content that infringes copyright or intellectual property.',
                  ]
              ).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>

          <Section title={es ? '7. Modificaciones del servicio' : '7. Service Modifications'}>
            <p>
              {es
                ? 'TrekPeru se reserva el derecho de modificar o discontinuar el servicio en cualquier momento, con o sin previo aviso. No seremos responsables ante ti ni ante terceros por ninguna modificación, suspensión o discontinuación del servicio.'
                : 'TrekPeru reserves the right to modify or discontinue the service at any time, with or without notice. We will not be liable to you or any third party for any modification, suspension or discontinuation of the service.'}
            </p>
          </Section>

          <Section title={es ? '8. Ley aplicable' : '8. Governing Law'}>
            <p>
              {es
                ? 'Estos términos se regirán e interpretarán de acuerdo con las leyes de la República del Perú. Cualquier disputa que surja en relación con estos términos estará sujeta a la jurisdicción exclusiva de los tribunales de Lima, Perú.'
                : "These terms shall be governed and construed in accordance with the laws of the Republic of Peru. Any disputes arising in connection with these terms shall be subject to the exclusive jurisdiction of the courts of Lima, Peru."}
            </p>
          </Section>

          <Section title={es ? '9. Contacto' : '9. Contact'}>
            <p>
              {es
                ? 'Si tienes preguntas sobre estos Términos de Uso, puedes contactarnos a través de nuestra '
                : 'If you have questions about these Terms of Use, you can contact us through our '}
              <a href={`/${locale}/contact`} className="text-primary underline underline-offset-4 hover:opacity-80">
                {es ? 'página de contacto' : 'contact page'}
              </a>
              .
            </p>
          </Section>
        </article>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
