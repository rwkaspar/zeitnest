import React from 'react';

function DatenschutzPage() {
  return (
    <div className="legal-page">
      <div className="container">
        <h1>Datenschutzerkl&auml;rung</h1>

        <h2>1. Verantwortlicher</h2>
        <p>
          Robert-William Kaspar<br />
          Webtools &amp; KI-Projekte<br />
          Kurt-Schumacher-Stra&szlig;e 76<br />
          c/o flexdienst &ndash; #11745<br />
          67663 Kaiserslautern<br />
          E-Mail: <a href="mailto:info@zeitnest.org">info@zeitnest.org</a>
        </p>

        <h2>2. Welche Daten wir erheben</h2>
        <p>Bei der Nutzung von Zeitnest werden folgende personenbezogene Daten verarbeitet:</p>
        <h3>2.1 Bei der Registrierung (Pflichtangaben)</h3>
        <ul>
          <li>Vorname und Nachname</li>
          <li>E-Mail-Adresse</li>
          <li>Passwort (wird verschl&uuml;sselt gespeichert)</li>
          <li>Rolle (Elternteil oder Leih-Gro&szlig;elternteil)</li>
        </ul>
        <h3>2.2 Freiwillige Profilangaben</h3>
        <ul>
          <li>Stadt und Postleitzahl</li>
          <li>Telefonnummer</li>
          <li>Profilbeschreibung (Bio)</li>
          <li>Angaben zu Erfahrung, Verf&uuml;gbarkeit und Aktivit&auml;ten</li>
          <li>Bei Eltern: Anzahl und Alter der Kinder</li>
        </ul>
        <h3>2.3 Nutzungsdaten</h3>
        <ul>
          <li>Nachrichten zwischen Nutzern</li>
          <li>Buchungen und Terminvereinbarungen</li>
          <li>Bewertungen</li>
        </ul>

        <h2>3. Zweck der Datenverarbeitung</h2>
        <p>Wir verarbeiten Ihre Daten ausschlie&szlig;lich f&uuml;r folgende Zwecke:</p>
        <ul>
          <li><strong>Bereitstellung der Plattform:</strong> Erstellung und Verwaltung Ihres Benutzerkontos (Art. 6 Abs. 1 lit. b DSGVO)</li>
          <li><strong>Vermittlung:</strong> Anzeige Ihres Profils f&uuml;r andere registrierte Nutzer zur Kontaktaufnahme (Art. 6 Abs. 1 lit. b DSGVO)</li>
          <li><strong>Kommunikation:</strong> Erm&ouml;glichung der Nachrichtenfunktion zwischen vermittelten Nutzern (Art. 6 Abs. 1 lit. b DSGVO)</li>
          <li><strong>Terminverwaltung:</strong> Buchung und Verwaltung von Betreuungszeiten (Art. 6 Abs. 1 lit. b DSGVO)</li>
        </ul>

        <h2>4. Besonderer Schutz von Kinderdaten</h2>
        <p>
          Zeitnest nimmt den Schutz von Daten, die Kinder betreffen, besonders ernst.
          Kinder werden nicht direkt als Nutzer registriert. Angaben zu Kindern (Alter, Anzahl)
          werden ausschlie&szlig;lich im Profil der Eltern gespeichert und nur registrierten
          Nutzern angezeigt. Es werden keine Namen oder sonstigen direkt identifizierenden
          Daten von Kindern erhoben.
        </p>

        <h2>5. Datenweitergabe</h2>
        <p>
          Ihre Daten werden <strong>nicht an Dritte verkauft oder zu Werbezwecken weitergegeben.</strong> Eine
          Weitergabe erfolgt nur an:
        </p>
        <ul>
          <li><strong>Andere registrierte Nutzer:</strong> Profilinformationen werden anderen Nutzern der Plattform angezeigt</li>
          <li><strong>Hosting-Dienstleister:</strong> Unsere Server-Infrastruktur wird auf eigenen Servern betrieben.
            Cloudflare wird f&uuml;r die sichere Verbindung genutzt (Auftragsverarbeitungsvertrag vorhanden).</li>
        </ul>

        <h2>6. Datensicherheit</h2>
        <p>Wir setzen folgende technische Ma&szlig;nahmen zum Schutz Ihrer Daten ein:</p>
        <ul>
          <li>Verschl&uuml;sselte &Uuml;bertragung (HTTPS/TLS)</li>
          <li>Passwort-Hashing mit bcrypt (Branchenstandard)</li>
          <li>Zugriffskontrolle &uuml;ber JWT-Tokens mit begrenzter G&uuml;ltigkeit</li>
          <li>Rate-Limiting zum Schutz vor Brute-Force-Angriffen</li>
          <li>Security-Header (Helmet.js)</li>
          <li>Parametrisierte Datenbankabfragen zum Schutz vor SQL-Injection</li>
        </ul>

        <h2>7. Ihre Rechte</h2>
        <p>Sie haben jederzeit folgende Rechte bez&uuml;glich Ihrer personenbezogenen Daten:</p>
        <ul>
          <li><strong>Auskunft (Art. 15 DSGVO):</strong> Sie k&ouml;nnen &uuml;ber Ihr Konto einsehen, welche Daten wir speichern.</li>
          <li><strong>Datenportabilit&auml;t (Art. 20 DSGVO):</strong> Sie k&ouml;nnen Ihre Daten jederzeit in Ihren Kontoeinstellungen als JSON-Datei exportieren.</li>
          <li><strong>L&ouml;schung (Art. 17 DSGVO):</strong> Sie k&ouml;nnen Ihr Konto und alle zugeh&ouml;rigen Daten jederzeit &uuml;ber die Kontoeinstellungen unwiderruflich l&ouml;schen.</li>
          <li><strong>Berichtigung (Art. 16 DSGVO):</strong> Sie k&ouml;nnen Ihre Profildaten jederzeit bearbeiten.</li>
          <li><strong>Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO):</strong> Sie k&ouml;nnen Ihre Einwilligung jederzeit widerrufen, indem Sie Ihr Konto l&ouml;schen.</li>
          <li><strong>Beschwerde (Art. 77 DSGVO):</strong> Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbeh&ouml;rde zu beschweren.</li>
        </ul>

        <h2>8. Speicherdauer</h2>
        <p>
          Ihre Daten werden gespeichert, solange Ihr Konto besteht. Bei L&ouml;schung Ihres Kontos
          werden alle personenbezogenen Daten einschlie&szlig;lich Nachrichten, Buchungen und
          Bewertungen unwiderruflich gel&ouml;scht. Eine Wiederherstellung ist nicht m&ouml;glich.
        </p>

        <h2>9. Cookies und lokale Speicherung</h2>
        <p>
          Zeitnest verwendet <strong>keine Tracking-Cookies</strong> und <strong>keine Analyse-Tools</strong>.
          Wir speichern ausschlie&szlig;lich einen Authentifizierungs-Token im lokalen Speicher (localStorage)
          Ihres Browsers, um Sie eingeloggt zu halten. Dieser wird bei der Abmeldung gel&ouml;scht.
        </p>

        <h2>10. &Auml;nderungen</h2>
        <p>
          Wir behalten uns vor, diese Datenschutzerkl&auml;rung anzupassen. Die aktuelle Version
          ist stets auf dieser Seite verf&uuml;gbar.
        </p>

        <p style={{ marginTop: '32px', color: '#6b7c93', fontSize: '0.85rem' }}>
          Stand: April 2026
        </p>
      </div>
    </div>
  );
}

export default DatenschutzPage;
