import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import MatchesPage from './pages/MatchesPage';
import MessagesPage from './pages/MessagesPage';
import GuidePage from './pages/GuidePage';
import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  return !user ? children : <Navigate to="/dashboard" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/leitfaden" element={<GuidePage />} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/suche" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
      <Route path="/profil/:id" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="/profil/bearbeiten" element={<PrivateRoute><EditProfilePage /></PrivateRoute>} />
      <Route path="/anfragen" element={<PrivateRoute><MatchesPage /></PrivateRoute>} />
      <Route path="/nachrichten/:matchId" element={<PrivateRoute><MessagesPage /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <AppRoutes />
          </main>
          <footer className="footer">
            <div className="container">
              <p>&copy; 2026 Zeitnest &middot; Zeit schenken. Zeit gewinnen.</p>
              <div className="footer-links">
                <a href="/leitfaden">Kennenlern-Leitfaden</a>
                <a href="#datenschutz">Datenschutz</a>
                <a href="#impressum">Impressum</a>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
