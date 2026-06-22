import API from './auth.api';

// Fetch current user profile
export const getProfile = async () => {
  const response = await API.get('/user/profile');
  return response.data;
};

// Fetch storage activity (active and trash usage)
export const getStorageActivity = async () => {
  const response = await API.get('/user/storage-activity');
  return response.data;
};
