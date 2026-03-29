import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="container">
        <Link to={user ? '/dashboard' : '/'} className="navbar-brand">
          <span>&#x1F333;</span> Zeitnest
        </Link>
        <div className="navbar-links">
          <Link to="/leitfaden">Leitfaden</Link>
          {user ? (
            <>
              <Link to="/suche">Suche</Link>
              <Link to="/anfragen">Anfragen</Link>
              <Link to="/profil/bearbeiten">Profil</Link>
              <button onClick={logout}>Abmelden</button>
            </>
          ) : (
            <>
              <Link to="/login">Anmelden</Link>
              <Link to="/register" className="btn-primary">Registrieren</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
