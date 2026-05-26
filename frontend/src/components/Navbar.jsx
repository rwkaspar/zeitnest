import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  function handleLogout() {
    if (window.confirm('Wirklich abmelden?')) logout();
  }

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <nav className="navbar">
      <div className="container">
        <Link to={!user ? '/' : user.role === 'coordinator' ? '/koordination' : '/dashboard'} className="navbar-brand">
          <img src="/logo.png" alt="Zeitnest Logo" className="navbar-logo" />
          Zeitnest
        </Link>

        <button
          className={`navbar-burger ${open ? 'active' : ''}`}
          onClick={() => setOpen(!open)}
          aria-label="Menü öffnen"
          aria-expanded={open}
        >
          <span /><span /><span />
        </button>

        <div className={`navbar-links ${open ? 'open' : ''}`}>
          <Link to="/leitfaden">Leitfaden</Link>
          {user ? (
            user.role === 'coordinator' ? (
              <>
                <Link to="/koordination">Koordination</Link>
                <Link to="/konto">Konto</Link>
                {user.is_admin && <Link to="/admin">Admin</Link>}
                <button onClick={handleLogout}>Abmelden</button>
              </>
            ) : (
              <>
                <Link to="/suche">Suche</Link>
                <Link to="/anfragen">Anfragen</Link>
                <Link to="/kalender">Kalender</Link>
                <Link to="/profil/bearbeiten">Profil</Link>
                <Link to="/konto">Konto</Link>
                {user.is_admin && <Link to="/admin">Admin</Link>}
                <button onClick={handleLogout}>Abmelden</button>
              </>
            )
          ) : (
            <>
              <Link to="/login">Anmelden</Link>
              <Link to="/register" className="btn-primary">Registrieren</Link>
            </>
          )}
        </div>

        {open && <div className="navbar-overlay" onClick={() => setOpen(false)} />}
      </div>
    </nav>
  );
}

export default Navbar;
