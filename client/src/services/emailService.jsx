import axiosInstance from "../api/axiosConfig";

const createEmail = async (emailData) => {
  const response = await axiosInstance.post(
    "/emails",
    emailData
  );
  return response.data;
};

const getEmailsByLead = async (leadId) => {
  const response = await axiosInstance.get(
    `/emails/lead/${leadId}`
  );
  return response.data;
};

export default {
  createEmail,
  getEmailsByLead,
};