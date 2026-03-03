import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Shield } from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://trek-peru.vercel.app';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEs = locale === 'es';

  const title = isEs ? 'Política de Privacidad' : 'Privacy Policy';
  const description = isEs
    ? 'Conoce cómo TrekPeru recopila, usa y protege tu información personal.'
    : 'Learn how TrekPeru collects, uses and protects your personal information.';
  const url = `${APP_URL}/${locale}/privacy`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        es: `${APP_URL}/es/privacy`,
        en: `${APP_URL}/en/privacy`,
        'x-default': `${APP_URL}/es/privacy`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: 'website' as const,
      locale: isEs ? 'es_PE' : 'en_US',
      alternateLocale: isEs ? 'en_US' : 'es_PE',
      images: [{ url: '/images/logo/logo-trek.png', width: 512, height: 512, alt: 'TrekPeru' }],
    },
    twitter: {
      card: 'summary' as const,
      title,
      description,
      images: ['/images/logo/logo-trek.png'],
    },
  };
}

// Sección con título
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <div className="text-muted-foreground leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

// Página de Política de Privacidad
export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
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
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {es ? 'Documento legal' : 'Legal document'}
              </span>
            </div>
            <h1 className="text-4xl font-black text-foreground">
              {es ? 'Política de Privacidad' : 'Privacy Policy'}
            </h1>
            <p className="mt-3 text-muted-foreground">
              {es ? 'Última actualización: marzo de 2026' : 'Last updated: March 2026'}
            </p>
          </div>
        </section>

        {/* Contenido */}
        <article className="max-w-3xl mx-auto px-4 py-14 space-y-10">
          <Section title={es ? '1. Información que recopilamos' : '1. Information We Collect'}>
            <p>
              {es
                ? 'Al registrarte en TrekPeru recopilamos la siguiente información:'
                : 'When you register with TrekPeru we collect the following information:'}
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {(es
                ? [
                    'Nombre completo y nombre de usuario.',
                    'Dirección de correo electrónico.',
                    'Número de teléfono (opcional).',
                    'Foto de perfil (si la proporcionas).',
                    'Rutas, comentarios y favoritos que publicas en la plataforma.',
                  ]
                : [
                    'Full name and username.',
                    'Email address.',
                    'Phone number (optional).',
                    'Profile photo (if provided).',
                    'Routes, comments and favorites you post on the platform.',
                  ]
              ).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>

          <Section title={es ? '2. Cómo usamos tu información' : '2. How We Use Your Information'}>
            <p>
              {es
                ? 'Utilizamos la información recopilada para:'
                : 'We use the collected information to:'}
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {(es
                ? [
                    'Proporcionar y mantener el servicio de TrekPeru.',
                    'Personalizar tu experiencia en la plataforma.',
                    'Enviarte notificaciones relevantes sobre tus rutas y actividades.',
                    'Mejorar y optimizar la plataforma.',
                    'Cumplir con obligaciones legales.',
                  ]
                : [
                    'Provide and maintain the TrekPeru service.',
                    'Personalize your experience on the platform.',
                    'Send you relevant notifications about your routes and activities.',
                    'Improve and optimize the platform.',
                    'Comply with legal obligations.',
                  ]
              ).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>

          <Section title={es ? '3. Almacenamiento y seguridad' : '3. Storage and Security'}>
            <p>
              {es
                ? 'Tu información se almacena de forma segura en los servidores de Supabase, que cumplen con estándares de seguridad de la industria incluyendo cifrado en tránsito (TLS) y en reposo. Implementamos medidas técnicas y organizativas apropiadas para proteger tus datos contra acceso no autorizado, alteración, divulgación o destrucción.'
                : 'Your information is securely stored on Supabase servers, which comply with industry security standards including encryption in transit (TLS) and at rest. We implement appropriate technical and organizational measures to protect your data against unauthorized access, alteration, disclosure or destruction.'}
            </p>
          </Section>

          <Section title={es ? '4. Compartir información con terceros' : '4. Sharing Information with Third Parties'}>
            <p>
              {es
                ? 'No vendemos, intercambiamos ni transferimos tu información personal a terceros, excepto en los siguientes casos:'
                : 'We do not sell, trade or transfer your personal information to third parties, except in the following cases:'}
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {(es
                ? [
                    'Proveedores de servicios que nos ayudan a operar la plataforma (como Supabase para base de datos y autenticación, o Mapbox para mapas), sujetos a acuerdos de confidencialidad.',
                    'Cuando sea requerido por ley o por autoridades competentes.',
                    'Para proteger los derechos, propiedad o seguridad de TrekPeru, sus usuarios u otros.',
                  ]
                : [
                    'Service providers who help us operate the platform (such as Supabase for database and authentication, or Mapbox for maps), subject to confidentiality agreements.',
                    'When required by law or by competent authorities.',
                    "To protect the rights, property or safety of TrekPeru, its users or others.",
                  ]
              ).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Section>

          <Section title={es ? '5. Cookies y tecnologías de seguimiento' : '5. Cookies and Tracking Technologies'}>
            <p>
              {es
                ? 'TrekPeru utiliza cookies esenciales para mantener tu sesión autenticada. No utilizamos cookies de rastreo con fines publicitarios. Las cookies esenciales son necesarias para el funcionamiento correcto de la plataforma y no pueden desactivarse.'
                : 'TrekPeru uses essential cookies to maintain your authenticated session. We do not use tracking cookies for advertising purposes. Essential cookies are necessary for the correct functioning of the platform and cannot be disabled.'}
            </p>
          </Section>

          <Section title={es ? '6. Tus derechos' : '6. Your Rights'}>
            <p>
              {es
                ? 'Tienes derecho a:'
                : 'You have the right to:'}
            </p>
            <ul className="list-disc pl-5 space-y-1">
              {(es
                ? [
                    'Acceder a la información personal que tenemos sobre ti.',
                    'Solicitar la corrección de información inexacta.',
                    'Solicitar la eliminación de tu cuenta y datos personales.',
                    'Oponerte al procesamiento de tus datos en determinadas circunstancias.',
                    'Exportar tus datos en un formato portable.',
                  ]
                : [
                    'Access the personal information we hold about you.',
                    'Request correction of inaccurate information.',
                    'Request deletion of your account and personal data.',
                    'Object to the processing of your data in certain circumstances.',
                    'Export your data in a portable format.',
                  ]
              ).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>
              {es
                ? 'Para ejercer cualquiera de estos derechos, contáctanos a través de nuestra '
                : 'To exercise any of these rights, contact us through our '}
              <a href={`/${locale}/contact`} className="text-primary underline underline-offset-4 hover:opacity-80">
                {es ? 'página de contacto' : 'contact page'}
              </a>
              .
            </p>
          </Section>

          <Section title={es ? '7. Retención de datos' : '7. Data Retention'}>
            <p>
              {es
                ? 'Conservamos tu información personal mientras tu cuenta esté activa o según sea necesario para prestarte servicios. Si eliminas tu cuenta, eliminaremos o anonimizaremos tu información personal, salvo que la ley nos obligue a conservarla.'
                : 'We retain your personal information while your account is active or as necessary to provide you with services. If you delete your account, we will delete or anonymize your personal information, unless the law requires us to retain it.'}
            </p>
          </Section>

          <Section title={es ? '8. Cambios a esta política' : '8. Changes to This Policy'}>
            <p>
              {es
                ? 'Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos sobre cambios significativos publicando la nueva política en esta página con la fecha de actualización. Te recomendamos revisar esta página periódicamente.'
                : 'We may update this Privacy Policy periodically. We will notify you of significant changes by posting the new policy on this page with the update date. We recommend reviewing this page periodically.'}
            </p>
          </Section>

          <Section title={es ? '9. Contacto' : '9. Contact'}>
            <p>
              {es
                ? 'Si tienes preguntas sobre esta Política de Privacidad o sobre el tratamiento de tus datos, contáctanos a través de nuestra '
                : 'If you have questions about this Privacy Policy or the processing of your data, contact us through our '}
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
