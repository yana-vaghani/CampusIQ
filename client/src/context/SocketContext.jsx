import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const toastRef = useRef(null);

  useEffect(() => {
    if (user) {
      const s = io(window.location.origin, { withCredentials: true });
      s.on('connect', () => {
        s.emit('join', user.id);
      });

      s.on('new_notification', (data) => {
        setNotifications(prev => [{ ...data, id: Date.now(), is_read: false, created_at: new Date() }, ...prev]);
        // Show toast
        if (toastRef.current) toastRef.current(data.message);
      });

      s.on('class_reminder', (data) => {
        setNotifications(prev => [{ ...data, id: Date.now(), is_read: false, created_at: new Date() }, ...prev]);
        if (toastRef.current) toastRef.current(data.message);
      });

      s.on('risk_alert', (data) => {
        if (toastRef.current) toastRef.current(`Risk Alert: ${data.message}`);
      });

      setSocket(s);
      return () => {
        s.emit('leave', user.id);
        s.disconnect();
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, notifications, setNotifications, toastRef }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};

export default SocketContext;
