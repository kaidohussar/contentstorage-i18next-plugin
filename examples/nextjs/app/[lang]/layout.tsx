'use client';

import { useEffect } from 'react';
import i18next from '../i18n';

export default function RootLayout({
  children,
  params: { lang },
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  useEffect(() => {
    // Change language when route parameter changes
    i18next.changeLanguage(lang);
  }, [lang]);

  return (
    <html lang={lang}>
      <head>
        <title>ContentStorage i18next Plugin - Next.js Example</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
