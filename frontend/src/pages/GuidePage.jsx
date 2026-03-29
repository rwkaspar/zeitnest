import React from 'react';

function GuidePage() {
  return (
    <div className="guide-page">
      <div className="container">
        <h1>Kennenlern-Leitfaden</h1>
        <p className="subtitle">
          So gestalten Sie den Weg zu einer vertrauensvollen Beziehung zwischen Ihrer Familie und Ihrem Leih-Gro&szlig;elternteil.
        </p>

        <div className="card guide-step">
          <h2>&#x1F4DD; Schritt 1: Profil sorgf&auml;ltig ausf&uuml;llen</h2>
          <p>Ein vollst&auml;ndiges Profil schafft Vertrauen. Beschreiben Sie sich, Ihre Situation und Ihre Erwartungen m&ouml;glichst genau.</p>
          <ul>
            <li>Laden Sie ein freundliches Profilbild hoch</li>
            <li>Beschreiben Sie Ihre Erfahrungen mit Kindern</li>
            <li>Geben Sie Ihre Verf&uuml;gbarkeit an</li>
            <li>Erw&auml;hnen Sie besondere F&auml;higkeiten oder Interessen</li>
          </ul>
        </div>

        <div className="card guide-step">
          <h2>&#x1F4E9; Schritt 2: Erste Kontaktaufnahme</h2>
          <p>Schreiben Sie eine pers&ouml;nliche Nachricht, wenn Sie jemanden kontaktieren. Erz&auml;hlen Sie kurz von sich und warum Sie Interesse haben.</p>
          <ul>
            <li>Stellen Sie sich und Ihre Familie vor</li>
            <li>Erkl&auml;ren Sie, was Sie sich vorstellen</li>
            <li>Fragen Sie nach den W&uuml;nschen der anderen Person</li>
            <li>Bleiben Sie offen und freundlich</li>
          </ul>
        </div>

        <div className="card guide-step">
          <h2>&#x2615; Schritt 3: Erstes Treffen an einem &ouml;ffentlichen Ort</h2>
          <p>Verabreden Sie sich an einem neutralen, &ouml;ffentlichen Ort. Das gibt beiden Seiten Sicherheit.</p>
          <ul>
            <li>Caf&eacute;, Park oder Spielplatz sind ideal</li>
            <li>Bringen Sie Ihr Kind zum Kennenlernen mit</li>
            <li>Planen Sie etwa 1-2 Stunden ein</li>
            <li>Informieren Sie eine Vertrauensperson &uuml;ber das Treffen</li>
          </ul>
        </div>

        <div className="card guide-step">
          <h2>&#x1F50D; Schritt 4: Gegenseitiges Kennenlernen vertiefen</h2>
          <p>Bevor die eigentliche Betreuung beginnt, sollten einige wichtige Themen besprochen werden.</p>
          <ul>
            <li>Besprechen Sie Allergien, Medikamente und Notfallkontakte</li>
            <li>Kl&auml;ren Sie Erwartungen an Erziehungsstil und Regeln</li>
            <li>Tauschen Sie sich &uuml;ber den Tagesablauf aus</li>
            <li>Vereinbaren Sie klare Absprachen (&Ouml;rtlichkeit, Dauer, Aktivit&auml;ten)</li>
            <li>Besprechen Sie den Umgang mit dem Thema Aufwandsentsch&auml;digung</li>
          </ul>
        </div>

        <div className="card guide-step">
          <h2>&#x1F6E1;&#xFE0F; Schritt 5: Sicherheit geht vor</h2>
          <p>Vertrauen muss wachsen. Beginnen Sie mit kurzen, begleiteten Treffen.</p>
          <ul>
            <li>Die ersten 2&ndash;3 Treffen sollten gemeinsam (Elternteil anwesend) stattfinden</li>
            <li>Erh&ouml;hen Sie die Betreuungszeit schrittweise</li>
            <li>Bitten Sie um ein erweitertes F&uuml;hrungszeugnis (Paragraph 30a BZRG)</li>
            <li>Tauschen Sie Notfallnummern aus</li>
            <li>Vereinbaren Sie ein Codewort f&uuml;r Notf&auml;lle</li>
          </ul>
        </div>

        <div className="card guide-step">
          <h2>&#x1F91D; Schritt 6: Regelm&auml;&szlig;ige Betreuung starten</h2>
          <p>Wenn alle sich wohl f&uuml;hlen, k&ouml;nnen Sie in eine regelm&auml;&szlig;ige Betreuung &uuml;bergehen.</p>
          <ul>
            <li>Legen Sie feste Tage und Zeiten fest</li>
            <li>F&uuml;hren Sie ein Betreuungstagebuch</li>
            <li>Geben Sie sich gegenseitig regelm&auml;&szlig;ig Feedback</li>
            <li>Bleiben Sie flexibel und kommunikativ</li>
            <li>Feiern Sie die neue Verbindung zwischen den Generationen!</li>
          </ul>
        </div>

        <div className="card guide-step" style={{ background: '#fdf0ed', border: '1px solid #e8725a' }}>
          <h2>&#x26A0;&#xFE0F; Wichtige Hinweise</h2>
          <ul>
            <li>Zeitnest ist eine Vermittlungsplattform &ndash; die Verantwortung f&uuml;r die Betreuung liegt bei den beteiligten Personen</li>
            <li>Vertrauen Sie Ihrem Bauchgef&uuml;hl &ndash; wenn etwas nicht stimmt, brechen Sie den Kontakt ab</li>
            <li>Kl&auml;ren Sie die Haftungsfrage und schlie&szlig;en Sie ggf. eine Haftpflichtversicherung ab</li>
            <li>Bei Betreuung von Kindern unter 3 Jahren: besonders sorgf&auml;ltige Eingewöhnung</li>
            <li>Melden Sie problematisches Verhalten an unser Team</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default GuidePage;
