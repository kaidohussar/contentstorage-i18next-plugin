import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './i18n';

function App() {
  const { t, i18n } = useTranslation();
  const [name, setName] = useState('User');
  const [itemCount, setItemCount] = useState(5);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '50px auto', padding: '20px' }}>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>

      <div style={{ margin: '20px 0', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h3>Language Selection</h3>
        <button onClick={() => changeLanguage('en')}>English</button>
        <button onClick={() => changeLanguage('es')}>Español</button>
        <button onClick={() => changeLanguage('fr')}>Français</button>
        <button onClick={() => changeLanguage('de')}>Deutsch</button>
      </div>

      <div style={{ margin: '20px 0', padding: '20px', background: '#e7f3ff', borderRadius: '8px' }}>
        <h3>Dynamic Translations</h3>

        <div style={{ marginBottom: '15px' }}>
          <label>
            Name:
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ marginLeft: '10px', padding: '5px' }}
            />
          </label>
          <p>{t('greeting', { name })}</p>
        </div>

        <div>
          <label>
            Item Count:
            <input
              type="number"
              value={itemCount}
              onChange={(e) => setItemCount(parseInt(e.target.value) || 0)}
              style={{ marginLeft: '10px', padding: '5px', width: '80px' }}
            />
          </label>
          <p>{t('itemCount', { count: itemCount })}</p>
        </div>
      </div>

      <div style={{ margin: '20px 0', padding: '20px', background: '#fff3cd', borderRadius: '8px' }}>
        <h3>Live Editor Info</h3>
        <p>
          <strong>Current Language:</strong> {i18n.language}
        </p>
        <p>
          <strong>Memory Map Entries:</strong>{' '}
          {typeof window !== 'undefined' && (window as any).memoryMap
            ? (window as any).memoryMap.size
            : 'N/A'}
        </p>
        <p>
          <strong>Live Editor Mode:</strong>{' '}
          {typeof window !== 'undefined' && (window as any).memoryMap ? 'Enabled ✓' : 'Disabled'}
        </p>
      </div>
    </div>
  );
}

export default App;
