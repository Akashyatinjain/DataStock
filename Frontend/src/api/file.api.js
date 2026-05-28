import API from './auth.api';


// ==========================
// GET FILES
// ==========================

export const getFiles = async (folderId = null) => {
  const params = folderId ? { folderId } : {};
  const response = await API.get('/files', { params });
  return response.data;
};


// ==========================
// UPLOAD FILE
// ==========================

export const uploadFile = async (
  formData
) => {

  const response =
    await API.post(
      '/files/upload',
      formData,
      {
        headers: {
          'Content-Type':
            'multipart/form-data',
        },
      }
    );

  return response.data;
};


// ==========================
// DELETE FILE
// ==========================

export const deleteFile = async (
  fileId
) => {

  const response =
    await API.delete(
      `/files/${fileId}`
    );

  return response.data;
};