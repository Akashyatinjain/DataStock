import API from './auth.api';

/**
 * Share a file with another user by their email address.
 * @param {string} fileId
 * @param {string} email - Recipient's email
 * @param {'VIEW'|'EDIT'} permission
 */
export const shareFile = async (fileId, email, permission = 'VIEW') => {
  const response = await API.post('/share/file', { fileId, email, permission });
  return response.data;
};

/**
 * Get all files that have been shared with the current user.
 */
export const getSharedWithMe = async () => {
  const response = await API.get('/share/shared-with-me');
  return response.data;
};

/**
 * Get all users a specific file has been shared with.
 * @param {string} fileId
 */
export const getFileShares = async (fileId) => {
  const response = await API.get(`/share/file/${fileId}`);
  return response.data;
};

/**
 * Remove a specific share entry (revoke one person's access).
 * @param {string} shareId
 */
export const removeShare = async (shareId) => {
  const response = await API.delete(`/share/${shareId}`);
  return response.data;
};

/**
 * Generate (or retrieve existing) public share link for a file.
 * @param {string} fileId
 */
export const generatePublicLink = async (fileId) => {
  const response = await API.post(`/share/public/${fileId}`);
  return response.data;
};

/**
 * Revoke a public share link.
 * @param {string} token
 */
export const revokePublicLink = async (token) => {
  const response = await API.delete(`/share/public/${token}`);
  return response.data;
};

/**
 * Get file info from a public share token (no auth required).
 * @param {string} token
 */
export const getPublicFile = async (token) => {
  const response = await API.get(`/share/public/file/${token}`);
  return response.data;
};
