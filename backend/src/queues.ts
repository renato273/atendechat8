import * as Sentry from "@sentry/node";
import BullQueue from "bull";
import { MessageData, SendMessage } from "./helpers/SendMessage";
import Whatsapp from "./models/Whatsapp";
import { logger } from "./utils/logger";
import moment from "moment";
import Schedule from "./models/Schedule";
import Contact from "./models/Contact";
import { Op, QueryTypes, Sequelize } from "sequelize";
import GetDefaultWhatsApp from "./helpers/GetDefaultWhatsApp";
import Campaign from "./models/Campaign";
import ContactList from "./models/ContactList";
import ContactListItem from "./models/ContactListItem";
import { isEmpty, isNil, isArray } from "lodash";
import CampaignSetting from "./models/CampaignSetting";
import CampaignShipping from "./models/CampaignShipping";
import GetWhatsappWbot from "./helpers/GetWhatsappWbot";
import sequelize from "./database";
import { getMessageOptions } from "./services/WbotServices/SendWhatsAppMedia";
import { getIO } from "./libs/socket";
import path from "path";
import User from "./models/User";
import Company from "./models/Company";
import Plan from "./models/Plan";
import Ticket from "./models/Ticket";
import ShowFileService from "./services/FileServices/ShowService";
import FilesOptions from './models/FilesOptions';
import { addSeconds, differenceInSeconds } from "date-fns";
import formatBody from "./helpers/Mustache";
import { ClosedAllOpenTickets } from "./services/WbotServices/wbotClosedTickets";
import FindOrCreateTicketService from "./services/TicketServices/FindOrCreateTicketService";
import CreateMessageService from "./services/MessageServices/CreateMessageService";
import TicketTag from "./models/TicketTag";
import Tag from "./models/Tag";
import { inactivityConfig } from "./config/inactivity";


const nodemailer = require('nodemailer');
const CronJob = require('cron').CronJob;

const connection = process.env.REDIS_URI || "";
const limiterMax = process.env.REDIS_OPT_LIMITER_MAX || 1;
const limiterDuration = process.env.REDIS_OPT_LIMITER_DURATION || 3000;

interface ProcessCampaignData {
  id: number;
  delay: number;
}

interface PrepareContactData {
  contactId: number;
  campaignId: number;
  delay: number;
  variables: any[];
}

interface DispatchCampaignData {
  campaignId: number;
  campaignShippingId: number;
  contactListItemId: number;
}

export const userMonitor = new BullQueue("UserMonitor", connection);

export const queueMonitor = new BullQueue("QueueMonitor", connection);

export const messageQueue = new BullQueue("MessageQueue", connection, {
  limiter: {
    max: limiterMax as number,
    duration: limiterDuration as number
  }
});

export const scheduleMonitor = new BullQueue("ScheduleMonitor", connection);
export const sendScheduledMessages = new BullQueue(
  "SendScheduledMessages",
  connection
);

