import API from "./auth.api";

export const getNotifications = async () => {
  const response = await API.get("/notifications");
  return response.data;
};

export const markAsRead = async (id) => {
  const response = await API.patch(`/notifications/${id}/read`);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await API.post("/notifications/read-all");
  return response.data;
};
