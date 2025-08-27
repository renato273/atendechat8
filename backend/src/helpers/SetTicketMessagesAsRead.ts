import { proto, WASocket } from "@whiskeysockets/baileys";
// import cacheLayer from "../libs/cache";
import { getIO } from "../libs/socket";
import Message from "../models/Message";
import Ticket from "../models/Ticket";
import { logger } from "../utils/logger";
import GetTicketWbot from "./GetTicketWbot";

const SetTicketMessagesAsRead = async (ticket: Ticket): Promise<void> => {
  await ticket.update({ unreadMessages: 0 });
  // await cacheLayer.set(`contacts:${ticket.contactId}:unreads`, "0");

  try {
    const wbot = await GetTicketWbot(ticket);

    const getJsonMessage = await Message.findAll({
      where: {
        ticketId: ticket.id,
        fromMe: false,
        read: false
      },
      order: [["createdAt", "DESC"]]
    });

    if (getJsonMessage.length > 0) {
      const lastMessages: proto.IWebMessageInfo = JSON.parse(
        JSON.stringify(getJsonMessage[0].dataJson)
      );

      if (lastMessages.key && lastMessages.key.fromMe === false) {
        await (wbot as WASocket).chatModify(
          { markRead: true, lastMessages: [lastMessages] },
          `${ticket.contact.number}@${
            ticket.isGroup ? "g.us" : "s.whatsapp.net"
          }`
        );
      }
    }

    await Message.update(
      { read: true },
      {
        where: {
          ticketId: ticket.id,
          read: false
        }
      }
    );

    // 🔥 NUEVA FUNCIONALIDAD: Actualizar mensajes enviados como leídos
    await updateSentMessagesAsRead(ticket);
  } catch (err) {
    logger.warn(
      `Could not mark messages as read. Maybe whatsapp session disconnected? Err: ${err}`
    );
  }

  const io = getIO();
  io.to(`company-${ticket.companyId}-mainchannel`).emit(`company-${ticket.companyId}-ticket`, {
    action: "updateUnread",
    ticketId: ticket.id
  });
};

// 🔥 NUEVA FUNCIÓN: Actualizar mensajes enviados como leídos cuando el receptor abre el chat
const updateSentMessagesAsRead = async (ticket: Ticket): Promise<void> => {
  try {
    const io = getIO();

    // Buscar mensajes enviados por nosotros que aún no están marcados como leídos (ack < 3)
    const sentMessages = await Message.findAll({
      where: {
        ticketId: ticket.id,
        fromMe: true,
        ack: [1, 2] // Solo mensajes enviados (1) o entregados (2), no leídos (3+)
      },
      order: [["createdAt", "ASC"]]
    });

    if (sentMessages.length > 0) {
      logger.info(`Actualizando ${sentMessages.length} mensajes enviados como leídos para ticket ${ticket.id}`);

      // Actualizar todos los mensajes enviados como leídos (ack = 3)
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

      // Emitir eventos en tiempo real para cada mensaje actualizado
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

      logger.info(`✅ Mensajes enviados actualizados como leídos para ticket ${ticket.id}`);
    }
  } catch (err) {
    logger.error(`Error actualizando mensajes enviados como leídos: ${err}`);
  }
};

export default SetTicketMessagesAsRead;
