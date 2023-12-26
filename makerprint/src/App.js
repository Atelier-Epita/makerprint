import React from 'react';

import Error from './components/Error';
import Menu from './components/Menu';
import Move from './components/Move';

import './App.css';
import { UserProvider } from './UserContext';
import Status from './components/Status';

function App() {
  return (
    <div className="app">
      <UserProvider>
        <Error />
        <div className="app-content">
          <Menu />
          <Move />
          <Status />
        </div>
      </UserProvider>
    </div>
  );
}

export default App;