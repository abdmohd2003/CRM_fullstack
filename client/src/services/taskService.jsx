import axiosInstance from "../api/axiosConfig";

const createTask = async (taskData) => {
  const response = await axiosInstance.post(
    "/tasks",
    taskData
  );

  return response.data;
};

const getTasksByLead = async (leadId) => {
  const response = await axiosInstance.get(
    `/tasks/lead/${leadId}`
  );

  return response.data;
};


const deleteTask = async (taskId) => {
  const response = await axiosInstance.delete(
    `/tasks/${taskId}`
  );

  return response.data;
};

export default {
  createTask,
  getTasksByLead,
  deleteTask,
};