import React, { useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import InactivityWarningToast from '../../components/InactivityWarningToast';
import useAuth from '../useAuth.js';

const useInactivityMonitor = () => {
  const { user } = useAuth();
  const warningToastId = useRef(null);

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

  // Función para mostrar la advertencia
  const showWarning = useCallback((message, remainingMinutes) => {
    console.log('🎯 Mostrando advertencia de inactividad:', { message, remainingMinutes });
    
    // Cerrar toast anterior si existe
    if (warningToastId.current) {
      toast.dismiss(warningToastId.current);
    }

    // Mostrar nuevo toast de advertencia
    warningToastId.current = toast(
      <InactivityWarningToast
        message={message}
        remainingMinutes={remainingMinutes}
        onExtend={() => {
          updateUserActivity();
          toast.success('Sesión extendida por actividad');
        }}
        onDismiss={() => {
          warningToastId.current = null;
        }}
      />,
      {
        position: 'top-center',
        autoClose: false,
        closeOnClick: false,
        pauseOnHover: false,
        draggable: false,
        closeButton: false,
        toastId: 'inactivity-warning'
      }
    );
  }, [updateUserActivity]);

  // Función para limpiar la advertencia
  const clearWarning = useCallback(() => {
    if (warningToastId.current) {
      toast.dismiss(warningToastId.current);
      warningToastId.current = null;
    }
  }, []);

  // Eventos que indican actividad del usuario
  const handleUserActivity = useCallback(() => {
    updateUserActivity();
    clearWarning();
  }, [updateUserActivity, clearWarning]);

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

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
    };
  }, [handleUserActivity]);

  // Listener para eventos del backend
  useEffect(() => {
    if (!window.socket) {
      console.log('⚠️ Socket no disponible para inactividad');
      return;
    }

    console.log('🎯 Configurando listeners de inactividad');

    // Listener para advertencia de inactividad
    const handleInactivityWarning = (data) => {
      console.log('🎯 Evento inactivityWarning recibido:', data);
      showWarning(data.message, data.remainingMinutes);
    };

    // Listener para logout forzado
    const handleForceLogout = (data) => {
      console.log('🎯 Evento forceLogout recibido:', data);
      if (data.reason === 'inactivity') {
        clearWarning();
        toast.error(`Sesión cerrada por inactividad: ${data.message}`);
        setTimeout(() => {
          localStorage.clear();
          window.location.reload();
        }, 2000);
      }
    };

    window.socket.on('inactivityWarning', handleInactivityWarning);
    window.socket.on('forceLogout', handleForceLogout);

    return () => {
      window.socket.off('inactivityWarning', handleInactivityWarning);
      window.socket.off('forceLogout', handleForceLogout);
    };
  }, [showWarning, clearWarning]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      clearWarning();
    };
  }, [clearWarning]);

  return {
    updateUserActivity,
    clearWarning
  };
};

export default useInactivityMonitor;
