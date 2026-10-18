import type { Metadata } from 'next';
import { Hanken_Grotesk } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mesa — Management',
  description: 'Reservations, floor, and deposits for the host stand.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={hanken.variable}>
      <body className="font-sans antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--color-chalk)',
              border: '1px solid var(--color-line)',
              color: 'var(--color-ink)',
            },
          }}
        />
      </body>
    </html>
  );
}
