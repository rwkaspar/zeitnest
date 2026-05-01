import React, { useState } from 'react';

function GuidePage() {
  const [view, setView] = useState('parent');

  return (
    <div className="guide-page">
      <div className="container">
        <h1>Kennenlern-Leitfaden</h1>
        <p className="subtitle">
          Schritt f&uuml;r Schritt zu einer vertrauensvollen Beziehung zwischen den Generationen.
        </p>

        <div className="guide-toggle">
          <button
            className={`guide-toggle-btn ${view === 'parent' ? 'active' : ''}`}
            onClick={() => setView('parent')}
          >
            &#x1F46A; F&uuml;r Eltern
          </button>
          <button
            className={`guide-toggle-btn ${view === 'grandparent' ? 'active' : ''}`}
            onClick={() => setView('grandparent')}
          >
            &#x1F9D3; F&uuml;r Leih-Gro&szlig;eltern
          </button>
        </div>

        {view === 'parent' ? <ParentGuide /> : <GrandparentGuide />}

        <div className="card guide-step guide-warning">
          <h2>&#x26A0;&#xFE0F; Wichtige Hinweise</h2>
          <ul>
            <li>Zeitnest ist eine Vermittlungsplattform &ndash; die Verantwortung f&uuml;r die Betreuung liegt bei den beteiligten Personen</li>
            <li>Vertrauen Sie Ihrem Bauchgef&uuml;hl &ndash; wenn etwas nicht stimmt, brechen Sie den Kontakt ab</li>
            <li>Kl&auml;ren Sie die Haftungsfrage und schlie&szlig;en Sie ggf. eine Haftpflichtversicherung ab</li>
            <li>Bei Betreuung von Kindern unter 3 Jahren: besonders sorgf&auml;ltige Eingew&ouml;hnung</li>
            <li>Melden Sie problematisches Verhalten an unser Team</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ParentGuide() {
  return (
    <>
      <div className="card guide-step">
        <h2>&#x1F4DD; Schritt 1: Profil sorgf&auml;ltig ausf&uuml;llen</h2>
        <p>Ein ehrliches, vollst&auml;ndiges Profil hilft Leih-Gro&szlig;eltern, sich ein Bild von Ihrer Familie zu machen &ndash; und schafft von Anfang an Vertrauen.</p>
        <ul>
          <li>Laden Sie ein freundliches Familienfoto hoch</li>
          <li>Beschreiben Sie Ihre Kinder (Alter, Interessen, Besonderheiten)</li>
          <li>Erz&auml;hlen Sie, was Sie sich von einer Leih-Oma/einem Leih-Opa erhoffen</li>
          <li>Geben Sie Ihre zeitliche Vorstellung an (z.B. einmal pro Woche, nachmittags)</li>
        </ul>
      </div>

      <div className="card guide-step">
        <h2>&#x1F50E; Schritt 2: Die richtige Person finden</h2>
        <p>Nehmen Sie sich Zeit bei der Suche. Lesen Sie Profile gr&uuml;ndlich und achten Sie auf gemeinsame Interessen und N&auml;he.</p>
        <ul>
          <li>Filtern Sie nach Entfernung, Verf&uuml;gbarkeit und Interessen</li>
          <li>Achten Sie auf die Beschreibung &ndash; stimmt die Chemie schon beim Lesen?</li>
          <li>Scheuen Sie sich nicht, mehrere Personen anzuschreiben</li>
          <li>Besprechen Sie die Auswahl mit Ihrem Partner / Ihrer Partnerin</li>
        </ul>
      </div>

      <div className="card guide-step">
        <h2>&#x1F4E9; Schritt 3: Erste Kontaktaufnahme</h2>
        <p>Schreiben Sie eine pers&ouml;nliche Nachricht. Erz&auml;hlen Sie von Ihrer Familie und warum gerade dieses Profil Sie angesprochen hat.</p>
        <ul>
          <li>Stellen Sie sich und Ihre Kinder kurz vor</li>
          <li>Erkl&auml;ren Sie, was Sie sich konkret vorstellen</li>
          <li>Fragen Sie nach den W&uuml;nschen und Vorstellungen der anderen Person</li>
          <li>Bleiben Sie offen und herzlich &ndash; es geht um eine Beziehung, nicht um einen Job</li>
        </ul>
      </div>

      <div className="card guide-step">
        <h2>&#x2615; Schritt 4: Erstes Treffen an einem &ouml;ffentlichen Ort</h2>
        <p>Verabreden Sie sich an einem neutralen, &ouml;ffentlichen Ort. Das gibt beiden Seiten Sicherheit und Leichtigkeit.</p>
        <ul>
          <li>Caf&eacute;, Park oder Spielplatz sind ideal</li>
          <li>Bringen Sie Ihr Kind mit &ndash; so k&ouml;nnen Sie die Dynamik beobachten</li>
          <li>Planen Sie etwa 1&ndash;2 Stunden ein, ohne Zeitdruck</li>
          <li>Informieren Sie eine Vertrauensperson &uuml;ber das Treffen</li>
        </ul>
      </div>

      <div className="card guide-step">
        <h2>&#x1F50D; Schritt 5: Erwartungen &amp; Regeln besprechen</h2>
        <p>Bevor die Betreuung beginnt, sollten einige wichtige Themen offen besprochen werden.</p>
        <ul>
          <li>Allergien, Medikamente und Notfallkontakte teilen</li>
          <li>Erziehungsstil und Ihre Regeln erkl&auml;ren (Medien, S&uuml;&szlig;igkeiten, Schlafzeiten...)</li>
          <li>Tagesablauf und Gewohnheiten Ihres Kindes besprechen</li>
          <li>Klare Absprachen zu Ort, Dauer und Aktivit&auml;ten treffen</li>
          <li>Thema Aufwandsentsch&auml;digung offen ansprechen</li>
        </ul>
      </div>

      <div className="card guide-step">
        <h2>&#x1F6E1;&#xFE0F; Schritt 6: Vertrauen aufbauen &ndash; Schritt f&uuml;r Schritt</h2>
        <p>Vertrauen braucht Zeit. Beginnen Sie mit kurzen, begleiteten Treffen und steigern Sie langsam.</p>
        <ul>
          <li>Die ersten 2&ndash;3 Treffen gemeinsam verbringen (Sie bleiben dabei)</li>
          <li>Dann kurze Betreuungszeiten allein (30&ndash;60 Minuten), z.B. w&auml;hrend Sie in der N&auml;he sind</li>
          <li>Bitten Sie um ein erweitertes F&uuml;hrungszeugnis (&sect; 30a BZRG) &ndash; das ist v&ouml;llig normal</li>
          <li>Tauschen Sie Notfallnummern aus und vereinbaren Sie ein Codewort</li>
        </ul>
      </div>

      <div className="card guide-step">
        <h2>&#x1F91D; Schritt 7: Regelm&auml;&szlig;ige Betreuung starten</h2>
        <p>Wenn alle sich wohl f&uuml;hlen &ndash; Ihr Kind, Sie und die Leih-Gro&szlig;eltern &ndash; kann es richtig losgehen.</p>
        <ul>
          <li>Legen Sie feste Tage und Zeiten fest</li>
          <li>F&uuml;hren Sie ein kurzes Betreuungstagebuch (was wurde gemacht, wie ging&apos;s)</li>
          <li>Geben Sie sich gegenseitig regelm&auml;&szlig;ig Feedback</li>
          <li>Bleiben Sie flexibel &ndash; das Leben ist nicht immer planbar</li>
          <li>Genie&szlig;en Sie die neue Verbindung &ndash; Ihr Kind hat jetzt eine Oma/einen Opa mehr!</li>
        </ul>
      </div>
    </>
  );
}

function GrandparentGuide() {
  return (
    <>
      <div className="card guide-step">
        <h2>&#x1F4DD; Schritt 1: Profil mit Herz ausf&uuml;llen</h2>
        <p>Ihr Profil ist Ihre Visitenkarte. Zeigen Sie, wer Sie sind und was Sie Kindern mitgeben m&ouml;chten.</p>
        <ul>
          <li>Laden Sie ein freundliches Foto von sich hoch</li>
          <li>Erz&auml;hlen Sie von Ihren Erfahrungen mit Kindern &ndash; eigene, Enkel oder beruflich</li>
          <li>Beschreiben Sie, was Sie gerne mit Kindern unternehmen</li>
          <li>Geben Sie Ihre Verf&uuml;gbarkeit und Ihren Wohnort an</li>
        </ul>
      </div>

      <div className="card guide-step">
        <h2>&#x1F50E; Schritt 2: Familien entdecken</h2>
        <p>St&ouml;bern Sie durch die Profile und schauen Sie, welche Familie zu Ihnen passen k&ouml;nnte.</p>
        <ul>
          <li>Achten Sie auf das Alter der Kinder &ndash; was liegt Ihnen mehr?</li>
          <li>Lesen Sie, was sich die Eltern w&uuml;nschen und ob das zu Ihren Vorstellungen passt</li>
          <li>N&auml;he ist wichtig &ndash; kurze Wege machen regelm&auml;&szlig;ige Treffen leichter</li>
          <li>Es muss nicht sofort perfekt passen &ndash; lernen Sie die Familie erst kennen</li>
        </ul>
      </div>

      <div className="card guide-step">
        <h2>&#x1F4E9; Schritt 3: Den ersten Schritt machen</h2>
        <p>Trauen Sie sich! Eine herzliche Nachricht ist der beste Anfang. Die meisten Familien freuen sich sehr &uuml;ber Ihr Interesse.</p>
        <ul>
          <li>Stellen Sie sich kurz vor &ndash; wer sind Sie und was motiviert Sie?</li>
          <li>Erz&auml;hlen Sie, warum gerade diese Familie Ihr Interesse geweckt hat</li>
          <li>Fragen Sie nach den Kindern &ndash; das zeigt echtes Interesse</li>
          <li>Kein Druck &ndash; es geht um ein lockeres Kennenlernen</li>
        </ul>
      </div>

      <div className="card guide-step">
        <h2>&#x2615; Schritt 4: Erstes Treffen &ndash; locker und ungezwungen</h2>
        <p>Das erste Treffen findet an einem &ouml;ffentlichen Ort statt &ndash; ohne Erwartungen, einfach zum Beschnuppern.</p>
        <ul>
          <li>Ein Caf&eacute;, Park oder Spielplatz ist ideal</li>
          <li>Seien Sie einfach Sie selbst &ndash; Kinder sp&uuml;ren Authentizit&auml;t</li>
          <li>Lassen Sie das Kind den Takt vorgeben &ndash; manche brauchen etwas Zeit zum Auftauen</li>
          <li>Erz&auml;hlen Sie den Eltern gerne auch von sich, Ihrem Leben und Ihren Hobbys</li>
        </ul>
      </div>

      <div className="card guide-step">
        <h2>&#x1F50D; Schritt 5: Gemeinsam Regeln &amp; Absprachen finden</h2>
        <p>Offene Kommunikation ist der Schl&uuml;ssel. Sprechen Sie Erwartungen und wichtige Themen fr&uuml;h an.</p>
        <ul>
          <li>Fragen Sie nach Allergien, Medikamenten und besonderen Bed&uuml;rfnissen</li>
          <li>Lassen Sie sich den Erziehungsstil und die Regeln der Familie erkl&auml;ren</li>
          <li>Kl&auml;ren Sie, welche Aktivit&auml;ten erw&uuml;nscht sind und welche nicht</li>
          <li>Sprechen Sie offen &uuml;ber Ihre eigenen Grenzen und M&ouml;glichkeiten</li>
          <li>Thema Aufwandsentsch&auml;digung: &ndash; offen ansprechen, das ist v&ouml;llig in Ordnung</li>
        </ul>
      </div>

      <div className="card guide-step">
        <h2>&#x1F6E1;&#xFE0F; Schritt 6: Behutsam einleben</h2>
        <p>Geben Sie der Beziehung Zeit zu wachsen &ndash; f&uuml;r das Kind, aber auch f&uuml;r Sie selbst.</p>
        <ul>
          <li>Die ersten Treffen finden mit den Eltern statt &ndash; das ist ganz normal und wichtig</li>
          <li>Ein erweitertes F&uuml;hrungszeugnis (&sect; 30a BZRG) wird oft erbeten &ndash; sehen Sie es als Zeichen von Verantwortung, nicht als Misstrauen</li>
          <li>Tauschen Sie Notfallnummern aus</li>
          <li>Beginnen Sie mit kurzen Betreuungszeiten und steigern Sie langsam</li>
        </ul>
      </div>

      <div className="card guide-step">
        <h2>&#x1F91D; Schritt 7: Teil der Familie werden</h2>
        <p>Wenn das Vertrauen gewachsen ist, beginnt das Sch&ouml;nste: eine echte, herzliche Verbindung.</p>
        <ul>
          <li>Vereinbaren Sie feste Zeiten &ndash; Kinder lieben Routinen und freuen sich auf Sie</li>
          <li>Bringen Sie Ihre Ideen ein &ndash; Backen, Basteln, Geschichten, Spazierg&auml;nge</li>
          <li>Geben Sie den Eltern kurzes Feedback nach jedem Treffen</li>
          <li>Sprechen Sie es an, wenn etwas nicht passt &ndash; offene Kommunikation sch&uuml;tzt die Beziehung</li>
          <li>Genie&szlig;en Sie es &ndash; Sie machen einen echten Unterschied im Leben dieses Kindes!</li>
        </ul>
      </div>
    </>
  );
}

export default GuidePage;
