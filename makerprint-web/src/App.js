import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import Error from './components/Error';
import Menu from './components/Menu';
import PrinterPage from './components/PrinterPage';

import { UserProvider } from './UserContext';
import { Link } from 'react-router-dom';
import "./styles/App.css";

function AppHeader() {
  return (
    <header className="app_header">
      <div className="app_header_content">
        <Link to="/" className="app_header_logo_link">
          <img src="/logo.png" alt="MakerPrint Logo" className="app_logo" />
        </Link>
        <h1 className="app_title">MakerPrint</h1>
      </div>
    </header>
  );
}

function AppFooter() {
  return (
    <footer className="app_footer">
      <p>MakerPrint - L'Atelier © 2025</p>
    </footer>
  );
}

function AppContent() {
  return (
    <div className="app_content">
      <Routes>
        <Route path="/" element={<Menu />} />
        <Route path="/printer/:name" element={<PrinterPage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <div className="app">
      <UserProvider>
        <Router>
          <Error />
          <AppHeader />
          <AppContent />
          <AppFooter />
        </Router>
      </UserProvider>
    </div>
  );
}

export default App;