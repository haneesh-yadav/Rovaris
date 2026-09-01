import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [team, setTeam] = useState(null);
  const [connected, setConnected] = useState(false);
  const [gameSession, setGameSession] = useState({
    phase: 'lobby',
    isPaused: false,
    reveals: { round2Revealed: false, round3Revealed: false }
  });
  const [lobbyTeams, setLobbyTeams] = useState([]);

  useEffect(() => {
    // Determine backend URL robustly across localhost, 127.0.0.1, and LAN IP
    const host = window.location.hostname || 'localhost';
    const serverUrl = `http://${host}:3001`;

    console.log(`[ROVARIS Socket] Connecting to backend at ${serverUrl}...`);

    const newSocket = io(serverUrl, {
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      timeout: 10000,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to ROVARIS Mission Control backend:', newSocket.id);
      setConnected(true);

      // Fetch initial session & lobby state
      newSocket.emit('get_lobby_state', (res) => {
        if (res && res.success) {
          setLobbyTeams(res.teams || []);
          if (res.session) setGameSession(res.session);
        }
      });

      newSocket.emit('get_game_session', (res) => {
        if (res && res.success && res.session) {
          setGameSession(res.session);
        }
      });
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from ROVARIS server');
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.warn('⚠️ Socket connection error, falling back / retrying:', err.message);
    });

    newSocket.on('global_phase_change', (session) => {
      console.log('⚡ Global phase changed to:', session.phase, session);
      if (session) setGameSession(session);
    });

    newSocket.on('global_pause_toggle', (session) => {
      console.log('⏸️ Global pause toggled:', session);
      if (session) setGameSession(session);
    });

    newSocket.on('lobby_update', (data) => {
      if (data && data.teams) setLobbyTeams(data.teams);
      if (data && data.session) setGameSession(data.session);
    });

    newSocket.on('global_reveal', (reveals) => {
      if (reveals) {
        setGameSession((prev) => ({ ...prev, reveals }));
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const login = useCallback((teamName, members, callback) => {
    // Backward-compatible signature: allow login(teamName, callback)
    if (typeof members === 'function') {
      callback = members;
      members = [];
    }

    if (!socket || !connected) {
      if (callback) callback({ success: false, error: 'Server connection is offline. Please ensure backend is running.' });
      return;
    }

    socket.emit('team_login', teamName, members || [], (res) => {
      if (res && res.success) {
        setTeam(res.team);
        localStorage.setItem('rovaris_team', JSON.stringify(res.team));
        localStorage.setItem('rovaris_team_name', teamName);
        if (res.session) setGameSession(res.session);
      }
      if (callback) callback(res);
    });
  }, [socket, connected]);

  const logout = useCallback(() => {
    setTeam(null);
    localStorage.removeItem('rovaris_team');
    localStorage.removeItem('rovaris_team_name');
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        team,
        connected,
        gameSession,
        lobbyTeams,
        login,
        logout
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};