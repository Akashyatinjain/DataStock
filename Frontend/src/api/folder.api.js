import API from './auth.api';




export const getFolders = async () => {

  const response =
    await API.get('/folders');

  return response.data;
};



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


export const deleteFolder = async (
  folderId
) => {

  const response =
    await API.delete(
      `/folders/${folderId}`
    );

  return response.data;
};