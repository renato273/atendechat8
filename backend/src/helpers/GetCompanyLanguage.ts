import Company from "../models/Company";

const GetCompanyLanguage = async (companyId: number): Promise<string> => {
  try {
    const company = await Company.findByPk(companyId, {
      attributes: ['language']
    });
    
    return company?.language || 'es'; // Default a portugués
  } catch (error) {
    console.error('Error getting company language:', error);
    return 'pt'; // Default a portugués en caso de error
  }
};

export default GetCompanyLanguage;
