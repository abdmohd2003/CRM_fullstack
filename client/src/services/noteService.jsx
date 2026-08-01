import axiosInstance from "../api/axiosConfig";

const createNote = async (noteData) => {
  const response = await axiosInstance.post("/notes", noteData);
  return response.data;
};

const getNotesByLead = async (leadId) => {
  const response = await axiosInstance.get(`/notes/lead/${leadId}`);
  return response.data;
};

export default {
  createNote,
  getNotesByLead,
};