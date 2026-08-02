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
 * Generate (or retrieve existing / update) public share link for a file.
 * @param {string} fileId
 * @param {object} options - Custom share options (expiresAt, password, allowDownload)
 */
export const generatePublicLink = async (fileId, options = {}) => {
  const response = await API.post(`/share/public/${fileId}`, options);
  return response.data;
};

/**
 * Fetch active public link configuration info for a file (creator only).
 * @param {string} fileId
 */
export const getPublicLinkInfo = async (fileId) => {
  const response = await API.get(`/share/public/info/${fileId}`);
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
 * Generate (or retrieve existing / update) public share link for a folder.
 * @param {string} folderId
 * @param {object} options - Custom share options (expiresAt, password, allowDownload)
 */
export const generatePublicFolderLink = async (folderId, options = {}) => {
  const response = await API.post(`/share/public/folder/${folderId}`, options);
  return response.data;
};

/**
 * Fetch active public link configuration info for a folder (creator only).
 * @param {string} folderId
 */
export const getPublicFolderLinkInfo = async (folderId) => {
  const response = await API.get(`/share/public/folder/info/${folderId}`);
  return response.data;
};

/**
 * Get file or folder info from a public share token (no auth required).
 * @param {string} token
 * @param {string} [password] - Optional link password for verification
 * @param {string} [subfolderId] - Optional subfolder ID to browse inside shared folder
 */
export const getPublicFile = async (token, password = '', subfolderId = null) => {
  const params = {};
  if (password) params.password = password;
  if (subfolderId) params.subfolderId = subfolderId;

  const response = await API.get(`/share/public/file/${token}`, { params });
  return response.data;
};

/**
 * Verify password for a protected public link and retrieve file or folder.
 * @param {string} token
 * @param {string} password
 * @param {string} [subfolderId]
 */
export const verifyPublicFilePassword = async (token, password, subfolderId = null) => {
  const response = await API.post(`/share/public/file/${token}/verify`, { password, subfolderId });
  return response.data;
};

export const shareFolder = async (folderId, email, permission = 'VIEW') => {
  const response = await API.post('/share/folder', { folderId, email, permission });
  return response.data;
};

export const getFolderShares = async (folderId) => {
  const response = await API.get(`/share/folder/${folderId}`);
  return response.data;
};

export const removeFolderShare = async (shareId) => {
  const response = await API.delete(`/share/folder/${shareId}`);
  return response.data;
};
