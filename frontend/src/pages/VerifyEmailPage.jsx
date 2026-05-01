import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

function VerifyEmailPage() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/auth/verify/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage(data.error);
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Verifizierung fehlgeschlagen.');
      });
  }, [token]);

  return (
    <div className="auth-page">
      <div className="card auth-card" style={{ textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <div className="spinner" style={{ margin: '0 auto 16px' }} />
            <p>E-Mail wird best&auml;tigt...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>&#x2705;</div>
            <h1>Best&auml;tigt!</h1>
            <p style={{ color: '#6b7c93', margin: '12px 0 24px' }}>{message}</p>
            <Link to="/login" className="btn btn-primary">Jetzt anmelden</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>&#x274C;</div>
            <h1>Fehler</h1>
            <p style={{ color: '#6b7c93', margin: '12px 0 24px' }}>{message}</p>
            <Link to="/login" className="btn btn-outline">Zur Anmeldung</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default VerifyEmailPage;
