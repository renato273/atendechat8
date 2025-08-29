export const inactivityConfig = {
  // Tiempo en minutos para mostrar advertencia de inactividad
  warningTimeoutMinutes: parseInt(process.env.USER_WARNING_TIMEOUT_MINUTES || '5'),
  
  // Tiempo en minutos para cerrar sesión por inactividad
  offlineTimeoutMinutes: parseInt(process.env.USER_OFFLINE_TIMEOUT_MINUTES || '10'),
  
  // Frecuencia de verificación en segundos
  checkIntervalSeconds: 30,
  
  // Mensajes personalizables
  messages: {
    warning: 'Advertencia: Tu sesión se cerrará en {remaining} minutos por inactividad',
    logout: 'Sesión cerrada por inactividad ({timeout} minutos)'
  }
};
