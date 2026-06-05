export const normalizeList = (data, key) =>
  Array.isArray(data) ? data : data?.[key] || [];

export const computeUsedGB = (files) => {
  const usedBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
  return +(usedBytes / (1024 ** 3)).toFixed(2);
};

export const getFolderId = (folder) => folder._id || folder.id;

export const normalizeFile = (file) => {
  if (!file) return file;
  const isStarred = file.isStarred ?? file.starred ?? false;
  return {
    ...file,
    id: file.id || file._id,
    isStarred,
    starred: isStarred,
  };
};

export const getActiveFolderId = (activeTab) =>
  activeTab?.startsWith('folder-') ? activeTab.replace('folder-', '') : null;

export const getAvatarUrl = (profile) => {
  const name = profile?.name || 'User';
  return (
    profile?.imageUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=16a34a&color=fff`
  );
};
