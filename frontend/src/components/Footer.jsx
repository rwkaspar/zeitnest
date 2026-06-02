import React from 'react';

// i18n minimal: pick locale from <html lang> if set, default to DE
function getLocale() {
  if (typeof document !== 'undefined') {
    const lang = (document.documentElement.lang || '').toLowerCase();
    if (lang.startsWith('en')) return 'en';
  }
  return 'de';
}

const STRINGS = {
  de: {
    madeBy: 'Ein Projekt von NeoTactIQ →',
  },
  en: {
    madeBy: 'A project by NeoTactIQ →',
  },
};

function Footer() {
  const locale = getLocale();
  const t = STRINGS[locale] || STRINGS.de;

  return (
    <footer className="footer">
      <div className="container">

        <p>&copy; 2026 Zeitnest &middot; Zeit schenken. Zeit gewinnen.</p>
        <div className="footer-links">
          <a href="/leitfaden">Leitfaden</a>
          <a href="/agb">AGB</a>
          <a href="/datenschutz">Datenschutz</a>
          <a href="/impressum">Impressum</a>
        </div>
        <p className="footer-attribution">
          <a
            href="https://neotactiq.ai"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.madeBy}
          </a>
        </p>
      </div>
    </footer>
  );
}

export default Footer;
