import { createContext, useContext } from 'react';
import { useNotifications, type AppNotification } from '@/hooks/useNotifications';

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  readIds: Set<string>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  notifications: [],
  unreadCount: 0,
  readIds: new Set(),
  markAsRead: () => {},
  markAllAsRead: () => {},
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const notifs = useNotifications();
  return (
    <NotificationsContext.Provider value={notifs}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsContext() {
  return useContext(NotificationsContext);
}
