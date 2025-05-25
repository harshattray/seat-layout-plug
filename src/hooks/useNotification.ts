/**
 * @file useNotification.ts
 * @description Custom hook for managing and displaying notifications to the user.
 * @author Harsha Attray
 * @version 1.0.0
 * @license MIT
 */
import { useState, useRef, useEffect, useCallback } from 'react';

export const useNotification = (defaultTimeout: number = 3000) => {
  const [notification, setNotification] = useState<string | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = useCallback(
    (message: string, duration?: number) => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
      setNotification(message);
      notificationTimeoutRef.current = setTimeout(() => {
        setNotification(null);
        notificationTimeoutRef.current = null;
      }, duration ?? defaultTimeout);
    },
    [defaultTimeout],
  );

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  return { notification, showNotification };
};
