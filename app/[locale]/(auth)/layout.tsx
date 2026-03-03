import type { Metadata } from 'next';

// Páginas de auth no deben indexarse: son privadas y sin valor SEO
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Layout para páginas de autenticación (login, register)
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-lg">
        {children}
      </div>
    </div>
  );
}
