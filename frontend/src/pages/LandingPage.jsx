import React from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div>
      <section className="hero">
        <div className="container">
          <h1>
            Zeit schenken. <span className="highlight">Zeit gewinnen.</span>
          </h1>
          <p>
            Zeitnest bringt Familien und erfahrene Senioren zusammen.
            Senioren schenken Zeit, Kinder erleben Abenteuer, Eltern gewinnen Freiraum.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-lg">
              Jetzt kostenlos registrieren
            </Link>
            <Link to="/leitfaden" className="btn btn-outline btn-lg">
              So funktioniert's
            </Link>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2>Warum Zeitnest?</h2>
          <div className="features-grid">
            <div className="card feature-card">
              <div className="icon">&#x1F476;</div>
              <h3>Entlastung f&uuml;r Eltern</h3>
              <p>Finden Sie verl&auml;ssliche und liebevolle Betreuung f&uuml;r Ihre Kinder &ndash; flexibel und in Ihrer N&auml;he.</p>
            </div>
            <div className="card feature-card">
              <div className="icon">&#x1F9D3;</div>
              <h3>Sinn &amp; Freude f&uuml;r Senioren</h3>
              <p>Verbringen Sie wertvolle Zeit mit Kindern und bleiben Sie aktiv &ndash; als Leih-Oma oder Leih-Opa.</p>
            </div>
            <div className="card feature-card">
              <div className="icon">&#x1F91D;</div>
              <h3>Sicheres Kennenlernen</h3>
              <p>Unser Kennenlern-Leitfaden begleitet Sie Schritt f&uuml;r Schritt zu einem vertrauensvollen Miteinander.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <div className="container">
          <h2>So funktioniert&apos;s</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Profil erstellen</h3>
              <p>Registrieren Sie sich als Elternteil oder als Leih-Gro&szlig;elternteil und f&uuml;llen Sie Ihr Profil aus.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Passende Person finden</h3>
              <p>Durchsuchen Sie Profile in Ihrer N&auml;he und finden Sie die perfekte Erg&auml;nzung f&uuml;r Ihre Familie.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>Kennenlernen</h3>
              <p>Nutzen Sie unseren Leitfaden f&uuml;r ein erstes Treffen und bauen Sie gegenseitiges Vertrauen auf.</p>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <h3>Gemeinsam starten</h3>
              <p>Vereinbaren Sie regelm&auml;&szlig;ige Treffen und genie&szlig;en Sie die neue Verbindung.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Bereit f&uuml;r eine neue Verbindung?</h2>
          <p>Registrieren Sie sich jetzt kostenlos und finden Sie Ihr Zeitnest &ndash; mehr Zeit f&uuml;r alle.</p>
          <Link to="/register" className="btn btn-lg">Kostenlos starten</Link>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
