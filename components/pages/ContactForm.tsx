'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import emailjs from '@emailjs/browser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Send, CheckCircle2 } from 'lucide-react';

// Schema de validación del formulario de contacto
const contactSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
  email: z.string().email({ message: 'Ingresa un correo electrónico válido.' }),
  subject: z.string().min(3, { message: 'El asunto debe tener al menos 3 caracteres.' }),
  message: z.string().min(20, { message: 'El mensaje debe tener al menos 20 caracteres.' }),
});

type ContactInput = z.infer<typeof contactSchema>;

interface ContactFormProps {
  locale: string;
}

// Formulario de contacto — envía correo vía EmailJS
export function ContactForm({ locale }: ContactFormProps) {
  const t = useTranslations('contact');
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
  });

  async function onSubmit(data: ContactInput) {
    try {
      setIsLoading(true);

      // Enviar correo a través de EmailJS
      // Las variables del template deben coincidir con las configuradas en template_uhhyjuu
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
        {
          from_name: data.name,
          from_email: data.email,
          subject: data.subject,
          message: data.message,
          reply_to: data.email,
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
      );

      setSent(true);
      reset();
    } catch (err) {
      console.error('Error al enviar formulario de contacto:', err);
      toast({
        title: t('sendError'),
        description: t('sendErrorDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Estado de éxito tras enviar
  if (sent) {
    return (
      <div className="flex flex-col items-center text-center py-10 space-y-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground">
          {t('messageSent')}
        </h3>
        <p className="text-muted-foreground max-w-sm">
          {t('messageSentDesc')}
        </p>
        <Button variant="outline" onClick={() => setSent(false)} className="mt-2">
          {t('sendAnother')}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Nombre */}
      <div className="space-y-2">
        <Label htmlFor="name">{t('nameLabel')}</Label>
        <Input
          id="name"
          placeholder={t('namePlaceholder')}
          {...register('name')}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t('emailPlaceholder')}
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Asunto */}
      <div className="space-y-2">
        <Label htmlFor="subject">{t('subjectLabel')}</Label>
        <Input
          id="subject"
          placeholder={t('subjectPlaceholder')}
          {...register('subject')}
          disabled={isLoading}
        />
        {errors.subject && (
          <p className="text-sm text-red-600">{errors.subject.message}</p>
        )}
      </div>

      {/* Mensaje */}
      <div className="space-y-2">
        <Label htmlFor="message">{t('messageLabel')}</Label>
        <Textarea
          id="message"
          rows={6}
          placeholder={t('messagePlaceholder')}
          {...register('message')}
          disabled={isLoading}
          className="resize-none"
        />
        {errors.message && (
          <p className="text-sm text-red-600">{errors.message.message}</p>
        )}
      </div>

      {/* Submit */}
      <Button type="submit" className="w-full gap-2" disabled={isLoading}>
        {isLoading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
            {t('sending')}
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            {t('sendMessage')}
          </>
        )}
      </Button>
    </form>
  );
}
