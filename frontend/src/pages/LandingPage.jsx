import React from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-text">
            <img src="/logo.png" alt="Zeitnest Logo" className="hero-logo" />
            <h1>
              Zeit schenken. <span className="highlight">Zeit gewinnen.</span>
            </h1>
            <p>
              Zeitnest bringt Familien mit Menschen zusammen, die Zeit schenken m&ouml;chten &ndash;
              Wunschgro&szlig;eltern, Studierende, Nachbarn, Patenfamilien.
              Kinder erleben Abenteuer, Eltern gewinnen Freiraum, Helfende finden Sinn und Anschluss.
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
          <div className="hero-illustration">
            <img src="/illustrations/feature-kennenlernen.webp" alt="" />
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2>Warum Zeitnest?</h2>
          <div className="features-grid">
            <div className="card feature-card">
              <div className="icon"><img src="/illustrations/feature-eltern-entlastung.webp" alt="" /></div>
              <h3>Entlastung f&uuml;r Eltern</h3>
              <p>Finden Sie verl&auml;ssliche und liebevolle Betreuung f&uuml;r Ihre Kinder &ndash; flexibel und in Ihrer N&auml;he.</p>
            </div>
            <div className="card feature-card">
              <div className="icon"><img src="/illustrations/feature-senioren-sinn.webp" alt="" /></div>
              <h3>Sinn &amp; Freude f&uuml;r Helfende</h3>
              <p>Verbringen Sie wertvolle Zeit mit Kindern &ndash; als Wunschoma oder Wunschopa, Studierende:r, Nachbar:in oder Patenfamilie.</p>
            </div>
            <div className="card feature-card">
              <div className="icon"><img src="/illustrations/feature-kennenlernen.webp" alt="" /></div>
              <h3>Vertrauen &amp; Sicherheit</h3>
              <p>Verifizierte Profile, gepr&uuml;ftes erweitertes F&uuml;hrungszeugnis mit &bdquo;Gepr&uuml;ft&ldquo;-Abzeichen und ein Kennenlern-Leitfaden, der Schritt f&uuml;r Schritt zu einem vertrauensvollen Miteinander f&uuml;hrt.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="features" style={{ paddingTop: 0 }}>
        <div className="container">
          <h2>Wer bei Zeitnest Zeit schenkt</h2>
          <p style={{ textAlign: 'center', color: '#5a6878', maxWidth: '640px', margin: '0 auto 32px' }}>
            Freiwillige Kinderbetreuung hat viele Gesichter. W&auml;hlen Sie bei der Registrierung,
            als was Sie helfen m&ouml;chten &ndash; und Familien finden Sie gezielt nach Kategorie
            und F&auml;higkeiten wie Erste Hilfe, Vorlesen, Musik oder Nachhilfe.
          </p>
          <div className="features-grid">
            <div className="card feature-card">
              <h3>Wunschgro&szlig;eltern</h3>
              <p>Das Herz von Zeitnest: Seniorinnen und Senioren, die Enkel-Zeit verschenken &ndash; regelm&auml;&szlig;ig und verl&auml;sslich.</p>
            </div>
            <div className="card feature-card">
              <h3>Studierende &amp; junge Erwachsene</h3>
              <p>Babysitting, Nachhilfe und Randzeiten &ndash; junge Menschen mit Energie und flexiblen Zeiten.</p>
            </div>
            <div className="card feature-card">
              <h3>Nachbarschaftshilfe</h3>
              <p>Menschen aus dem Quartier, die verl&auml;sslich einspringen &ndash; kurze Wege, schnelle Hilfe.</p>
            </div>
            <div className="card feature-card">
              <h3>Patenfamilien</h3>
              <p>Familien helfen Familien: eine gefestigte Familie begleitet eine, die gerade Unterst&uuml;tzung braucht.</p>
            </div>
            <div className="card feature-card">
              <h3>Eltern-Tandem</h3>
              <p>Alleinerziehende und Eltern, die sich gegenseitig entlasten &ndash; gemeinsam ist der Alltag leichter.</p>
            </div>
            <div className="card feature-card">
              <h3>Ehrenamtliche mit Fachkompetenz</h3>
              <p>Vorlese-, Lern- und Musikpaten, Sport und Handwerk &ndash; Menschen, die ihr K&ouml;nnen weitergeben.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="audience-section audience-children">
        <div className="container">
          <div className="audience-header">
            <div className="audience-icon"><img src="/illustrations/header-kinder.webp" alt="" /></div>
            <h2>F&uuml;r Kinder</h2>
            <p className="audience-subtitle">Neue Welten entdecken, Wurzeln sp&uuml;ren</p>
          </div>
          <div className="audience-grid">
            <div className="audience-card">
              <div className="audience-card-icon"><img src="/illustrations/kinder-bezugspersonen.webp" alt="" /></div>
              <h3>Neue Bezugspersonen</h3>
              <p>
                Kinder profitieren enorm von stabilen Beziehungen au&szlig;erhalb der Kernfamilie.
                Eine Leih-Oma oder ein Leih-Opa wird zu einer verl&auml;sslichen Vertrauensperson &ndash;
                jemand, der zuh&ouml;rt, tr&ouml;stet und bedingungslos Zeit schenkt.
              </p>
            </div>
            <div className="audience-card">
              <div className="audience-card-icon"><img src="/illustrations/kinder-geschichten.webp" alt="" /></div>
              <h3>Lebenserfahrung &amp; Geschichten</h3>
              <p>
                &Auml;ltere Menschen bringen einen Schatz an Erfahrungen, Geschichten und Wissen mit,
                den kein Bildschirm ersetzen kann. Kinder lernen von einer anderen Generation &ndash;
                &uuml;ber fr&uuml;here Zeiten, Handwerk, Natur und das Leben selbst.
              </p>
            </div>
            <div className="audience-card">
              <div className="audience-card-icon"><img src="/illustrations/kinder-soziale-kompetenz.webp" alt="" /></div>
              <h3>Soziale Kompetenz</h3>
              <p>
                Der Umgang mit verschiedenen Altersgruppen st&auml;rkt Empathie, Geduld und
                Kommunikationsf&auml;higkeit. Kinder lernen, Respekt und R&uuml;cksicht gegen&uuml;ber
                &auml;lteren Menschen zu entwickeln &ndash; Werte, die ein Leben lang tragen.
              </p>
            </div>
            <div className="audience-card">
              <div className="audience-card-icon"><img src="/illustrations/kinder-impulse-hobbys.webp" alt="" /></div>
              <h3>Neue Impulse &amp; Hobbys</h3>
              <p>
                Ob gemeinsam G&auml;rtnern, Backen, Basteln oder Geschichten vorlesen &ndash;
                Leih-Gro&szlig;eltern bringen andere Interessen und Aktivit&auml;ten mit als die Eltern
                und er&ouml;ffnen Kindern neue Horizonte.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="audience-section audience-seniors">
        <div className="container">
          <div className="audience-header">
            <div className="audience-icon"><img src="/illustrations/header-senioren.webp" alt="" /></div>
            <h2>F&uuml;r Senioren</h2>
            <p className="audience-subtitle">Gebraucht werden, weitergeben, lebendig bleiben</p>
          </div>
          <div className="audience-grid">
            <div className="audience-card">
              <div className="audience-card-icon"><img src="/illustrations/senioren-erfuellung.webp" alt="" /></div>
              <h3>Sinn &amp; Erf&uuml;llung</h3>
              <p>
                Im Ruhestand fehlt vielen das Gef&uuml;hl, gebraucht zu werden.
                Als Leih-Gro&szlig;eltern &uuml;bernehmen Sie eine bedeutungsvolle Rolle &ndash;
                Sie machen einen echten Unterschied im Leben einer Familie.
              </p>
            </div>
            <div className="audience-card">
              <div className="audience-card-icon"><img src="/illustrations/senioren-ohne-enkel.webp" alt="" /></div>
              <h3>Auch ohne eigene Enkel</h3>
              <p>
                Nicht jeder hat Enkel &ndash; und nicht alle Gro&szlig;eltern leben in der N&auml;he.
                Zeitnest erm&ouml;glicht auch kinderlosen oder enkellosen Menschen,
                eine liebevolle Beziehung zu Kindern aufzubauen und Zuneigung weiterzugeben.
              </p>
            </div>
            <div className="audience-card">
              <div className="audience-card-icon"><img src="/illustrations/senioren-aktiv.webp" alt="" /></div>
              <h3>Aktiv &amp; verbunden bleiben</h3>
              <p>
                Kinderlachen ist die beste Medizin. Der regelm&auml;&szlig;ige Kontakt mit jungen
                Familien h&auml;lt geistig fit, bringt Freude in den Alltag und
                sch&uuml;tzt vor Einsamkeit &ndash; einem der gr&ouml;&szlig;ten Gesundheitsrisiken im Alter.
              </p>
            </div>
            <div className="audience-card">
              <div className="audience-card-icon"><img src="/illustrations/senioren-wissen.webp" alt="" /></div>
              <h3>Wissen &amp; Werte weitergeben</h3>
              <p>
                Ihre Lebenserfahrung ist wertvoll. Ob Kochen, Handwerken, Musik oder einfach
                Zuh&ouml;ren &ndash; geben Sie weiter, was Sie ausmacht, und hinterlassen Sie
                Spuren im Leben eines Kindes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="audience-section audience-parents">
        <div className="container">
          <div className="audience-header">
            <div className="audience-icon"><img src="/illustrations/header-eltern.webp" alt="" /></div>
            <h2>F&uuml;r Eltern</h2>
            <p className="audience-subtitle">Es braucht ein Dorf, um ein Kind gro&szlig;zuziehen</p>
          </div>
          <div className="audience-grid">
            <div className="audience-card">
              <div className="audience-card-icon"><img src="/illustrations/eltern-dorf.webp" alt="" /></div>
              <h3>Zur&uuml;ck zum Dorf-Prinzip</h3>
              <p>
                Fr&uuml;her k&uuml;mmerte sich der ganze Stamm um die Kinder &ndash; Gro&szlig;eltern,
                Nachbarn, die Gemeinschaft. Heute tragen Eltern diese Last oft allein.
                Zeitnest bringt dieses Netzwerk zur&uuml;ck und gibt Eltern die Unterst&uuml;tzung,
                die fr&uuml;her selbstverst&auml;ndlich war.
              </p>
            </div>
            <div className="audience-card">
              <div className="audience-card-icon"><img src="/illustrations/eltern-paarzeit.webp" alt="" /></div>
              <h3>Paarzeit sch&uuml;tzen</h3>
              <p>
                Was n&uuml;tzt es, wenn Eltern jede Minute dem Kind widmen, aber die Beziehung
                zum Partner dabei auf der Strecke bleibt? Eine starke Partnerschaft ist das
                Fundament einer gl&uuml;cklichen Familie. Zeitnest schafft Freir&auml;ume f&uuml;r
                gemeinsame Zeit zu zweit.
              </p>
            </div>
            <div className="audience-card">
              <div className="audience-card-icon"><img src="/illustrations/eltern-metime.webp" alt="" /></div>
              <h3>Me-Time ohne schlechtes Gewissen</h3>
              <p>
                Ausgebrannte Eltern k&ouml;nnen nicht die besten Eltern sein.
                Eine Stunde f&uuml;r sich selbst &ndash; ob Sport, Freunde oder einfach Ruhe &ndash;
                ist kein Luxus, sondern notwendig. Und die Kinder sind dabei in
                liebevollen, erfahrenen H&auml;nden.
              </p>
            </div>
            <div className="audience-card">
              <div className="audience-card-icon"><img src="/illustrations/eltern-vertrauen.webp" alt="" /></div>
              <h3>Vertrauen statt Fremde</h3>
              <p>
                Anders als bei klassischer Kinderbetreuung entsteht hier eine echte,
                langfristige Beziehung. Die Leih-Gro&szlig;eltern werden Teil des erweiterten
                Familienkreises &ndash; mit einem Kennenlernen in Ihrem Tempo und nach Ihren Regeln.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="audience-section audience-helpers">
        <div className="container">
          <div className="audience-header">
            <div className="audience-icon"><img src="/illustrations/feature-senioren-sinn.webp" alt="" /></div>
            <h2>F&uuml;r alle, die Zeit schenken</h2>
            <p className="audience-subtitle">Ehrenamt, das verbindet</p>
          </div>
          <div className="audience-grid">
            <div className="audience-card">
              <h3>Unkompliziert starten</h3>
              <p>
                Kostenlos und ohne Vereinsb&uuml;rokratie: Profil anlegen, Familien in
                Ihrer N&auml;he finden, in Ihrem Tempo kennenlernen. Sie entscheiden
                selbst, wem Sie Ihre Zeit schenken &ndash; der Kennenlern-Leitfaden
                und verifizierte Profile geben dabei Sicherheit.
              </p>
            </div>
            <div className="audience-card">
              <h3>Anschluss &amp; Gemeinschaft</h3>
              <p>
                Neu in der Stadt, im Studium oder einfach auf der Suche nach echtem
                Kontakt? &Uuml;ber Zeitnest finden Sie Familienanschluss und ein
                Netzwerk im Quartier &ndash; Beziehungen, die weit &uuml;ber die
                Betreuung hinaus tragen.
              </p>
            </div>
            <div className="audience-card">
              <h3>Erfahrung f&uuml;rs Leben</h3>
              <p>
                Gerade f&uuml;r junge Helfende ist die Zeit mit Kindern wertvolle
                Praxis &ndash; ob f&uuml;r P&auml;dagogik, Soziale Arbeit oder Medizin.
                Bewertungen zufriedener Familien werden zu Referenzen, die man
                vorzeigen kann.
              </p>
            </div>
            <div className="audience-card">
              <h3>Flexibel nach Ihrer Zeit</h3>
              <p>
                Sie bestimmen, wie viel Sie geben: der feste Nachmittag pro Woche,
                gelegentliches Einspringen oder Hilfe in den Ferien. Ihr Profil
                zeigt, was Sie anbieten &ndash; Familien richten sich danach.
              </p>
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
              <p>Registrieren Sie sich als Elternteil &ndash; oder schenken Sie Zeit und w&auml;hlen Sie, als was Sie helfen m&ouml;chten.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>Passende Person finden</h3>
              <p>Filtern Sie nach N&auml;he, Helfer-Kategorie und F&auml;higkeiten &ndash; und finden Sie die perfekte Erg&auml;nzung f&uuml;r Ihre Familie.</p>
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
