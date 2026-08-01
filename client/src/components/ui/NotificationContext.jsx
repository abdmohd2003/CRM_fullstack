// components/ui/NotificationContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  // Add a new notification
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      read: false,
      timestamp: new Date().toISOString(),
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setHasNewNotification(true);
    
    // Optional: Play sound
    // playNotificationSound();
  };
  
  // Mark a single notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    
    // Update hasNewNotification flag
    const hasUnread = notifications.some(notif => 
      notif.id !== notificationId && !notif.read
    );
    setHasNewNotification(hasUnread);
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    setHasNewNotification(false);
  };
  
  // Clear all notifications (remove them entirely)
  const clearAllNotifications = () => {
    setNotifications([]);
    setHasNewNotification(false);
  };
  
  // Remove a single notification
  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    
    // Update hasNewNotification flag
    const hasUnread = notifications.some(notif => 
      notif.id !== notificationId && !notif.read
    );
    setHasNewNotification(hasUnread);
  };
  
  // Clear only read notifications
  const clearReadNotifications = () => {
    setNotifications(prev => prev.filter(notif => !notif.read));
  };
  
  // Clear only unread notifications
  const clearUnreadNotifications = () => {
    setNotifications(prev => prev.filter(notif => notif.read));
    setHasNewNotification(false);
  };
  
  // Clear the new notification badge (without clearing notifications)
  const clearNotificationBadge = () => {
    setHasNewNotification(false);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      hasNewNotification,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearAllNotifications,
      removeNotification,
      clearReadNotifications,
      clearUnreadNotifications,
      clearNotificationBadge,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};