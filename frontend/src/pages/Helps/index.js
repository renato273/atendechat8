import React, { useState, useEffect, useCallback } from "react";
import { makeStyles, Paper, Typography, Modal, IconButton } from "@material-ui/core";
import MainContainer from "../../components/MainContainer";
import MainHeader from "../../components/MainHeader";
import MainHeaderButtonsWrapper from "../../components/MainHeaderButtonsWrapper";
import Title from "../../components/Title";
import { i18n } from "../../translate/i18n";
import useHelps from "../../hooks/useHelps";

const useStyles = makeStyles(theme => ({
  mainPaperContainer: {
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 200px)',
  },
  mainPaper: {
    width: '100%',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: theme.spacing(3),
    padding: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  helpPaper: {
    position: 'relative',
    width: '100%',
    minHeight: '340px',
    padding: theme.spacing(2),
    boxShadow: theme.shadows[3],
    borderRadius: theme.spacing(1),
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    maxWidth: '340px',
  },
  paperHover: {
    transition: 'transform 0.3s, box-shadow 0.3s',
    '&:hover': {
      transform: 'scale(1.03)',
      boxShadow: `0 0 8px`,
      color: theme.palette.primary.main,
    },
  },
  videoThumbnail: {
    width: '100%',
    height: 'calc(100% - 56px)',
    objectFit: 'cover',
    borderRadius: `${theme.spacing(1)}px ${theme.spacing(1)}px 0 0`,
    backgroundColor: '#f5f5f5',
  },
  videoTitle: {
    marginTop: theme.spacing(1),
    flex: 1,
  },
  videoDescription: {
    maxHeight: '100px',
    overflow: 'hidden',
  },
  videoModal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoModalContent: {
    outline: 'none',
    width: '90%',
    maxWidth: 1024,
    aspectRatio: '16/9',
    position: 'relative',
    backgroundColor: 'white',
    borderRadius: theme.spacing(1),
    overflow: 'hidden',
  },
  errorMessage: {
    color: theme.palette.error.main,
    textAlign: 'center',
    padding: theme.spacing(2),
  },
  retryButton: {
    marginTop: theme.spacing(1),
  },
}));

const Helps = () => {
  const classes = useStyles();
  const [records, setRecords] = useState([]);
  const { list } = useHelps();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const helps = await list();
      setRecords(helps);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openVideoModal = (video) => {
    setSelectedVideo(video);
    setVideoError(false); // Reset error state
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
    setVideoError(false);
  };

  const handleModalClose = useCallback((event) => {
    if (event.key === "Escape") {
      closeVideoModal();
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleModalClose);
    return () => {
      document.removeEventListener("keydown", handleModalClose);
    };
  }, [handleModalClose]);

  // Función mejorada para manejo de errores en thumbnails
  const handleThumbnailError = (event, videoId) => {
    console.log(`Error cargando thumbnail para video: ${videoId}`);
    // Fallback a thumbnail de menor calidad
    event.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  };

  // Función mejorada para obtener thumbnails de YouTube
  const getThumbnailUrl = (videoId) => {
    if (!videoId) return '';
    
    // Intentar con la mejor calidad disponible
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  // Función para validar ID de video de YouTube
  const isValidYouTubeId = (videoId) => {
    if (!videoId) return false;
    // Los IDs de YouTube tienen 11 caracteres alfanuméricos
    return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
  };

  // Función para extraer ID de video de diferentes formatos de URL
  const extractYouTubeId = (videoUrl) => {
    if (!videoUrl) return null;
    
    // Si ya es solo el ID
    if (isValidYouTubeId(videoUrl)) {
      return videoUrl;
    }
    
    // Patrones para diferentes formatos de URL de YouTube
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    ];
    
    for (const pattern of patterns) {
      const match = videoUrl.match(pattern);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  };

  const renderVideoModal = () => {
    if (!selectedVideo) return null;

    const videoId = extractYouTubeId(selectedVideo);
    
    if (!videoId || !isValidYouTubeId(videoId)) {
      return (
        <Modal
          open={Boolean(selectedVideo)}
          onClose={closeVideoModal}
          className={classes.videoModal}
        >
          <div className={classes.videoModalContent}>
            <div className={classes.errorMessage}>
              <Typography variant="h6" color="error">
                ID de video inválido
              </Typography>
              <Typography variant="body2">
                El ID del video no es válido. Verifique que sea un ID de YouTube correcto.
              </Typography>
            </div>
          </div>
        </Modal>
      );
    }

    return (
      <Modal
        open={Boolean(selectedVideo)}
        onClose={closeVideoModal}
        className={classes.videoModal}
      >
        <div className={classes.videoModalContent}>
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            onError={() => setVideoError(true)}
          />
        </div>
      </Modal>
    );
  };

  const renderHelps = () => {
    return (
      <>
        <div className={`${classes.mainPaper} ${classes.mainPaperContainer}`}>
          {records.length ? records.map((record, key) => {
            const videoId = extractYouTubeId(record.video);
            const isValidVideo = isValidYouTubeId(videoId);
            
            return (
              <Paper 
                key={key} 
                className={`${classes.helpPaper} ${classes.paperHover}`} 
                onClick={() => openVideoModal(record.video)}
              >
                {isValidVideo ? (
                  <img
                    src={getThumbnailUrl(videoId)}
                    alt={`Thumbnail de ${record.title}`}
                    className={classes.videoThumbnail}
                    onError={(e) => handleThumbnailError(e, videoId)}
                    loading="lazy"
                  />
                ) : (
                  <div 
                    className={classes.videoThumbnail}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f0f0f0',
                      color: '#666'
                    }}
                  >
                    <Typography variant="body2">
                      Video no disponible
                    </Typography>
                  </div>
                )}
                <Typography variant="button" className={classes.videoTitle}>
                  {record.title}
                </Typography>
                <Typography variant="caption" className={classes.videoDescription}>
                  {record.description}
                </Typography>
                {!isValidVideo && (
                  <Typography variant="caption" color="error">
                    ID de video inválido: {record.video}
                  </Typography>
                )}
              </Paper>
            );
          }) : null}
        </div>
      </>
    );
  };

  return (
    <MainContainer>
      <MainHeader>
        <Title>{i18n.t("helps.title")} ({records.length})</Title>
        <MainHeaderButtonsWrapper></MainHeaderButtonsWrapper>
      </MainHeader>
      <div className={classes.mainPaper}>
        {renderHelps()}
      </div>
      {renderVideoModal()}
    </MainContainer>
  );
};

export default Helps;