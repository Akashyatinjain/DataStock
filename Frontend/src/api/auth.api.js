import API from "./axios";

export const signup = (data)=>
    API.post("/auth/signup", data);

export const login = (data)=>
    API.post("/auth/login", data);

export const sendOtp = (email) =>
  API.post("/auth/send-otp", { email });

export const verifyOtp = (email, otp) =>
  API.post("/auth/verify-otp", { email, otp });

export const logout = () =>
  API.post("/auth/logout");

export const getProfile = () =>
  API.get("/user/profile");


export const getFiles = async () => {
  const response = await API.get('/files');
  return response.data;
};

export const uploadFile = async (formData) => {
  const response = await API.post(
    '/files/upload',
    formData,
    {
      headers: { // 'Content-Type': 'multipart/form-data' is set automatically by the browser when using FormData
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
};

export const deleteFile = async (fileId) => {
  const response = await API.delete(`/files/${fileId}`);
  return response.data;
};
export default API;
