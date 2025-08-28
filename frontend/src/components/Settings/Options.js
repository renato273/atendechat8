import React, { useEffect, useState } from "react";

import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import FormHelperText from "@material-ui/core/FormHelperText";
import TextField from "@material-ui/core/TextField";
import Title from "../Title";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import useSettings from "../../hooks/useSettings";
import { ToastContainer, toast } from 'react-toastify';
import { makeStyles } from "@material-ui/core/styles";
import { grey, blue } from "@material-ui/core/colors";
import { Tabs, Tab } from "@material-ui/core";
import { i18n } from "../../translate/i18n";

//import 'react-toastify/dist/ReactToastify.css';
 
const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  fixedHeightPaper: {
    padding: theme.spacing(2),
    display: "flex",
    overflow: "auto",
    flexDirection: "column",
    height: 240,
  },
  tab: {
    backgroundColor: theme.palette.options,  //DARK MODE PLW DESIGN//
    borderRadius: 4,
    width: "100%",
    "& .MuiTab-wrapper": {
      color: theme.palette.fontecor,
    },   //DARK MODE PLW DESIGN//
    "& .MuiTabs-flexContainer": {
      justifyContent: "center"
    }


  },
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    alignItems: "center",
    marginBottom: 12,
    width: "100%",
  },
  cardAvatar: {
    fontSize: "55px",
    color: grey[500],
    backgroundColor: "#ffffff",
    width: theme.spacing(7),
    height: theme.spacing(7),
  },
  cardTitle: {
    fontSize: "18px",
    color: blue[700],
  },
  cardSubtitle: {
    color: grey[600],
    fontSize: "14px",
  },
  alignRight: {
    textAlign: "right",
  },
  fullWidth: {
    width: "100%",
  },
  selectContainer: {
    width: "100%",
    textAlign: "left",
  },
}));

