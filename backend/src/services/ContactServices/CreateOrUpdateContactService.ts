import { getIO } from "../../libs/socket";
import Contact from "../../models/Contact";
import ContactCustomField from "../../models/ContactCustomField";
import { isNil } from "lodash";
interface ExtraInfo extends ContactCustomField {
  name: string;
  value: string;
}

interface Request {
  name: string;
  number: string;
  isGroup: boolean;
  email?: string;
  profilePicUrl?: string;
  companyId: number;
  extraInfo?: ExtraInfo[];
  whatsappId?: number;
}

const CreateOrUpdateContactService = async (requestData: Request): Promise<Contact> => {
  const {
    name,
    number: rawNumber,
    profilePicUrl,
    isGroup,
    email = "",
    companyId,
    extraInfo = [],
    whatsappId
  } = requestData;

  const number = isGroup ? rawNumber : rawNumber.replace(/[^0-9]/g, "");

  const io = getIO();
  let contact: Contact | null;

  // Crear objeto de datos del contacto sin extraInfo para evitar warning de Sequelize
  const contactData = {
    name,
    number,
    profilePicUrl,
    email,
    isGroup,
    companyId,
    whatsappId
  };

  // Usar findOrCreate para evitar race conditions
  const [contactRecord, created] = await Contact.findOrCreate({
    where: {
      number,
      companyId
    },
    defaults: contactData
  });

  contact = contactRecord;

  if (!created) {
    // Si ya existía, actualizar los campos necesarios
    await contact.update({
      profilePicUrl,
      name // Actualizar nombre también por si cambió
    });

    console.log(contact.whatsappId);
    if (isNil(contact.whatsappId)) {
      await contact.update({
        whatsappId
      });
    }

    io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-contact`, {
      action: "update",
      contact
    });
  } else {
    io.to(`company-${companyId}-mainchannel`).emit(`company-${companyId}-contact`, {
      action: "create",
      contact
    });
  }

  // Manejar extraInfo tanto para contactos nuevos como existentes
  if (extraInfo && extraInfo.length > 0) {
    for (const info of extraInfo) {
      await ContactCustomField.findOrCreate({
        where: {
          name: info.name,
          contactId: contact.id
        },
        defaults: {
          name: info.name,
          value: info.value,
          contactId: contact.id
        }
      });
    }
  }

  return contact;
};

export default CreateOrUpdateContactService;
