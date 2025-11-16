import { auth } from '@/auth';
import SessionProvider from '@/components/SessionProvider';
import './globals.css';
import { getTextDirection } from '@/utils/locale';
import { LocaleProvider } from '@/contexts/LocaleContext';
import Header from '@/components/layout/header/Header';
import { Alexandria } from 'next/font/google';
 const alexandria = Alexandria({
  weight: ['200', '400', '700'],
  subsets: ['latin'],
  display: 'swap',
}); 
export const metadata = {
  title: 'La Jolie',
  description: 'E-commerce store',
};

export default async function RootLayout({ children, params }) {
  const session = await auth();
  const { locale } = await params;
  const direction = getTextDirection(locale);
  return (
    <html lang={locale} dir={direction}>
      <body cz-shortcut-listen="true" className={alexandria.className}>
        <SessionProvider session={session}>
          <LocaleProvider>

<Header locale={locale}/>
          {children}
          </LocaleProvider>
        </SessionProvider>
      </body>
    </html>
  );
}