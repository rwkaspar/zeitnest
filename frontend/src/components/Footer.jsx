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
    supportTitle: 'Zeitnest unterstützen:',
    madeBy: 'Ein Projekt von Neotactiq →',
  },
  en: {
    supportTitle: 'Support Zeitnest:',
    madeBy: 'A project by Neotactiq →',
  },
};

function Footer() {
  const locale = getLocale();
  const t = STRINGS[locale] || STRINGS.de;

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-support">
          <span className="footer-support-title">{t.supportTitle}</span>
          <a
            href="https://patreon.com/neotactiq"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-support-link"
          >
            <span aria-hidden="true">💜</span> Patreon
          </a>
          <a
            href="https://ko-fi.com/neotactiq"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-support-link"
          >
            <span aria-hidden="true">☕</span> Ko-fi
          </a>
        </div>

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
