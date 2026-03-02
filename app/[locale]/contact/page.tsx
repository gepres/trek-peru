import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ContactForm } from '@/components/pages/ContactForm';
import { Mail, MapPin, Clock, MessageCircle } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: locale === 'es' ? 'Contacto | TrekPeru' : 'Contact | TrekPeru',
    description:
      locale === 'es'
        ? 'Ponte en contacto con el equipo de TrekPeru. Estamos aquí para ayudarte.'
        : 'Get in touch with the TrekPeru team. We are here to help you.',
  };
}

// Página de contacto con formulario EmailJS
export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const es = locale === 'es';

  const info = [
    {
      icon: Mail,
      label: es ? 'Correo electrónico' : 'Email',
      value: 'genaropretill@gmail.com',
    },
    {
      icon: MapPin,
      label: es ? 'Ubicación' : 'Location',
      value: es ? 'Lima, Perú' : 'Lima, Peru',
    },
    {
      icon: Clock,
      label: es ? 'Tiempo de respuesta' : 'Response time',
      value: es ? 'En menos de 24 horas' : 'Within 24 hours',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header locale={locale} />

      <main className="flex-1 pt-24 pb-16">
        {/* Header */}
        <section className="bg-primary text-primary-foreground py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 mb-5">
              <MessageCircle className="h-7 w-7" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-3">
              {es ? 'Contáctanos' : 'Contact Us'}
            </h1>
            <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">
              {es
                ? '¿Tienes una pregunta, sugerencia o encontraste un error? Escríbenos, estamos para ayudarte.'
                : 'Have a question, suggestion or found a bug? Write to us, we are here to help.'}
            </p>
          </div>
        </section>

        {/* Contenido: info + formulario */}
        <section className="max-w-5xl mx-auto px-4 py-14">
          <div className="grid md:grid-cols-5 gap-12">
            {/* Info de contacto */}
            <div className="md:col-span-2 space-y-8">
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  {es ? 'Información de contacto' : 'Contact information'}
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {es
                    ? 'Puedes contactarnos a través del formulario o directamente por correo electrónico. Respondemos todos los mensajes.'
                    : 'You can contact us through the form or directly by email. We reply to all messages.'}
                </p>
              </div>

              <div className="space-y-5">
                {info.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-4">
                    <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-0.5">
                        {label}
                      </p>
                      <p className="text-sm font-semibold text-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Temas frecuentes */}
              <div className="p-4 rounded-xl border bg-muted/30 space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  {es ? 'Temas frecuentes' : 'Common topics'}
                </p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {(es
                    ? [
                        '🗺️ Reportar información incorrecta en una ruta',
                        '🐛 Reportar un error en la plataforma',
                        '💡 Sugerencias de mejora',
                        '🤝 Colaboraciones y alianzas',
                        '📋 Solicitud de eliminación de datos',
                      ]
                    : [
                        '🗺️ Report incorrect route information',
                        '🐛 Report a platform bug',
                        '💡 Improvement suggestions',
                        '🤝 Collaborations and partnerships',
                        '📋 Data deletion request',
                      ]
                  ).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Formulario */}
            <div className="md:col-span-3">
              <div className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-6">
                  {es ? 'Envíanos un mensaje' : 'Send us a message'}
                </h2>
                <ContactForm locale={locale} />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer locale={locale} />
    </div>
  );
}
