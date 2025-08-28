import { Request, Response } from "express";
import AppError from "../errors/AppError";

import SetTicketMessagesAsRead from "../helpers/SetTicketMessagesAsRead";
import { getIO } from "../libs/socket";
import Message from "../models/Message";
import Queue from "../models/Queue";
import User from "../models/User";
import Whatsapp from "../models/Whatsapp";
import Ticket from "../models/Ticket";
import Setting from "../models/Setting";
import formatBody from "../helpers/Mustache";

import ListMessagesService from "../services/MessageServices/ListMessagesService";
import ShowTicketService from "../services/TicketServices/ShowTicketService";
import FindOrCreateTicketService from "../services/TicketServices/FindOrCreateTicketService";
import UpdateTicketService from "../services/TicketServices/UpdateTicketService";
import DeleteWhatsAppMessage from "../services/WbotServices/DeleteWhatsAppMessage";
import SendWhatsAppMedia from "../services/WbotServices/SendWhatsAppMedia";
import SendWhatsAppMessage from "../services/WbotServices/SendWhatsAppMessage";
import CheckContactNumber from "../services/WbotServices/CheckNumber";
import CheckIsValidContact from "../services/WbotServices/CheckIsValidContact";
import GetProfilePicUrl from "../services/WbotServices/GetProfilePicUrl";
import CreateOrUpdateContactService from "../services/ContactServices/CreateOrUpdateContactService";
type IndexQuery = {
  pageNumber: string;
};

type MessageData = {
  body: string;
  fromMe: boolean;
  read: boolean;
  quotedMsg?: Message;
  number?: string;
  closeTicket?: true;
};

export const index = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { pageNumber } = req.query as IndexQuery;
  const { companyId, profile } = req.user;
  const queues: number[] = [];

  if (profile !== "admin") {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: Queue, as: "queues" }]
    });
    user.queues.forEach(queue => {
      queues.push(queue.id);
    });
  }

  const { count, messages, ticket, hasMore } = await ListMessagesService({
    pageNumber,
    ticketId,
    companyId,
    queues
  });

  SetTicketMessagesAsRead(ticket);

  return res.json({ count, messages, ticket, hasMore });
};

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { ticketId } = req.params;
  const { body, quotedMsg }: MessageData = req.body;
  const medias = req.files as Express.Multer.File[];
  const { companyId, profile } = req.user;

  const ticket = await ShowTicketService(ticketId, companyId);

  SetTicketMessagesAsRead(ticket);

  if (medias) {
    // 🔥 NUEVA VALIDACIÓN: Verificar restricción de audio (global + conexión)
    await validateAudioRestriction(medias, profile, companyId, ticket.whatsappId);

    await Promise.all(
      medias.map(async (media: Express.Multer.File, index) => {
        await SendWhatsAppMedia({ media, ticket, body: Array.isArray(body) ? body[index] : body });
      })
    );
  } else {
    const send = await SendWhatsAppMessage({ body, ticket, quotedMsg });
  }

  return res.send();
};

export const remove = async (
  req: Request,
  res: Response
): Promise<Response> => {
  if (req.user.profile !== "admin") {
    throw new AppError("ERR_NO_PERMISSION", 403);
  }

  const { messageId } = req.params;
  const { companyId } = req.user;

  const message = await DeleteWhatsAppMessage(messageId);

  const io = getIO();
  io.to(message.ticketId.toString()).emit(`company-${companyId}-appMessage`, {
    action: "update",
    message
  });

  return res.send();
};

// 🔥 NUEVO ENDPOINT: Marcar chat como abierto y actualizar mensajes
export const markAsOpened = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;
  const { companyId } = req.user;

  try {
    const ticket = await ShowTicketService(ticketId, companyId);
    
    if (!ticket) {
      throw new AppError("ERR_NO_TICKET_FOUND", 404);
    }

    // Llamar a SetTicketMessagesAsRead que ahora incluye la actualización de mensajes enviados
    SetTicketMessagesAsRead(ticket);

    // También actualizar directamente los mensajes enviados como leídos
    await updateSentMessagesAsOpened(ticket);

    return res.json({ success: true });
  } catch (err) {
    throw new AppError("ERR_UPDATING_MESSAGES", 500);
  }
};

// 🔥 NUEVO ENDPOINT: Heartbeat para indicar que el usuario está viendo el chat activamente
export const heartbeat = async (
  req: Request,
  res: Response
): Promise<Response> => {
  const { ticketId } = req.params;
  const { companyId } = req.user;

  try {
    const ticket = await ShowTicketService(ticketId, companyId);
    
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Actualizar mensajes enviados como leídos si el usuario está viendo activamente
    await updateSentMessagesAsOpened(ticket);

    return res.json({ success: true });
  } catch (err) {
    // Error silencioso para heartbeat
    return res.status(200).json({ success: false });
  }
};

// 🔥 FUNCIÓN AUXILIAR: Actualizar mensajes enviados cuando se abre el chat
const updateSentMessagesAsOpened = async (ticket: Ticket): Promise<void> => {
  try {
    const io = getIO();

    // Buscar mensajes enviados que no están marcados como leídos
    const sentMessages = await Message.findAll({
      where: {
        ticketId: ticket.id,
        fromMe: true,
        ack: [1, 2] // Enviados o entregados, pero no leídos
      }
    });

    if (sentMessages.length > 0) {
      // Actualizar como leídos (ack = 3)
      await Message.update(
        { ack: 3 },
        {
          where: {
            ticketId: ticket.id,
            fromMe: true,
            ack: [1, 2]
          }
        }
      );

      // Emitir eventos para cada mensaje actualizado
      for (const message of sentMessages) {
        const updatedMessage = await Message.findByPk(message.id, {
          include: [
            "contact",
            {
              model: Message,
              as: "quotedMsg",
              include: ["contact"]
            }
          ]
        });

        if (updatedMessage) {
          io.to(ticket.id.toString()).emit(
            `company-${ticket.companyId}-appMessage`,
            {
              action: "update",
              message: updatedMessage
            }
          );
        }
      }
    }
  } catch (err) {
    console.error("Error actualizando mensajes como abiertos:", err);
  }
};

