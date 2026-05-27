import API from './auth.api';


// ==========================
// GET FOLDERS
// ==========================

export const getFolders = async () => {

  const response =
    await API.get('/folders');

  return response.data;
};


// ==========================
// CREATE FOLDER
// ==========================

export const createFolder = async (
  data
) => {

  const response =
    await API.post(
      '/folders',
      data
    );

  return response.data;
};


// ==========================
// DELETE FOLDER
// ==========================

export const deleteFolder = async (
  folderId
) => {

  const response =
    await API.delete(
      `/folders/${folderId}`
    );

  return response.data;
};