import API from './auth.api';



export const getFiles = async (folderId = null) => {
  const params = folderId ? { folderId } : {};
  const response = await API.get('/files', { params });
  return response.data;
};

export const getAllFiles = async () => {
  const response = await API.get('/files', { params: { all: true } });
  return response.data;
};



export const uploadFile = async (
  formData
) => {

  const response =
    await API.post(
      '/files/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

  return response.data;
};



export const deleteFile = async (
  fileId
) => {

  const response = await API.delete(
      `/files/${fileId}`
    );

  return response.data;
};

export const toggleStarFile = async (fileId) => {
  const response = await API.patch(`/files/${fileId}/star`);
  return response.data;
};