// 🔥 NUEVA FUNCIÓN: Validar restricción de audio para usuarios
const validateAudioRestriction = async (
  medias: Express.Multer.File[],
  userProfile: string,
  companyId: number,
  whatsappId?: number
): Promise<void> => {
  // Los admins siempre pueden enviar audio
  if (userProfile === "admin") {
    return;
  }

  // Verificar si hay archivos de audio
  const hasAudio = medias.some(media => 
    media.mimetype.startsWith("audio/") || 
    media.originalname.toLowerCase().includes(".mp3") ||
    media.originalname.toLowerCase().includes(".ogg") ||
    media.originalname.toLowerCase().includes(".wav") ||
    media.originalname.toLowerCase().includes(".m4a")
  );

  if (hasAudio) {
    // 1) Global company setting
    const audioSetting = await Setting.findOne({
      where: { key: "userAudioRestriction", companyId }
    });

    let effectivePermission: "enabled" | "disabled" =
      audioSetting?.value === "disabled" ? "disabled" : "enabled";

    // 2) Connection override if provided
    if (whatsappId) {
      const whatsapp = await Whatsapp.findByPk(whatsappId);
      if (whatsapp) {
        if (whatsapp.audioPermission === "enabled") effectivePermission = "enabled";
        if (whatsapp.audioPermission === "disabled") effectivePermission = "disabled";
      }
    }

    if (effectivePermission === "disabled") {
      throw new AppError("ERR_AUDIO_NOT_ALLOWED", 403);
    }
  }
};

export const send = async (req: Request, res: Response): Promise<Response> => {
  const { whatsappId } = req.params as unknown as { whatsappId: number };
  const messageData: MessageData = req.body;
  const medias = req.files as Express.Multer.File[];

  try {
    const whatsapp = await Whatsapp.findByPk(whatsappId);

    if (!whatsapp) {
      throw new Error("Não foi possível realizar a operação");
    }

    if (messageData.number === undefined) {
      throw new Error("O número é obrigatório");
    }

    const numberToTest = messageData.number;
    const body = messageData.body;

    const companyId = whatsapp.companyId;

    const CheckValidNumber = await CheckContactNumber(numberToTest, companyId);
    const number = CheckValidNumber.jid.replace(/\D/g, "");
    const profilePicUrl = await GetProfilePicUrl(
      number,
      companyId
    );
    const contactData = {
      name: `${number}`,
      number,
      profilePicUrl,
      isGroup: false,
      companyId
    };

    const contact = await CreateOrUpdateContactService(contactData);

    const ticket = await FindOrCreateTicketService(contact, whatsapp.id!, 0, companyId);

    if (medias) {
      await Promise.all(
        medias.map(async (media: Express.Multer.File) => {
          await req.app.get("queues").messageQueue.add(
            "SendMessage",
            {
              whatsappId,
              data: {
                number,
                body: body ? formatBody(body, contact) : media.originalname,
                mediaPath: media.path,
                fileName: media.originalname
              }
            },
            { removeOnComplete: true, attempts: 3 }
          );
        })
      );
    } else {
      await SendWhatsAppMessage({ body: formatBody(body, contact), ticket });

      await ticket.update({
        lastMessage: body,
      });

    }

    if (messageData.closeTicket) {
      setTimeout(async () => {
        await UpdateTicketService({
          ticketId: ticket.id,
          ticketData: { status: "closed" },
          companyId
        });
      }, 1000);
    }

    SetTicketMessagesAsRead(ticket);

    return res.send({ mensagem: "Mensagem enviada" });
  } catch (err: any) {
    if (Object.keys(err).length === 0) {
      throw new AppError(
        "Não foi possível enviar a mensagem, tente novamente em alguns instantes"
      );
    } else {
      throw new AppError(err.message);
    }
  }
};

export const sendMessageFlow = async (
  whatsappId: number,
  body: any,
  req: Request,
  files?: Express.Multer.File[]
): Promise<String> => {
  const messageData = body;
  const medias = files;

  try {
    const whatsapp = await Whatsapp.findByPk(whatsappId);

    if (!whatsapp) {
      throw new Error("Não foi possível realizar a operação");
    }

    if (messageData.number === undefined) {
      throw new Error("O número é obrigatório");
    }

    const numberToTest = messageData.number;
    const body = messageData.body;

    const companyId = messageData.companyId;

    const CheckValidNumber = await CheckContactNumber(numberToTest, companyId);
    const number = numberToTest.replace(/\D/g, "");

    if (medias) {
      await Promise.all(
        medias.map(async (media: Express.Multer.File) => {
          await req.app.get("queues").messageQueue.add(
            "SendMessage",
            {
              whatsappId,
              data: {
                number,
                body: media.originalname,
                mediaPath: media.path
              }
            },
            { removeOnComplete: true, attempts: 3 }
          );
        })
      );
    } else {
      req.app.get("queues").messageQueue.add(
        "SendMessage",
        {
          whatsappId,
          data: {
            number,
            body
          }
        },

        { removeOnComplete: false, attempts: 3 }
      );
    }

    return "Mensagem enviada";
  } catch (err: any) {
    if (Object.keys(err).length === 0) {
      throw new AppError(
        "Não foi possível enviar a mensagem, tente novamente em alguns instantes"
      );
    } else {
      throw new AppError(err.message);
    }
  }
};
