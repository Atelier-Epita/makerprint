import React from 'react';
import Menu from './components/Menu';
import Console from './components/Console';
import './App.css';
import { UserProvider } from './UserContext';

function App() {
  return (
    <div className="app">
      <UserProvider>
        <Menu className="menu" />
        <Console printerName="Printer 1" />
      </UserProvider>
    </div>
  );
}

export default App;