export const campaignQueue = new BullQueue("CampaignQueue", connection, {
  // ⚡ CONFIGURACIÓN OPTIMIZADA - PREVENIR SOBRECARGA
  limiter: {
    max: 50,         // ← Máximo 50 trabajos simultáneos
    duration: 60000  // ← Por minuto
  },
  defaultJobOptions: {
    removeOnComplete: 100,  // ← Mantener solo últimos 100 completados
    removeOnFail: 50,       // ← Mantener solo últimos 50 fallidos
    attempts: 3,            // ← Reintentar máximo 3 veces
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

async function handleSendMessage(job) {
  try {
    const { data } = job;

    const whatsapp = await Whatsapp.findByPk(data.whatsappId);

    if (whatsapp == null) {
      throw Error("WhatsApp no identificado");
    }

    const messageData: MessageData = data.data;

    await SendMessage(whatsapp, messageData);
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error("Cola de Mensajes -> Enviar Mensaje: error", e.message);
    throw e;
  }
}

{/*async function handleVerifyQueue(job) {
  logger.info("Buscando atendimentos perdidos nas filas");
  try {
    const companies = await Company.findAll({
      attributes: ['id', 'name'],
      where: {
        status: true,
        dueDate: {
          [Op.gt]: Sequelize.literal('CURRENT_DATE')
        }
      },
      include: [
        {
          model: Whatsapp, attributes: ["id", "name", "status", "timeSendQueue", "sendIdQueue"], where: {
            timeSendQueue: {
              [Op.gt]: 0
            }
          }
        },
      ]
    }); */}

{/*    companies.map(async c => {
      c.whatsapps.map(async w => {

        if (w.status === "CONNECTED") {

          var companyId = c.id;

          const moveQueue = w.timeSendQueue ? w.timeSendQueue : 0;
          const moveQueueId = w.sendIdQueue;
          const moveQueueTime = moveQueue;
          const idQueue = moveQueueId;
          const timeQueue = moveQueueTime;

          if (moveQueue > 0) {

            if (!isNaN(idQueue) && Number.isInteger(idQueue) && !isNaN(timeQueue) && Number.isInteger(timeQueue)) {

              const tempoPassado = moment().subtract(timeQueue, "minutes").utc().format();
              // const tempoAgora = moment().utc().format();

              const { count, rows: tickets } = await Ticket.findAndCountAll({
                where: {
                  status: "pending",
                  queueId: null,
                  companyId: companyId,
                  whatsappId: w.id,
                  updatedAt: {
                    [Op.lt]: tempoPassado
                  }
                },
                include: [
                  {
                    model: Contact,
                    as: "contact",
                    attributes: ["id", "name", "number", "email", "profilePicUrl"],
                    include: ["extraInfo"]
                  }
                ]
              });

              if (count > 0) {
                tickets.map(async ticket => {
                  await ticket.update({
                    queueId: idQueue
                  });

                  await ticket.reload();

                  const io = getIO();
                  io.to(ticket.status)
                    .to("notification")
                    .to(ticket.id.toString())
                    .emit(`company-${companyId}-ticket`, {
                      action: "update",
                      ticket,
                      ticketId: ticket.id
                    });

                  // io.to("pending").emit(`company-${companyId}-ticket`, {
                  //   action: "update",
                  //   ticket,
                  // });

                  logger.info(`Atendimento Perdido: ${ticket.id} - Empresa: ${companyId}`);
                });
              } else {
                logger.info(`Nenhum atendimento perdido encontrado - Empresa: ${companyId}`);
              }
            } else {
              logger.info(`Condição não respeitada - Empresa: ${companyId}`);
            }
          }
        }
      });
    });
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error("SearchForQueue -> VerifyQueue: error", e.message);
    throw e;
  }
}; */}

async function handleCloseTicketsAutomatic() {
  const job = new CronJob('*/1 * * * *', async () => {
    const companies = await Company.findAll();
    companies.map(async c => {

      try {
        const companyId = c.id;
        await ClosedAllOpenTickets(companyId);
      } catch (e: any) {
        Sentry.captureException(e);
        logger.error("Cerrar Tickets Automáticamente -> Verificar: error", e.message);
        throw e;
      }

    });
  });
  job.start()
}

async function handleVerifySchedules(job) {
  try {
    const { count, rows: schedules } = await Schedule.findAndCountAll({
      where: {
        status: "PENDENTE",
        sentAt: null,
        sendAt: {
          [Op.gte]: moment().format("YYYY-MM-DD HH:mm:ss"),
          [Op.lte]: moment().add("300", "seconds").format("YYYY-MM-DD HH:mm:ss")
        }
      },
      include: [{ model: Contact, as: "contact" }]
    });
    if (count > 0) {
      schedules.map(async schedule => {
        await schedule.update({
          status: "AGENDADA"
        });
        sendScheduledMessages.add(
          "SendMessage",
          { schedule },
          { delay: 40000 }
        );
        logger.info(`[🧵] Mensaje programado para: ${schedule.contact.name}`);
      });
    }
  } catch (e: any) {
    Sentry.captureException(e);
    logger.error("Enviar Mensaje Programado -> Verificar: error", e.message);
    throw e;
  }
}

async function handleSendScheduledMessage(job) {
  const {
    data: { schedule }
  } = job;
  let scheduleRecord: Schedule | null = null;

  try {
    scheduleRecord = await Schedule.findByPk(schedule.id);
  } catch (e) {
    Sentry.captureException(e);
    logger.info(`Error al intentar consultar programación: ${schedule.id}`);
  }

  try {
    const whatsapp = await GetDefaultWhatsApp(schedule.companyId);

    let filePath = null;
    if (schedule.mediaPath) {
      filePath = path.resolve("public", schedule.mediaPath);
    }

    const sentMessage = await SendMessage(whatsapp, {
      number: schedule.contact.number,
      body: formatBody(schedule.body, schedule.contact),
      mediaPath: filePath
    });

    // Guardar el mensaje en el historial del chat
    if (sentMessage) {
      const contact = await Contact.findByPk(schedule.contactId);
      if (contact) {
        const ticket = await FindOrCreateTicketService(
          contact,
          whatsapp.id!,
          0,
          schedule.companyId
        );

        const messageData = {
          id: sentMessage.key.id,
          ticketId: ticket.id,
          contactId: undefined, // fromMe = true
          body: formatBody(schedule.body, schedule.contact),
          fromMe: true,
          mediaType: schedule.mediaPath ? "document" : "conversation",
          read: true,
          quotedMsgId: null,
          ack: 1,
          remoteJid: sentMessage.key.remoteJid,
          participant: sentMessage.key.participant,
          dataJson: JSON.stringify(sentMessage)
        };

        await CreateMessageService({ messageData, companyId: schedule.companyId });
        await ticket.update({ lastMessage: formatBody(schedule.body, schedule.contact) });
      }
    }

    await scheduleRecord?.update({
      sentAt: moment().format("YYYY-MM-DD HH:mm"),
      status: "ENVIADA"
    });

    logger.info(`[🧵] Mensaje programado enviado a: ${schedule.contact.name}`);
    sendScheduledMessages.clean(15000, "completed");
  } catch (e: any) {
    Sentry.captureException(e);
    await scheduleRecord?.update({
      status: "ERRO"
    });
    logger.error("Enviar Mensaje Programado -> Enviar Mensaje: error", e.message);
    throw e;
  }
}

async function handleVerifyCampaigns(job) {
  /**
   * @todo
   * Implementar filtro de campanhas
   */

  logger.info("[INIT] - Verificando campañas...");

  // Debug: Mostrar hora actual y rango de búsqueda
  const now = moment();
  const oneHourLater = moment().add(1, 'hour');
  logger.info(`[TIME] - Hora actual: ${now.format('YYYY-MM-DD HH:mm:ss')}`);
  logger.info(`[TIME] - Buscando campañas entre: ${now.format('YYYY-MM-DD HH:mm:ss')} y ${oneHourLater.format('YYYY-MM-DD HH:mm:ss')}`);

  // Debug: Primero verificar todas las campañas sin filtro de tiempo
  const allCampaigns: { id: number; scheduledAt: string; name?: string; status: string }[] =
    await sequelize.query(
      `select id, name, "scheduledAt", status from "Campaigns" c order by "scheduledAt" desc limit 10`,
      { type: QueryTypes.SELECT }
    );

  logger.info(`[DATA] - Total de campañas en BD (últimas 10): ${allCampaigns.length}`);
  allCampaigns.forEach(c => {
    logger.info(`[INFO] - Campaña: "${c.name || 'Sin nombre'}" (ID: ${c.id}) - Status: ${c.status} - Programada: ${c.scheduledAt}`);
  });

  const campaigns: { id: number; scheduledAt: string; name?: string }[] =
    await sequelize.query(
      `select id, name, "scheduledAt" from "Campaigns" c
    where "scheduledAt" between now() - '5 minutes'::interval and now() + '1 hour'::interval and status = 'PROGRAMADA'`,
      { type: QueryTypes.SELECT }
    );

  logger.info(`[SEARCH] - Campañas encontradas con filtros: ${campaigns.length}`);

  if (campaigns.length > 0) {
    logger.info(`[FOUND] - Campañas encontradas: ${campaigns.length}`);
    // Logger para mostrar nombres de campañas activas
    const campaignNames = campaigns.map(c => `"${c.name || 'Sin nombre'}" (ID: ${c.id})`).join(', ');
    logger.info(`[LIST] - Campañas activas para envío: ${campaignNames}`);
  } else {
    logger.info(`[WARN] - No se encontraron campañas programadas para la próxima hora`);
  }

  for (let campaign of campaigns) {
    try {
      const now = moment();
      const scheduledAt = moment(campaign.scheduledAt);
      const delay = scheduledAt.diff(now, "milliseconds");
      logger.info(
        `[📌] - Campaña enviada a la cola de procesamiento: Campaña=${campaign.id}, Delay Inicial=${delay}ms`
      );
      campaignQueue.add(
        "ProcessCampaign",
        {
          id: campaign.id,
          delay
        },
        {
          removeOnComplete: true
        }
      );
    } catch (err: any) {
      Sentry.captureException(err);
      logger.error(`[❌] - Error procesando campaña ${campaign.id}:`, err.message);
    }
  }

  logger.info("[END] - Finalizando verificación de campañas programadas...");
}

async function getCampaign(id) {
  return await Campaign.findByPk(id, {
    include: [
      {
        model: ContactList,
        as: "contactList",
        attributes: ["id", "name"],
        include: [
          {
            model: ContactListItem,
            as: "contacts",
            attributes: ["id", "name", "number", "email", "isWhatsappValid"],
            where: { isWhatsappValid: true }
          }
        ]
      },
      {
        model: Whatsapp,
        as: "whatsapp",
        attributes: ["id", "name"]
      },
      {
        model: CampaignShipping,
        as: "shipping",
        include: [{ model: ContactListItem, as: "contact" }]
      }
    ]
  });
}

async function getContact(id) {
  return await ContactListItem.findByPk(id, {
    attributes: ["id", "name", "number", "email"]
  });
}

async function getSettings(campaign) {
  const settings = await CampaignSetting.findAll({
    where: { companyId: campaign.companyId },
    attributes: ["key", "value"]
  });

  let messageInterval: number = 20;
  let longerIntervalAfter: number = 20;
  let greaterInterval: number = 60;
  let variables: any[] = [];

  settings.forEach(setting => {
    if (setting.key === "messageInterval") {
      messageInterval = JSON.parse(setting.value);
    }
    if (setting.key === "longerIntervalAfter") {
      longerIntervalAfter = JSON.parse(setting.value);
    }
    if (setting.key === "greaterInterval") {
      greaterInterval = JSON.parse(setting.value);
    }
    if (setting.key === "variables") {
      variables = JSON.parse(setting.value);
    }
  });

  return {
    messageInterval,
    longerIntervalAfter,
    greaterInterval,
    variables
  };
}

export function parseToMilliseconds(seconds) {
  return seconds * 1000;
}

async function sleep(seconds) {
  logger.info(
    `Pausa de ${seconds} segundos iniciada: ${moment().format("HH:mm:ss")}`
  );
  return new Promise(resolve => {
    setTimeout(() => {
      logger.info(
        `Pausa de ${seconds} segundos finalizada: ${moment().format(
          "HH:mm:ss"
        )}`
      );
      resolve(true);
    }, parseToMilliseconds(seconds));
  });
}

function getCampaignValidMessages(campaign) {
  const messages = [];

  if (!isEmpty(campaign.message1) && !isNil(campaign.message1)) {
    messages.push(campaign.message1);
  }

  if (!isEmpty(campaign.message2) && !isNil(campaign.message2)) {
    messages.push(campaign.message2);
  }

  if (!isEmpty(campaign.message3) && !isNil(campaign.message3)) {
    messages.push(campaign.message3);
  }

  if (!isEmpty(campaign.message4) && !isNil(campaign.message4)) {
    messages.push(campaign.message4);
  }

  if (!isEmpty(campaign.message5) && !isNil(campaign.message5)) {
    messages.push(campaign.message5);
  }

  return messages;
}

function getProcessedMessage(msg: string, variables: any[], contact: any) {
  let finalMessage = msg;

  if (finalMessage.includes("{nome}")) {
    finalMessage = finalMessage.replace(/{nome}/g, contact.name);
  }

  if (finalMessage.includes("{email}")) {
    finalMessage = finalMessage.replace(/{email}/g, contact.email);
  }

  if (finalMessage.includes("{numero}")) {
    finalMessage = finalMessage.replace(/{numero}/g, contact.number);
  }

  variables.forEach(variable => {
    if (finalMessage.includes(`{${variable.key}}`)) {
      const regex = new RegExp(`{${variable.key}}`, "g");
      finalMessage = finalMessage.replace(regex, variable.value);
    }
  });

  return finalMessage;
}

export function randomValue(min, max) {
  return Math.floor(Math.random() * max) + min;
}

async function verifyAndFinalizeCampaign(campaign) {

  logger.info("[🚨] - Verificando si el envío de campañas finalizó");
  const { contacts } = campaign.contactList;

  const count1 = contacts.length;
  const count2 = await CampaignShipping.count({
    where: {
      campaignId: campaign.id,
      deliveredAt: {
        [Op.not]: null
      }
    }
  });

  if (count1 === count2) {
    await campaign.update({ status: "FINALIZADA", completedAt: moment() });
    logger.info(`[✅] - Campaña "${campaign.name || campaign.id}" finalizada completamente`);
  }

  const io = getIO();
  io.to(`company-${campaign.companyId}-mainchannel`).emit(`company-${campaign.companyId}-campaign`, {
    action: "update",
    record: campaign
  });

  logger.info("[🚨] - Fin de la verificación de finalización de campañas");
}

function calculateDelay(index, baseDelay, longerIntervalAfter, greaterInterval, messageInterval) {
  const diffSeconds = differenceInSeconds(baseDelay, new Date());
  if (index > longerIntervalAfter) {
    return diffSeconds * 1000 + greaterInterval
  } else {
    return diffSeconds * 1000 + messageInterval
  }
}

async function handleProcessCampaign(job) {
  logger.info("[🏁] - Inició el procesamiento de la campaña ID: " + job.data.id);
  try {
    const { id }: ProcessCampaignData = job.data;
    const campaign = await getCampaign(id);
    const settings = await getSettings(campaign);
    if (campaign) {

      logger.info(`[🚩] - Localizando y configurando la campaña: "${campaign.name || campaign.id}"`);

      const { contacts } = campaign.contactList;
      if (isArray(contacts)) {

        logger.info("[📌] - Cantidad de contactos a enviar: " + contacts.length);

        const contactData = contacts.map(contact => ({
          contactId: contact.id,
          campaignId: campaign.id,
          variables: settings.variables,
        }));

        // const baseDelay = job.data.delay || 0;
        const longerIntervalAfter = parseToMilliseconds(settings.longerIntervalAfter);
        const greaterInterval = parseToMilliseconds(settings.greaterInterval);
        const messageInterval = settings.messageInterval;

        let baseDelay = campaign.scheduledAt;

        const queuePromises = [];
        for (let i = 0; i < contactData.length; i++) {

          baseDelay = addSeconds(baseDelay, i > longerIntervalAfter ? greaterInterval : messageInterval);

          const { contactId, campaignId, variables } = contactData[i];
          const delay = calculateDelay(i, baseDelay, longerIntervalAfter, greaterInterval, messageInterval);
          const queuePromise = campaignQueue.add(
            "PrepareContact",
            { contactId, campaignId, variables, delay },
            { removeOnComplete: true }
          );
          queuePromises.push(queuePromise);
          logger.info("[🚀] - Cliente ID: " + contactData[i].contactId + " de la campaña ID: " + contactData[i].campaignId + " con delay: " + delay + "ms");
        }
        await Promise.all(queuePromises);
        await campaign.update({ status: "EM_ANDAMENTO" });
      }
    }
  } catch (err: any) {
    Sentry.captureException(err);
  }
}

async function handlePrepareContact(job) {

  logger.info("Preparando contactos");
  try {
    const { contactId, campaignId, delay, variables }: PrepareContactData =
      job.data;
    const campaign = await getCampaign(campaignId);
    const contact = await getContact(contactId);

    const campaignShipping: any = {};
    campaignShipping.number = contact.number;
    campaignShipping.contactId = contactId;
    campaignShipping.campaignId = campaignId;

    logger.info("[🏁] - Iniciando preparación del contacto | contactoId: " + contactId + " CampañaID: " + campaignId);

    const messages = getCampaignValidMessages(campaign);
    if (messages.length) {
      const radomIndex = randomValue(0, messages.length);
      const message = getProcessedMessage(
        messages[radomIndex],
        variables,
        contact
      );
      campaignShipping.message = `\u200c ${message}`;
    }

    const [record, created] = await CampaignShipping.findOrCreate({
      where: {
        campaignId: campaignShipping.campaignId,
        contactId: campaignShipping.contactId
      },
      defaults: campaignShipping
    });

    logger.info("[🚩] - Registro de envío de campaña para contacto creado | contactoId: " + contactId + " CampañaID: " + campaignId);

    if (
      !created &&
      record.deliveredAt === null
    ) {
      record.set(campaignShipping);
      await record.save();
    }

    if (
      record.deliveredAt === null
    ) {
      const nextJob = await campaignQueue.add(
        "DispatchCampaign",
        {
          campaignId: campaign.id,
          campaignShippingId: record.id,
          contactListItemId: contactId
        },
        {
          delay
        }
      );

      await record.update({ jobId: nextJob.id });
    }

    await verifyAndFinalizeCampaign(campaign);
    logger.info("[🏁] - Finalizada la preparación del contacto | contactoId: " + contactId + " CampañaID: " + campaignId);
  } catch (err: any) {
    Sentry.captureException(err);
    logger.error(`campaignQueue -> PrepareContact -> error: ${err.message}`);
  }
}

async function handleDispatchCampaign(job) {
  try {
    const { data } = job;
    const { campaignShippingId, campaignId }: DispatchCampaignData = data;
    const campaign = await getCampaign(campaignId);
    const wbot = await GetWhatsappWbot(campaign.whatsapp);

    logger.info("[🏁] - Disparando campaña | CampaignShippingId: " + campaignShippingId + " CampañaID: " + campaignId);

    if (!wbot) {
      logger.error(`campaignQueue -> DispatchCampaign -> error: wbot not found`);
      return;
    }

    if (!campaign.whatsapp) {
      logger.error(`campaignQueue -> DispatchCampaign -> error: whatsapp not found`);
      return;
    }

    if (!wbot?.user?.id) {
      logger.error(`campaignQueue -> DispatchCampaign -> error: wbot user not found`);
      return;
    }

    logger.info("[🚩] - Disparando campaña | CampaignShippingId: " + campaignShippingId + " CampañaID: " + campaignId);

    const campaignShipping = await CampaignShipping.findByPk(
      campaignShippingId,
      {
        include: [{ model: ContactListItem, as: "contact" }]
      }
    );

    const chatId = `${campaignShipping.number}@s.whatsapp.net`;

    let body = campaignShipping.message;

    // 🏷️ SEGURO: Buscar ticket y etiqueta respetando empresa
    if (campaign.tagId) {
      try {
        // 1. ✅ Buscar el ticket existente por número de contacto (RESPETA empresa)
        const ticket = await Ticket.findOne({
          where: {
            companyId: campaign.companyId  // ← SOLO tickets de esta empresa
          },
          include: [{ 
            model: Contact, 
            as: "contact",
            where: { number: campaignShipping.number }
          }]
        });

        if (ticket) {
          // 2. ✅ Verificar que la etiqueta pertenezca a la misma empresa
          const tag = await Tag.findOne({
            where: {
              id: campaign.tagId,
              companyId: campaign.companyId  // ← SOLO etiquetas de esta empresa
            }
          });

          if (tag) {
            // 3. ✅ Verificar si ya existe la relación para evitar duplicados
            const existingTag = await TicketTag.findOne({
              where: {
                ticketId: ticket.id,
                tagId: campaign.tagId
              }
            });

            if (!existingTag) {
              // 4. ✅ Crear la relación (ya verificamos que ambos son de la misma empresa)
              await TicketTag.create({
                ticketId: ticket.id,
                tagId: campaign.tagId
              });

              logger.info(`[🏷️] Etiqueta "${tag.name}" (ID: ${tag.id}) añadida al ticket ${ticket.id} (Campaña: ${campaign.name}) - Empresa: ${campaign.companyId}`);
            } else {
              logger.info(`[🏷️] Etiqueta "${tag.name}" ya existía en el ticket ${ticket.id} (Campaña: ${campaign.name}) - Empresa: ${campaign.companyId}`);
            }
          } else {
            logger.warn(`[⚠️] Etiqueta ${campaign.tagId} no encontrada o no pertenece a la empresa ${campaign.companyId} (Campaña: ${campaign.name})`);
          }
        } else {
          logger.warn(`[⚠️] No se encontró ticket para el número ${campaignShipping.number} en la empresa ${campaign.companyId} (Campaña: ${campaign.name})`);
        }
      } catch (error) {
        logger.error(`[❌] Error al añadir etiqueta al ticket:`, error);
        // Continuar con el envío aunque falle la asignación de etiqueta
      }
    }

    if (!isNil(campaign.fileListId)) {

      logger.info("[🚩] - Recuperando la lista de archivos | CampaignShippingId: " + campaignShippingId + " CampañaID: " + campaignId);

      try {
        const publicFolder = path.resolve(__dirname, "..", "public");
        const files = await ShowFileService(campaign.fileListId, campaign.companyId)
        const folder = path.resolve(publicFolder, "fileList", String(files.id))
        for (const [index, file] of files.options.entries()) {
          const options = await getMessageOptions(file.path, path.resolve(folder, file.path), file.name);
          await wbot.sendMessage(chatId, { ...options });

          logger.info("[🚩] - Archivo enviado: " + file.name + " | CampaignShippingId: " + campaignShippingId + " CampañaID: " + campaignId);
        };
      } catch (error) {
        logger.info(error);
      }
    }

    if (campaign.mediaPath) {

      logger.info("[🚩] - Preparando media de la campaña: " + campaign.mediaPath + " | CampaignShippingId: " + campaignShippingId + " CampañaID: " + campaignId);

      const publicFolder = path.resolve(__dirname, "..", "public");
      const filePath = path.join(publicFolder, campaign.mediaPath);

      const options = await getMessageOptions(campaign.mediaName, filePath, body);
      if (Object.keys(options).length) {
        await wbot.sendMessage(chatId, { ...options });
      }
    }
    else {

      logger.info("[🚩] - Enviando mensaje de texto de la campaña | CampaignShippingId: " + campaignShippingId + " CampañaID: " + campaignId);

      await wbot.sendMessage(chatId, {
        text: body
      });
    }

    logger.info("[🚩] - Actualizando campaña como enviada... | CampaignShippingId: " + campaignShippingId + " CampañaID: " + campaignId);

    await campaignShipping.update({ deliveredAt: moment() });

    await verifyAndFinalizeCampaign(campaign);

    const io = getIO();
    io.to(`company-${campaign.companyId}-mainchannel`).emit(`company-${campaign.companyId}-campaign`, {
      action: "update",
      record: campaign
    });

    logger.info(
      `[🏁] - Campaña enviada a: Campaña=${campaignId};Contacto=${campaignShipping.contact.name}`
    );

  } catch (err: any) {
    Sentry.captureException(err);
    logger.error(err.message);
    console.log(err.stack);
  }
}

async function handleLoginStatus(job) {
  // 🎯 SISTEMA UNIFICADO: Maneja tanto estado online/offline como logout por inactividad
  // 🚨 SISTEMA DE DOBLE TIMEOUT: Advertencia a los 5 min, logout a los 10 min

  // 1. Usuarios que necesitan advertencia (5 minutos)
  const usersNeedingWarning: { id: number }[] = await sequelize.query(
    `select id from "Users" where "updatedAt" < now() - '${inactivityConfig.warningTimeoutMinutes} minutes'::interval and "updatedAt" >= now() - '${inactivityConfig.offlineTimeoutMinutes} minutes'::interval and online = true`,
    { type: QueryTypes.SELECT }
  );

  // 2. Usuarios que necesitan logout (10 minutos)
  const usersNeedingLogout: { id: number }[] = await sequelize.query(
    `select id from "Users" where "updatedAt" < now() - '${inactivityConfig.offlineTimeoutMinutes} minutes'::interval and online = true`,
    { type: QueryTypes.SELECT }
  );

  // Procesar advertencias
  for (let item of usersNeedingWarning) {
    try {
      const user = await User.findByPk(item.id);
      
              // Solo emitir advertencia, no cambiar estado aún
        if (global.io) {
          global.io.to(`user-${user.id}`).emit('inactivityWarning', {
            message: `Advertencia: Tu sesión se cerrará en ${inactivityConfig.offlineTimeoutMinutes - inactivityConfig.warningTimeoutMinutes} minutos por inactividad`,
            remainingMinutes: inactivityConfig.offlineTimeoutMinutes - inactivityConfig.warningTimeoutMinutes
          });
        }

      logger.info(`Usuario ${item.id} recibió advertencia de inactividad`);
    } catch (e: any) {
      Sentry.captureException(e);
    }
  }

  // Procesar logouts
  for (let item of usersNeedingLogout) {
    try {
      const user = await User.findByPk(item.id);

      // 1. Marca como offline (para el dashboard)
      await user.update({ online: false });

      // 2. Emite evento para cerrar sesión en el frontend
      if (global.io) {
        global.io.to(`user-${user.id}`).emit('forceLogout', {
          reason: 'inactivity',
          message: `Sesión cerrada por inactividad (${inactivityConfig.offlineTimeoutMinutes} minutos)`
        });
      }

      logger.info(`Usuario ${item.id} marcado como offline y sesión cerrada por inactividad`);
    } catch (e: any) {
      Sentry.captureException(e);
    }
  }
}


async function handleInvoiceCreate() {
  logger.info("Iniciando generación de facturas");
  const job = new CronJob('*/5 * * * * *', async () => {


    const companies = await Company.findAll();
    companies.map(async c => {
      var dueDate = c.dueDate;
      const date = moment(dueDate).format();
      const timestamp = moment().format();
      const hoje = moment(moment()).format("DD/MM/yyyy");
      var vencimento = moment(dueDate).format("DD/MM/yyyy");

      var diff = moment(vencimento, "DD/MM/yyyy").diff(moment(hoje, "DD/MM/yyyy"));
      var dias = moment.duration(diff).asDays();

      if (dias < 20) {
        const plan = await Plan.findByPk(c.planId);

        const sql = `SELECT COUNT(*) mycount FROM "Invoices" WHERE "companyId" = ${c.id} AND "dueDate"::text LIKE '${moment(dueDate).format("yyyy-MM-DD")}%';`
        const invoice = await sequelize.query(sql,
          { type: QueryTypes.SELECT }
        );
        if (invoice[0]['mycount'] > 0) {

        } else {
          const sql = `INSERT INTO "Invoices" (detail, status, value, "updatedAt", "createdAt", "dueDate", "companyId")
          VALUES ('${plan.name}', 'open', '${plan.value}', '${timestamp}', '${timestamp}', '${date}', ${c.id});`

          const invoiceInsert = await sequelize.query(sql,
            { type: QueryTypes.INSERT }
          );

          /*           let transporter = nodemailer.createTransport({
                      service: 'gmail',
                      auth: {
                        user: 'email@gmail.com',
                        pass: 'senha'
                      }
                    });

                    const mailOptions = {
                      from: 'heenriquega@gmail.com', // sender address
                      to: `${c.email}`, // receiver (use array of string for a list)
                      subject: 'Fatura gerada - Sistema', // Subject line
                      html: `Olá ${c.name} esté é um email sobre sua fatura!<br>
          <br>
          Vencimento: ${vencimento}<br>
          Valor: ${plan.value}<br>
          Link: ${process.env.FRONTEND_URL}/financeiro<br>
          <br>
          Qualquer duvida estamos a disposição!
                      `// plain text body
                    };

                    transporter.sendMail(mailOptions, (err, info) => {
                      if (err)
                        console.log(err)
                      else
                        console.log(info);
                    }); */

        }





      }

    });
  });
  job.start()
}

handleCloseTicketsAutomatic()

handleInvoiceCreate()

export async function startQueueProcess() {

  logger.info("[INIT] - Iniciando procesamiento de colas");

  messageQueue.process("SendMessage", handleSendMessage);

  scheduleMonitor.process("Verify", handleVerifySchedules);

  sendScheduledMessages.process("SendMessage", handleSendScheduledMessage);

  userMonitor.process("VerifyLoginStatus", handleLoginStatus);


  // 🚀 WORKERS OPTIMIZADOS - RESPETANDO DELAYS ANTI-SPAM
  campaignQueue.process("VerifyCampaigns", 3, handleVerifyCampaigns);      // ← 3 workers para verificación

  campaignQueue.process("ProcessCampaign", 3, handleProcessCampaign);      // ← 3 workers para procesamiento

  campaignQueue.process("PrepareContact", 5, handlePrepareContact);        // ← 5 workers para preparación

  campaignQueue.process("DispatchCampaign", 2, handleDispatchCampaign);    // ← 2 workers para envío (RESPETA DELAYS)


  //queueMonitor.process("VerifyQueueStatus", handleVerifyQueue);

  async function cleanupCampaignQueue() {
    try {
      await campaignQueue.clean(12 * 3600 * 1000, 'completed');
      await campaignQueue.clean(24 * 3600 * 1000, 'failed');

      const jobs = await campaignQueue.getJobs(['waiting', 'active']);
      for (const job of jobs) {
        if (Date.now() - job.timestamp > 24 * 3600 * 1000) {
          await job.remove();
        }
      }
    } catch (error) {
      logger.error('[🚨] - Error en la limpieza de la cola de campañas:', error);
    }
  }
  setInterval(cleanupCampaignQueue, 6 * 3600 * 1000);

  setInterval(async () => {
    const jobCounts = await campaignQueue.getJobCounts();
    const memoryUsage = process.memoryUsage();

    logger.info('[📌] - Estado de la cola de campañas:', {
      jobs: jobCounts,
      workers: {
        verifyCampaigns: 3,
        processCampaign: 3,
        prepareContact: 5,
        dispatchCampaign: 2
      },
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB'
      },
      performance: {
        jobsPerMinute: jobCounts.completed || 0
      }
    });
  }, 5 * 60 * 1000);

  campaignQueue.on('completed', (job) => {
    logger.info(`[DONE] - Campaña ${job.id} completada en ${Date.now() - job.timestamp}ms`);
  });

  scheduleMonitor.add(
    "Verify",
    {},
    {
      repeat: { cron: "*/30 * * * * *", key: "verify" },  // ← De 5s a 30s
      removeOnComplete: true
    }
  );

  campaignQueue.add(
    "VerifyCampaigns",
    {},
    {
      repeat: { cron: "*/2 * * * *", key: "verify-campaing" },  // ← De 20s a 2min
      removeOnComplete: true
    }
  );

  userMonitor.add(
    "VerifyLoginStatus",
    {},
    {
      repeat: { cron: "*/30 * * * * *", key: "verify-login" },  // ← De 5min a 30seg para inactividad
      removeOnComplete: true
    }
  );

  queueMonitor.add(
    "VerifyQueueStatus",
    {},
    {
      repeat: { cron: "*/2 * * * *" },  // ← De 20s a 2min
      removeOnComplete: true
    }
  );
}
