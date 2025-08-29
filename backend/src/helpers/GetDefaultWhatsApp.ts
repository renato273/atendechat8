import AppError from "../errors/AppError";
import Whatsapp from "../models/Whatsapp";
import GetDefaultWhatsAppByUser from "./GetDefaultWhatsAppByUser";
import { getTranslation } from "../utils/translations";
import GetCompanyLanguage from "./GetCompanyLanguage";

const GetDefaultWhatsApp = async (
  companyId: number,
  userId?: number,
  language?: string
): Promise<Whatsapp> => {
  let connection: Whatsapp;

  const defaultWhatsapp = await Whatsapp.findOne({
    where: { isDefault: true, companyId }
  });

  if (defaultWhatsapp?.status === 'CONNECTED') {
    connection = defaultWhatsapp;
  } else {
    const whatsapp = await Whatsapp.findOne({
      where: { status: "CONNECTED", companyId }
    });
    connection = whatsapp;
  }

  if (userId) {
    const whatsappByUser = await GetDefaultWhatsAppByUser(userId);
    if (whatsappByUser?.status === 'CONNECTED') {
      connection = whatsappByUser;
    } else {
      const whatsapp = await Whatsapp.findOne({
        where: { status: "CONNECTED", companyId }
      });
      connection = whatsapp;
    }
  }

  if (!connection) {
    // Si no se proporciona idioma, obtenerlo de la empresa
    const companyLanguage = language || await GetCompanyLanguage(companyId);
    throw new AppError(getTranslation('ERR_NO_WHATSAPP_CONFIGURED', companyLanguage));
  }

  return connection;
};

export default GetDefaultWhatsApp;