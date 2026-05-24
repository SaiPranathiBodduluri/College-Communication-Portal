import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const newSocket = io('http://localhost:5000');
      
      newSocket.on('connect', () => {
        console.log('Connected to server');
        newSocket.emit('join-room', user.id);
      });

      newSocket.on('new-notice', (notice) => {
        toast.info(`New notice: ${notice.title}`, {
          onClick: () => window.location.href = `/notices/${notice._id}`
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  const value = {
    socket
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};