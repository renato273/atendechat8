import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { makeStyles } from '@material-ui/core/styles';
import { Button, LinearProgress, Typography, Box } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  warningToast: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeaa7',
    color: '#856404',
    minWidth: '350px',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  progressBar: {
    height: '4px',
    marginTop: '12px',
    marginBottom: '12px',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px'
  },
  title: {
    fontWeight: 'bold',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  message: {
    marginBottom: '12px'
  }
}));

const InactivityWarningToast = ({ 
  message, 
  remainingMinutes, 
  onExtend, 
  onDismiss 
}) => {
  const classes = useStyles();
  const [timeLeft, setTimeLeft] = useState(remainingMinutes * 60);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const totalSeconds = remainingMinutes * 60;
    const currentProgress = (timeLeft / totalSeconds) * 100;
    setProgress(currentProgress);
  }, [timeLeft, remainingMinutes]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExtend = () => {
    if (onExtend) {
      onExtend();
    }
    toast.dismiss();
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
    toast.dismiss();
  };

  return (
    <div className={classes.warningToast}>
      <Typography className={classes.title}>
        <span role="img" aria-label="warning">⚠️</span>
        Advertencia de Inactividad
        <small style={{ marginLeft: 'auto' }}>{formatTime(timeLeft)}</small>
      </Typography>
      
      <Typography className={classes.message}>
        {message}
      </Typography>
      
      <LinearProgress 
        variant="determinate" 
        value={progress} 
        className={classes.progressBar}
        color="secondary"
      />
      
      <div className={classes.actionButtons}>
        <Button
          size="small"
          variant="outlined"
          color="primary"
          onClick={handleExtend}
        >
          Mantener Sesión
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="default"
          onClick={handleDismiss}
        >
          Cerrar
        </Button>
      </div>
    </div>
  );
};

export default InactivityWarningToast;
