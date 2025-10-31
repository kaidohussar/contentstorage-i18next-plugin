'use client';

import { useState, useEffect } from 'react';
import i18next from '../i18n';

export default function HomePage({ params: { lang } }: { params: { lang: string } }) {
  const [translations, setTranslations] = useState({
    title: '',
    description: '',
    greeting: '',
  });

  const [name, setName] = useState('User');

  useEffect(() => {
    const updateTranslations = () => {
      setTranslations({
        title: i18next.t('homepage:title'),
        description: i18next.t('homepage:description'),
        greeting: i18next.t('common:greeting', { name }),
      });
    };

    // Initial load
    updateTranslations();

    // Listen for language changes
    i18next.on('languageChanged', updateTranslations);

    return () => {
      i18next.off('languageChanged', updateTranslations);
    };
  }, [name]);

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
      <h1>{translations.title}</h1>
      <p>{translations.description}</p>

      <div style={{ margin: '20px 0', padding: '20px', background: '#f5f5f5' }}>
        <h3>Language Selection</h3>
        <a href="/en" style={{ margin: '0 10px' }}>English</a>
        <a href="/es" style={{ margin: '0 10px' }}>Español</a>
        <a href="/fr" style={{ margin: '0 10px' }}>Français</a>
      </div>

      <div style={{ margin: '20px 0', padding: '20px', background: '#e7f3ff' }}>
        <h3>Dynamic Translation</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ padding: '5px', margin: '10px' }}
        />
        <p>{translations.greeting}</p>
      </div>
    </div>
  );
}
