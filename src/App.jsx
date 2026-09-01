import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { SocketProvider } from './context/SocketContext';
import Main from './pages/Main';
import TeamDashboard from './pages/TeamDashboard';
import Admin from './pages/Admin';
import Leaderboard from './pages/Leaderboard';

function App() {
  return (
    <SocketProvider>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/team" element={<TeamDashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </SocketProvider>
  );
}

export default App;
