import React, { useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import useAuth from '../useAuth.js';

const useActivityMonitor = () => {
  const { user } = useAuth();
  const activityTimeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);

  // Función para actualizar la actividad del usuario
  const updateUserActivity = useCallback(async () => {
    try {
      // Emitir evento de actividad al backend
      if (window.socket) {
        window.socket.emit('userActivity', { userId: user?.id });
      }
    } catch (error) {
      console.error('Error actualizando actividad del usuario:', error);
    }
  }, [user?.id]);

  // Función para mostrar advertencia
  const showWarning = useCallback((remainingMinutes) => {
    console.log('⚠️ Mostrando advertencia de inactividad:', remainingMinutes);
    
    toast.warning(
      `Tu sesión se cerrará en ${remainingMinutes} minutos por inactividad. 
      Mueve el mouse o presiona una tecla para mantener la sesión activa.`,
      {
        position: 'top-center',
        autoClose: false,
        closeOnClick: false,
        pauseOnHover: false,
        draggable: false,
        closeButton: true,
        toastId: 'activity-warning'
      }
    );
  }, []);

  // Función para limpiar advertencia
  const clearWarning = useCallback(() => {
    toast.dismiss('activity-warning');
  }, []);

  // Eventos que indican actividad del usuario
  const handleUserActivity = useCallback(() => {
    updateUserActivity();
    clearWarning();
    
    // Resetear timers
    if (activityTimeoutRef.current) {
      clearTimeout(activityTimeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
    
    // Configurar nuevo timer de advertencia
    const warningMinutes = parseInt(process.env.REACT_APP_USER_WARNING_TIMEOUT_MINUTES || '5');
    const offlineMinutes = parseInt(process.env.REACT_APP_USER_OFFLINE_TIMEOUT_MINUTES || '10');
    
    warningTimeoutRef.current = setTimeout(() => {
      showWarning(offlineMinutes - warningMinutes);
    }, warningMinutes * 60 * 1000);
    
    // Configurar timer de logout
    activityTimeoutRef.current = setTimeout(() => {
      toast.error('Sesión cerrada por inactividad');
      setTimeout(() => {
        localStorage.clear();
        window.location.reload();
      }, 2000);
    }, offlineMinutes * 60 * 1000);
  }, [updateUserActivity, clearWarning, showWarning]);

  // Configurar listeners de actividad
  useEffect(() => {
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    // Inicializar timer al montar
    handleUserActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      
      // Limpiar timers
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [handleUserActivity]);

  return {
    updateUserActivity,
    clearWarning
  };
};

export default useActivityMonitor;
