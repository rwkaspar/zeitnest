import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

function FamilyJoinPage() {
  const { token } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle | joining | error
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Token zwischenspeichern und zur Registrierung schicken.
      // Nach erfolgreicher Anmeldung leitet die App zurück hier her.
      sessionStorage.setItem('pendingFamilyInviteToken', token);
      navigate('/register');
      return;
    }
    if (user.role !== 'parent') {
      setStatus('error');
      setError('Nur Eltern können einer Family beitreten.');
      return;
    }
    setStatus('joining');
    api.joinFamily(token)
      .then(() => {
        sessionStorage.removeItem('pendingFamilyInviteToken');
        navigate('/dashboard', { state: { message: 'Sie sind der Family beigetreten.' } });
      })
      .catch((err) => {
        setStatus('error');
        setError(err.message);
      });
  }, [token, user, authLoading, navigate]);

  if (authLoading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/register" />;

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1>Family beitreten</h1>
        {status === 'joining' && <p>Einen Moment, Sie werden hinzugefügt…</p>}
        {status === 'error' && (
          <>
            <div className="error-message">{error}</div>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')}>Zum Dashboard</button>
          </>
        )}
      </div>
    </div>
  );
}

export default FamilyJoinPage;
