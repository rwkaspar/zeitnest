import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

// Schwebender Feedback-Button (alle Seiten): Bug melden / Idee vorschlagen.
// Meldungen werden serverseitig per KI auf Duplikate geprüft und landen
// als GitHub-Issue — deshalb der Hinweis, keine persönlichen Daten einzugeben.
function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('bug');
  const [description, setDescription] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | done | error
  const [error, setError] = useState('');
  const location = useLocation();

  async function submit(e) {
    e.preventDefault();
    setState('sending');
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ type, description, page_path: location.pathname }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Senden fehlgeschlagen.');
      setState('done');
      setDescription('');
    } catch (err) {
      setState('error');
      setError(err.message);
    }
  }

  function close() {
    setOpen(false);
    setState('idle');
    setError('');
  }

  return (
    <>
      <button className="feedback-fab" onClick={() => setOpen(true)} title="Fehler melden oder Idee vorschlagen">
        &#x1F4AC; Feedback
      </button>

      {open && (
        <div className="feedback-overlay" onClick={close}>
          <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
            {state === 'done' ? (
              <>
                <h3>Danke!</h3>
                <p style={{ color: '#5a6878', fontSize: '0.95rem', margin: '12px 0 20px' }}>
                  Ihre Meldung ist eingegangen und wird gepr&uuml;ft.
                  Sie hilft direkt dabei, Zeitnest besser zu machen.
                </p>
                <button className="btn btn-primary" onClick={close}>Schlie&szlig;en</button>
              </>
            ) : (
              <form onSubmit={submit}>
                <h3>Fehler melden oder Idee vorschlagen</h3>

                <div style={{ display: 'flex', gap: '8px', margin: '14px 0' }}>
                  <button type="button" onClick={() => setType('bug')}
                    className={`feedback-chip ${type === 'bug' ? 'active' : ''}`}>
                    &#x1F41B; Fehler
                  </button>
                  <button type="button" onClick={() => setType('feature')}
                    className={`feedback-chip ${type === 'feature' ? 'active' : ''}`}>
                    &#x1F4A1; Idee / Wunsch
                  </button>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={type === 'bug'
                    ? 'Was ist passiert? Was haben Sie erwartet?'
                    : 'Was fehlt Ihnen? Was würde Zeitnest besser machen?'}
                  rows={5}
                  minLength={10}
                  maxLength={2000}
                  required
                  style={{ width: '100%', resize: 'vertical' }}
                />

                <p style={{ fontSize: '0.78rem', color: '#8a97a5', margin: '8px 0 14px' }}>
                  Bitte keine pers&ouml;nlichen Daten angeben &mdash; die Meldung wird
                  automatisiert als &ouml;ffentliches GitHub-Issue weiterverarbeitet.
                </p>

                {error && <div className="error-message">{error}</div>}

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-outline" onClick={close}>Abbrechen</button>
                  <button type="submit" className="btn btn-primary" disabled={state === 'sending'}>
                    {state === 'sending' ? 'Senden…' : 'Absenden'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default FeedbackWidget;
