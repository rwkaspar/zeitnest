import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FeedbackWidget from './components/FeedbackWidget';
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
import ImpressumPage from './pages/ImpressumPage';
import DatenschutzPage from './pages/DatenschutzPage';
import CalendarPage from './pages/CalendarPage';
import AccountPage from './pages/AccountPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AgbPage from './pages/AgbPage';
import AdminPage from './pages/AdminPage';
import FamilyJoinPage from './pages/FamilyJoinPage';
import CoordinatorPage from './pages/CoordinatorPage';
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
      <Route path="/verify/:token" element={<VerifyEmailPage />} />
      <Route path="/passwort-vergessen" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/passwort-reset/:token" element={<ResetPasswordPage />} />
      <Route path="/datenschutz" element={<DatenschutzPage />} />
      <Route path="/impressum" element={<ImpressumPage />} />
      <Route path="/agb" element={<AgbPage />} />
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/suche" element={<PrivateRoute><SearchPage /></PrivateRoute>} />
      <Route path="/profil/:id" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
      <Route path="/profil/bearbeiten" element={<PrivateRoute><EditProfilePage /></PrivateRoute>} />
      <Route path="/anfragen" element={<PrivateRoute><MatchesPage /></PrivateRoute>} />
      <Route path="/kalender" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
      <Route path="/konto" element={<PrivateRoute><AccountPage /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
      <Route path="/family/join/:token" element={<FamilyJoinPage />} />
      <Route path="/koordination" element={<PrivateRoute><CoordinatorPage /></PrivateRoute>} />
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
          <Footer />
          <FeedbackWidget />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
