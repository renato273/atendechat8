export const inactivityConfig = {
  // Tiempo en minutos para marcar usuario como offline en el dashboard
  offlineTimeoutMinutes: parseInt(process.env.USER_OFFLINE_TIMEOUT_MINUTES || '10'),
  
  // Frecuencia de verificación en segundos
  checkIntervalSeconds: 30,
  
  // Mensajes para logs
  messages: {
    userOffline: 'Usuario marcado como offline por inactividad ({timeout} minutos)',
    userOnline: 'Usuario marcado como online por actividad reciente'
  }
};