export default function Options(props) {
  const { settings, scheduleTypeChanged } = props;
  const classes = useStyles();
  const [userRating, setUserRating] = useState("disabled");
  const [scheduleType, setScheduleType] = useState("disabled");
  const [callType, setCallType] = useState("enabled");
  const [chatbotType, setChatbotType] = useState("");
  const [CheckMsgIsGroup, setCheckMsgIsGroupType] = useState("enabled");

  // 🔥 NUEVAS OPCIONES: Creación de usuarios y restricción de audio
  const [userCreation, setUserCreation] = useState("enabled");
  const [userAudioRestriction, setUserAudioRestriction] = useState("enabled");

  const [loadingUserRating, setLoadingUserRating] = useState(false);
  const [loadingScheduleType, setLoadingScheduleType] = useState(false);
  const [loadingCallType, setLoadingCallType] = useState(false);
  const [loadingChatbotType, setLoadingChatbotType] = useState(false);
  const [loadingCheckMsgIsGroup, setLoadingCheckMsgIsGroup] = useState(false);

  // 🔥 NUEVOS LOADINGS: Para las nuevas opciones
  const [loadingUserCreation, setLoadingUserCreation] = useState(false);
  const [loadingUserAudioRestriction, setLoadingUserAudioRestriction] = useState(false);


  //const [ipixcType, setIpIxcType] = useState("");
  //const [loadingIpIxcType, setLoadingIpIxcType] = useState(false);
  //const [tokenixcType, setTokenIxcType] = useState("");
  //const [loadingTokenIxcType, setLoadingTokenIxcType] = useState(false);

  //const [ipmkauthType, setIpMkauthType] = useState("");
  //const [loadingIpMkauthType, setLoadingIpMkauthType] = useState(false);
  //const [clientidmkauthType, setClientIdMkauthType] = useState("");
  //const [loadingClientIdMkauthType, setLoadingClientIdMkauthType] = useState(false);
  //const [clientsecretmkauthType, setClientSecrectMkauthType] = useState("");
  //const [loadingClientSecrectMkauthType, setLoadingClientSecrectMkauthType] = useState(false);

  const [asaasType, setAsaasType] = useState("");
  const [loadingAsaasType, setLoadingAsaasType] = useState(false);
  
  // recursos a mais da plw design

  const [SendGreetingAccepted, setSendGreetingAccepted] = useState("disabled");
  const [loadingSendGreetingAccepted, setLoadingSendGreetingAccepted] = useState(false);
  
  const [SettingsTransfTicket, setSettingsTransfTicket] = useState("disabled");
  const [loadingSettingsTransfTicket, setLoadingSettingsTransfTicket] = useState(false);
  
  const [sendGreetingMessageOneQueues, setSendGreetingMessageOneQueues] = useState("disabled");
  const [loadingSendGreetingMessageOneQueues, setLoadingSendGreetingMessageOneQueues] = useState(false);

  const { update } = useSettings();

  useEffect(() => {
    if (Array.isArray(settings) && settings.length) {
      const userRating = settings.find((s) => s.key === "userRating");
      if (userRating) {
        setUserRating(userRating.value);
      }
      const scheduleType = settings.find((s) => s.key === "scheduleType");
      if (scheduleType) {
        setScheduleType(scheduleType.value);
      }
      const callType = settings.find((s) => s.key === "call");
      if (callType) {
        setCallType(callType.value);
      }
      const CheckMsgIsGroup = settings.find((s) => s.key === "CheckMsgIsGroup");
      if (CheckMsgIsGroup) {
        setCheckMsgIsGroupType(CheckMsgIsGroup.value);
      }
	  
	  {/*PLW DESIGN SAUDAÇÃO*/}
      const SendGreetingAccepted = settings.find((s) => s.key === "sendGreetingAccepted");
      if (SendGreetingAccepted) {
        setSendGreetingAccepted(SendGreetingAccepted.value);
      }	 
	  {/*PLW DESIGN SAUDAÇÃO*/}	 
	  
	  {/*TRANSFERIR TICKET*/}	
	  const SettingsTransfTicket = settings.find((s) => s.key === "sendMsgTransfTicket");
      if (SettingsTransfTicket) {
        setSettingsTransfTicket(SettingsTransfTicket.value);
      }
	  {/*TRANSFERIR TICKET*/}

      const sendGreetingMessageOneQueues = settings.find((s) => s.key === "sendGreetingMessageOneQueues");
      if (sendGreetingMessageOneQueues) {
        setSendGreetingMessageOneQueues(sendGreetingMessageOneQueues.value)
      }	  
	  
      const chatbotType = settings.find((s) => s.key === "chatBotType");
      if (chatbotType) {
        setChatbotType(chatbotType.value);
      }

      // 🔥 NUEVAS OPCIONES: Cargar configuración de creación de usuarios y audio
      const userCreationSetting = settings.find((s) => s.key === "userCreation");
      if (userCreationSetting) {
        setUserCreation(userCreationSetting.value);
      }

      const userAudioRestrictionSetting = settings.find((s) => s.key === "userAudioRestriction");
      if (userAudioRestrictionSetting) {
        setUserAudioRestriction(userAudioRestrictionSetting.value);
      }

	    {/*const ipixcType = settings.find((s) => s.key === "ipixc");
      if (ipixcType) {
        setIpIxcType(ipixcType.value);
      }*/}

      {/*const tokenixcType = settings.find((s) => s.key === "tokenixc");
      if (tokenixcType) {
        setTokenIxcType(tokenixcType.value);
      }*/}

      {/*const ipmkauthType = settings.find((s) => s.key === "ipmkauth");
      if (ipmkauthType) {
        setIpMkauthType(ipixcType.value);
      }*/}

     {/* const clientidmkauthType = settings.find((s) => s.key === "clientidmkauth");
      if (clientidmkauthType) {
        setClientIdMkauthType(clientidmkauthType.value);
      }*/}

      {/*const clientsecretmkauthType = settings.find((s) => s.key === "clientsecretmkauth");
      if (clientsecretmkauthType) {
        setClientSecrectMkauthType(clientsecretmkauthType.value);
      }*/}

      const asaasType = settings.find((s) => s.key === "asaas");
      if (asaasType) {
        setAsaasType(asaasType.value);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  async function handleChangeUserRating(value) {
    setUserRating(value);
    setLoadingUserRating(true);
    await update({
      key: "userRating",
      value,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingUserRating(false);
  }
  
    async function handleSendGreetingMessageOneQueues(value) {
    setSendGreetingMessageOneQueues(value);
    setLoadingSendGreetingMessageOneQueues(true);
    await update({
      key: "sendGreetingMessageOneQueues",
      value,
    });
	toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingSendGreetingMessageOneQueues(false);
  }

  async function handleScheduleType(value) {
    setScheduleType(value);
    setLoadingScheduleType(true);
    await update({
      key: "scheduleType",
      value,
    });
    //toast.success("Oraçãpeo atualizada com sucesso.");
    toast.success(i18n.t("settings.options.toasts.success"), {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      theme: "light",
      });
    setLoadingScheduleType(false);
    if (typeof scheduleTypeChanged === "function") {
      scheduleTypeChanged(value);
    }
  }

  async function handleCallType(value) {
    setCallType(value);
    setLoadingCallType(true);
    await update({
      key: "call",
      value,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingCallType(false);
  }

  async function handleChatbotType(value) {
    setChatbotType(value);
    setLoadingChatbotType(true);
    await update({
      key: "chatBotType",
      value,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingChatbotType(false);
  }

  async function handleGroupType(value) {
    setCheckMsgIsGroupType(value);
    setLoadingCheckMsgIsGroup(true);
    await update({
      key: "CheckMsgIsGroup",
      value,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingCheckMsgIsGroup(false);
    /*     if (typeof scheduleTypeChanged === "function") {
          scheduleTypeChanged(value);
        } */
  }
  
  {/*NOVO CÓDIGO*/}  
  async function handleSendGreetingAccepted(value) {
    setSendGreetingAccepted(value);
    setLoadingSendGreetingAccepted(true);
    await update({
      key: "sendGreetingAccepted",
      value,
    });
	toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingSendGreetingAccepted(false);
  }  
  
  
  {/*NOVO CÓDIGO*/}    

  async function handleSettingsTransfTicket(value) {
    setSettingsTransfTicket(value);
    setLoadingSettingsTransfTicket(true);
    await update({
      key: "sendMsgTransfTicket",
      value,
    });

    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingSettingsTransfTicket(false);
  } 
 
 {/*async function handleChangeIPIxc(value) {
    setIpIxcType(value);
    setLoadingIpIxcType(true);
    await update({
      key: "ipixc",
      value,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingIpIxcType(false);
  }

   {/*async function handleChangeTokenIxc(value) {
    setTokenIxcType(value);
    setLoadingTokenIxcType(true);
    await update({
      key: "tokenixc",
      value,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingTokenIxcType(false);
  }

  async function handleChangeIpMkauth(value) {
    setIpMkauthType(value);
    setLoadingIpMkauthType(true);
    await update({
      key: "ipmkauth",
      value,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingIpMkauthType(false);
  }

  async function handleChangeClientIdMkauth(value) {
    setClientIdMkauthType(value);
    setLoadingClientIdMkauthType(true);
    await update({
      key: "clientidmkauth",
      value,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingClientIdMkauthType(false);
  }

  async function handleChangeClientSecrectMkauth(value) {
    setClientSecrectMkauthType(value);
    setLoadingClientSecrectMkauthType(true);
    await update({
      key: "clientsecretmkauth",
      value,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingClientSecrectMkauthType(false);
  }*/}

  async function handleChangeAsaas(value) {
    setAsaasType(value);
    setLoadingAsaasType(true);
    await update({
      key: "asaas",
      value,
    });
    toast.success(i18n.t("settings.options.toasts.success"));
    setLoadingAsaasType(false);
  }

  // 🔥 NUEVAS FUNCIONES: Manejar cambios de creación de usuarios y restricción de audio
  async function handleUserCreation(value) {
    setUserCreation(value);
    setLoadingUserCreation(true);
    try {
      await update({
        key: "userCreation",
        value,
      });
      toast.success(i18n.t("settings.options.toasts.success"));
    } catch (error) {
      toast.error("Error al actualizar la configuración de creación de usuarios");
    } finally {
      setLoadingUserCreation(false);
    }
  }

  async function handleUserAudioRestriction(value) {
    setUserAudioRestriction(value);
    setLoadingUserAudioRestriction(true);
    try {
      await update({
        key: "userAudioRestriction",
        value,
      });
      toast.success(i18n.t("settings.options.toasts.success"));
    } catch (error) {
      toast.error("Error al actualizar la configuración de audio");
    } finally {
      setLoadingUserAudioRestriction(false);
    }
  }
  return (
    <>
      <Grid spacing={3} container>
        {/* <Grid xs={12} item>
                    <Title>Configurações Gerais</Title>
                </Grid> */}
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="ratings-label">{i18n.t("settings.options.fields.ratings.title")}</InputLabel>
            <Select
              labelId="ratings-label"
              value={userRating}
              onChange={async (e) => {
                handleChangeUserRating(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>{i18n.t("settings.options.fields.ratings.disabled")}</MenuItem>
              <MenuItem value={"enabled"}>{i18n.t("settings.options.fields.ratings.enabled")}</MenuItem>
            </Select>
            <FormHelperText>
              {loadingUserRating && i18n.t("settings.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="schedule-type-label">
              {i18n.t("settings.options.fields.expedientManager.title")}
            </InputLabel>
            <Select
              labelId="schedule-type-label"
              value={scheduleType}
              onChange={async (e) => {
                handleScheduleType(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>{i18n.t("settings.options.fields.disabled")}</MenuItem>
              <MenuItem value={"queue"}>{i18n.t("settings.options.fields.expedientManager.queue")}</MenuItem>
              <MenuItem value={"company"}>{i18n.t("settings.options.fields.expedientManager.company")}</MenuItem>
            </Select>
            <FormHelperText>
              {loadingScheduleType && i18n.t("settings.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="group-type-label">
              {i18n.t("settings.options.fields.ignoreMessages.title")}
            </InputLabel>
            <Select
              labelId="group-type-label"
              value={CheckMsgIsGroup}
              onChange={async (e) => {
                handleGroupType(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>{i18n.t("settings.options.fields.disabled")}</MenuItem>
              <MenuItem value={"enabled"}>{i18n.t("settings.options.fields.active")}</MenuItem>
            </Select>
            <FormHelperText>
              {loadingCheckMsgIsGroup && i18n.t("settings.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="call-type-label">
              {i18n.t("settings.options.fields.acceptCall.title")}
            </InputLabel>
            <Select
              labelId="call-type-label"
              value={callType}
              onChange={async (e) => {
                handleCallType(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>{i18n.t("settings.options.fields.acceptCall.disabled")}</MenuItem>
              <MenuItem value={"enabled"}>{i18n.t("settings.options.fields.acceptCall.enabled")}</MenuItem>
            </Select>
            <FormHelperText>
              {loadingCallType && i18n.t("settings.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="chatbot-type-label">
              {i18n.t("settings.options.fields.chatbotType.title")}
            </InputLabel>
            <Select
              labelId="chatbot-type-label"
              value={chatbotType}
              onChange={async (e) => {
                handleChatbotType(e.target.value);
              }}
            >
              <MenuItem value={"text"}>{i18n.t("settings.options.fields.chatbotType.text")}</MenuItem>
			 {/*<MenuItem value={"button"}>Botão</MenuItem>*/}
             {/*<MenuItem value={"list"}>Lista</MenuItem>*/}
            </Select>
            <FormHelperText>
              {loadingChatbotType && i18n.t("settings.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>
		{/* ENVIAR SAUDAÇÃO AO ACEITAR O TICKET */}
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="sendGreetingAccepted-label">
              {i18n.t("settings.options.fields.sendGreetingAccepted.title")}
            </InputLabel>
            <Select
              labelId="sendGreetingAccepted-label"
              value={SendGreetingAccepted}
              onChange={async (e) => {
                handleSendGreetingAccepted(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>{i18n.t("settings.options.fields.disabled")}</MenuItem>
              <MenuItem value={"enabled"}>{i18n.t("settings.options.fields.enabled")}</MenuItem>
            </Select>
            <FormHelperText>
              {loadingSendGreetingAccepted && i18n.t("settings.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>
		{/* ENVIAR SAUDAÇÃO AO ACEITAR O TICKET */}
		
		{/* ENVIAR MENSAGEM DE TRANSFERENCIA DE SETOR/ATENDENTE */}
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="sendMsgTransfTicket-label">
              {i18n.t("settings.options.fields.sendMsgTransfTicket.title")}
            </InputLabel>
            <Select
              labelId="sendMsgTransfTicket-label"
              value={SettingsTransfTicket}
              onChange={async (e) => {
                handleSettingsTransfTicket(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>{i18n.t("settings.options.fields.disabled")}</MenuItem>
              <MenuItem value={"enabled"}>{i18n.t("settings.options.fields.enabled")}</MenuItem>
            </Select>
            <FormHelperText>
              {loadingSettingsTransfTicket && i18n.t("settings.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>
		
		{/* ENVIAR SAUDAÇÃO QUANDO HOUVER SOMENTE 1 FILA */}
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="sendGreetingMessageOneQueues-label">
              {i18n.t("settings.options.fields.sendGreetingMessageOneQueues.title")}
            </InputLabel>
            <Select
              labelId="sendGreetingMessageOneQueues-label"
              value={sendGreetingMessageOneQueues}
              onChange={async (e) => {
                handleSendGreetingMessageOneQueues(e.target.value);
              }}
            >
              <MenuItem value={"disabled"}>{i18n.t("settings.options.fields.disabled")}</MenuItem>
              <MenuItem value={"enabled"}>{i18n.t("settings.options.fields.enabled")}</MenuItem>
            </Select>
            <FormHelperText>
              {loadingSendGreetingMessageOneQueues && i18n.t("settings.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>

        {/* 🔥 NUEVA OPCIÓN: Creación de Usuarios */}
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="userCreation-label">
              Creación de Usuarios
            </InputLabel>
            <Select
              labelId="userCreation-label"
              value={userCreation}
              onChange={async (e) => {
                handleUserCreation(e.target.value);
              }}
            >
              <MenuItem value={"enabled"}>Habilitado</MenuItem>
              <MenuItem value={"disabled"}>Deshabilitado</MenuItem>
            </Select>
            <FormHelperText>
              {loadingUserCreation && i18n.t("settings.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>

        {/* 🔥 NUEVA OPCIÓN: Restricción de Audio para Usuarios */}
        <Grid xs={12} sm={6} md={4} item>
          <FormControl className={classes.selectContainer}>
            <InputLabel id="userAudioRestriction-label">
              Envío de Audio por Usuarios
            </InputLabel>
            <Select
              labelId="userAudioRestriction-label"
              value={userAudioRestriction}
              onChange={async (e) => {
                handleUserAudioRestriction(e.target.value);
              }}
            >
              <MenuItem value={"enabled"}>Permitido</MenuItem>
              <MenuItem value={"disabled"}>Restringido</MenuItem>
            </Select>
            <FormHelperText>
              {loadingUserAudioRestriction && i18n.t("settings.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>
		
      </Grid>
      <Grid spacing={3} container>
        <Tabs
          indicatorColor="primary"
          textColor="primary"
          scrollButtons="on"
          variant="scrollable"
          className={classes.tab}
          style={{
            marginBottom: 20,
            marginTop: 20
          }}
        >
          <Tab

            label={i18n.t("settings.options.tabs.integrations")} />

        </Tabs>

      </Grid>
      {/*-----------------IXC DESATIVADO 4.6.5-----------------*/}
      {/*<Grid spacing={3} container
        style={{ marginBottom: 10 }}>
        <Tabs
          indicatorColor="primary"
          textColor="primary"
          scrollButtons="on"
          variant="scrollable"
          className={classes.tab}
        >
          <Tab

            label="IXC" />

        </Tabs>
        <Grid xs={12} sm={6} md={6} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="ipixc"
              name="ipixc"
              margin="dense"
              label="IP do IXC"
              variant="outlined"
              value={ipixcType}
              onChange={async (e) => {
                handleChangeIPIxc(e.target.value);
              }}
            >
            </TextField>
            <FormHelperText>
              {loadingIpIxcType && i18n.t("settings.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={6} md={6} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="tokenixc"
              name="tokenixc"
              margin="dense"
              label="Token do IXC"
              variant="outlined"
              value={tokenixcType}
              onChange={async (e) => {
                handleChangeTokenIxc(e.target.value);
              }}
            >
            </TextField>
            <FormHelperText>
              {loadingTokenIxcType && i18n.t("settings.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>*/}
      {/*-----------------MK-AUTH DESATIVADO 4.6.5-----------------*/}
      {/*<Grid spacing={3} container
        style={{ marginBottom: 10 }}>
        <Tabs
          indicatorColor="primary"
          textColor="primary"
          scrollButtons="on"
          variant="scrollable"
          className={classes.tab}
        >
          <Tab label="MK-AUTH" />

        </Tabs>
        <Grid xs={12} sm={12} md={4} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="ipmkauth"
              name="ipmkauth"
              margin="dense"
              label="Ip Mk-Auth"
              variant="outlined"
              value={ipmkauthType}
              onChange={async (e) => {
                handleChangeIpMkauth(e.target.value);
              }}
            >
            </TextField>
            <FormHelperText>
              {loadingIpMkauthType && i18n.t("settings.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={12} md={4} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="clientidmkauth"
              name="clientidmkauth"
              margin="dense"
              label="Client Id"
              variant="outlined"
              value={clientidmkauthType}
              onChange={async (e) => {
                handleChangeClientIdMkauth(e.target.value);
              }}
            >
            </TextField>
            <FormHelperText>
              {loadingClientIdMkauthType && i18n.t("settings.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>
        <Grid xs={12} sm={12} md={4} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="clientsecretmkauth"
              name="clientsecretmkauth"
              margin="dense"
              label="Client Secret"
              variant="outlined"
              value={clientsecretmkauthType}
              onChange={async (e) => {
                handleChangeClientSecrectMkauth(e.target.value);
              }}
            >
            </TextField>
            <FormHelperText>
              {loadingClientSecrectMkauthType && i18n.t("settings.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>*/}
      {/*-----------------ASAAS-----------------*/}
      <Grid spacing={3} container
        style={{ marginBottom: 10 }}>
        <Tabs
          indicatorColor="primary"
          textColor="primary"
          scrollButtons="on"
          variant="scrollable"
          className={classes.tab}
        >
          <Tab label="ASAAS" />

        </Tabs>
        <Grid xs={12} sm={12} md={12} item>
          <FormControl className={classes.selectContainer}>
            <TextField
              id="asaas"
              name="asaas"
              margin="dense"
              label="Token Asaas"
              variant="outlined"
              value={asaasType}
              onChange={async (e) => {
                handleChangeAsaas(e.target.value);
              }}
            >
            </TextField>
            <FormHelperText>
              {loadingAsaasType && i18n.t("settings.options.updating")}
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
    </>
  );
}
