import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getStorageActivity } from '../../api/user.api';
import {
  getFiles,
  getAllFiles,
  uploadFile,
  deleteFile,
  toggleStarFile,
  moveToTrash,
  restoreFromTrash,
  getTrashFiles,
  emptyTrash,
  toggleArchiveFile,
} from '../../api/file.api';
import { normalizeFile } from '../../utils/fileHelpers';

const mapStoragePayloadToAnalytics = (data) => ({
  storageUsed: Number(data?.storageUsed) || 0,
  storageLimit: Number(data?.storageLimit) || DEFAULT_STORAGE_LIMIT,
  subscriptionPlan: data?.subscriptionPlan || 'BASIC',
  categories: data?.categories || createEmptyCategories(),
  trash: data?.trash || { size: Number(data?.trashUsed) || 0, count: 0 },
  uploadTrend: Array.isArray(data?.uploadTrend) ? data.uploadTrend : [],
});

export const fetchStorageActivity = createAsyncThunk('files/fetchStorageActivity', async (_, thunkAPI) => {
  try {
    const response = await getStorageActivity();
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load storage activity');
  }
});

export const fetchFiles = createAsyncThunk('files/fetchFiles', async (folderId = null, thunkAPI) => {
  try {
    const data = await getFiles(folderId);
    return (data.files || []).map(normalizeFile);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load files');
  }
});

export const fetchAllFiles = createAsyncThunk('files/fetchAllFiles', async (_, thunkAPI) => {
  try {
    const data = await getAllFiles();
    return (data.files || []).map(normalizeFile);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load all files');
  }
});

export const uploadNewFile = createAsyncThunk('files/uploadNewFile', async (payload, thunkAPI) => {
  try {
    const { formData, onUploadProgress } = payload instanceof FormData ? { formData: payload } : payload;
    const data = await uploadFile(formData, onUploadProgress);
    return normalizeFile(data.file || data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data || { message: error.response?.data?.message || 'Failed to upload file' });
  }
});

export const deleteExistingFile = createAsyncThunk('files/deleteExistingFile', async (fileId, thunkAPI) => {
  try {
    await deleteFile(fileId);
    return fileId;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete file');
  }
});

export const toggleStar = createAsyncThunk('files/toggleStar', async (fileId, thunkAPI) => {
  try {
    const data = await toggleStarFile(fileId);
    return normalizeFile(data.file);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to toggle star');
  }
});

export const toggleArchive = createAsyncThunk('files/toggleArchive', async (fileId, thunkAPI) => {
  try {
    const data = await toggleArchiveFile(fileId);
    return normalizeFile(data.file);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to toggle archive');
  }
});

// ── Trash thunks ──

export const fetchTrashFiles = createAsyncThunk('files/fetchTrashFiles', async (_, thunkAPI) => {
  try {
    const data = await getTrashFiles();
    return (data.files || []).map(normalizeFile);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load trash');
  }
});

export const moveFileToTrash = createAsyncThunk('files/moveFileToTrash', async (fileId, thunkAPI) => {
  try {
    const data = await moveToTrash(fileId);
    return { fileId, file: normalizeFile(data.file) };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to move to trash');
  }
});

export const restoreFileFromTrash = createAsyncThunk('files/restoreFileFromTrash', async (fileId, thunkAPI) => {
  try {
    const data = await restoreFromTrash(fileId);
    return { fileId, file: normalizeFile(data.file) };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to restore file');
  }
});

export const emptyAllTrash = createAsyncThunk('files/emptyAllTrash', async (_, thunkAPI) => {
  try {
    const data = await emptyTrash();
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to empty trash');
  }
});

const DEFAULT_STORAGE_LIMIT = 10 * 1024 * 1024 * 1024;

const getCategoryKey = (mimeType = '') => {
  const type = mimeType.toLowerCase();
  if (type.startsWith('image/')) return 'images';
  if (type.startsWith('video/')) return 'videos';
  if (
    type.includes('pdf') ||
    type.includes('text') ||
    type.includes('document') ||
    type.includes('word') ||
    type.includes('sheet') ||
    type.includes('presentation')
  ) {
    return 'documents';
  }
  if (
    type.includes('zip') ||
    type.includes('rar') ||
    type.includes('tar') ||
    type.includes('gzip') ||
    type.includes('compressed') ||
    type.includes('archive')
  ) {
    return 'archives';
  }
  return 'others';
};

const createEmptyCategories = () => ({
  images: { size: 0, count: 0 },
  videos: { size: 0, count: 0 },
  documents: { size: 0, count: 0 },
  archives: { size: 0, count: 0 },
  others: { size: 0, count: 0 },
});

const toLocalDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildUploadTrend = (files) => {
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (6 - index));
    const dateKey = toLocalDateKey(date);
    return {
      date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      dateKey,
      count: 0,
      size: 0,
    };
  });
  const byDate = new Map(days.map((day) => [day.dateKey, day]));

  files.forEach((file) => {
    const uploadedAt = file.createdAt ? new Date(file.createdAt) : null;
    if (!uploadedAt || Number.isNaN(uploadedAt.getTime())) return;

    const day = byDate.get(toLocalDateKey(uploadedAt));
    if (!day) return;

    day.count += 1;
    day.size += Number(file.size) || 0;
  });

  return days.map(({ dateKey, ...day }) => day);
};

const buildStorageAnalytics = ({ files, trashFiles, user }) => {
  const categories = createEmptyCategories();

  files.forEach((file) => {
    const category = categories[getCategoryKey(file.mimeType)];
    category.count += 1;
    category.size += Number(file.size) || 0;
  });

  const activeStorageUsed = files.reduce((total, file) => total + (Number(file.size) || 0), 0);
  const trashStorageUsed = trashFiles.reduce((total, file) => total + (Number(file.size) || 0), 0);
  const profileStorageUsed = Number(user?.storageUsed);

  return {
    storageUsed: Number.isFinite(profileStorageUsed) ? profileStorageUsed : activeStorageUsed + trashStorageUsed,
    storageLimit: Number(user?.storageLimit) || DEFAULT_STORAGE_LIMIT,
    subscriptionPlan: user?.subscriptionPlan || 'BASIC',
    categories,
    trash: {
      size: trashStorageUsed,
      count: trashFiles.length,
    },
    uploadTrend: buildUploadTrend(files),
  };
};

export const fetchStorageAnalytics = createAsyncThunk('files/fetchStorageAnalytics', async (_, thunkAPI) => {
  try {
    const response = await getStorageActivity();
    const data = response.data;
    return {
      analytics: mapStoragePayloadToAnalytics(data),
      storageActivity: data,
    };
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load storage analytics');
  }
});

const filesSlice = createSlice({
  name: 'files',
  initialState: {
    files: [],
    allFiles: [],
    trashFiles: [],
    storageActivity: null,
    activityLoading: false,
    analytics: null,

    loading: false,
    trashLoading: false,
    analyticsLoading: false,
    uploading: false,
    deletingId: null,
    starringId: null,
    restoringId: null,
    archivingId: null,
    emptyingTrash: false,
    error: null,
    lastDeletedFile: null,
    trashFilesBackup: null,
    currentFolderId: null,
  },
  reducers: {
    addUploadedFile: (state, action) => {
      const file = action.payload;
      state.allFiles = [file, ...state.allFiles];
    },
    removeDeletedFile: (state, action) => {
      const fileId = action.payload;
      state.files = state.files.filter(f => f.id !== fileId);
      state.allFiles = state.allFiles.filter(f => f.id !== fileId);
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchFiles
      .addCase(fetchFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = action.payload;
        state.currentFolderId = action.meta.arg || null;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // fetchAllFiles
      .addCase(fetchAllFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.allFiles = action.payload;
      })
      .addCase(fetchAllFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // uploadNewFile
      .addCase(uploadNewFile.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadNewFile.fulfilled, (state, action) => {
        state.uploading = false;
        state.allFiles = [action.payload, ...state.allFiles];
      })
      .addCase(uploadNewFile.rejected, (state, action) => {
        state.uploading = false;
        const p = action.payload;
        state.error = typeof p === 'string' ? p : p?.message || 'Failed to upload file';
      })
      // deleteExistingFile (permanent delete)
      .addCase(deleteExistingFile.pending, (state, action) => {
        state.deletingId = action.meta.arg;
        state.error = null;
        
        // Optimistic update
        const fileId = action.meta.arg;
        const file = state.trashFiles.find(f => f.id === fileId) || 
                     state.allFiles.find(f => f.id === fileId) || 
                     state.files.find(f => f.id === fileId);
        if (file) {
          state.files = state.files.filter(f => f.id !== fileId);
          state.allFiles = state.allFiles.filter(f => f.id !== fileId);
          state.trashFiles = state.trashFiles.filter(f => f.id !== fileId);
          state.lastDeletedFile = file;
        }
      })
      .addCase(deleteExistingFile.fulfilled, (state) => {
        state.deletingId = null;
        state.lastDeletedFile = null;
      })
      .addCase(deleteExistingFile.rejected, (state, action) => {
        state.deletingId = null;
        state.error = action.payload;
        
        // Rollback
        if (state.lastDeletedFile && state.lastDeletedFile.id === action.meta.arg) {
          const file = state.lastDeletedFile;
          if (file.isTrash) {
            state.trashFiles = [file, ...state.trashFiles];
          } else {
            state.allFiles = [file, ...state.allFiles];
            state.files = [file, ...state.files];
          }
          state.lastDeletedFile = null;
        }
      })
      // toggleStar
      .addCase(toggleStar.pending, (state, action) => {
        state.starringId = action.meta.arg;
        state.error = null;
        
        // Optimistic update
        const fileId = action.meta.arg;
        const toggle = f => {
          if (f.id === fileId) {
            const nextStarred = !(f.isStarred || f.starred);
            return { ...f, isStarred: nextStarred, starred: nextStarred };
          }
          return f;
        };
        state.files = state.files.map(toggle);
        state.allFiles = state.allFiles.map(toggle);
      })
      .addCase(toggleStar.fulfilled, (state, action) => {
        state.starringId = null;
        const updatedFile = action.payload;
        state.files = state.files.map(f => f.id === updatedFile.id ? updatedFile : f);
        state.allFiles = state.allFiles.map(f => f.id === updatedFile.id ? updatedFile : f);
      })
      .addCase(toggleStar.rejected, (state, action) => {
        state.starringId = null;
        state.error = action.payload;
        
        // Rollback
        const fileId = action.meta.arg;
        const toggle = f => {
          if (f.id === fileId) {
            const nextStarred = !(f.isStarred || f.starred);
            return { ...f, isStarred: nextStarred, starred: nextStarred };
          }
          return f;
        };
        state.files = state.files.map(toggle);
        state.allFiles = state.allFiles.map(toggle);
      })
      // toggleArchive
      .addCase(toggleArchive.pending, (state, action) => {
        state.archivingId = action.meta.arg;
        state.error = null;
        
        // Optimistic update
        const fileId = action.meta.arg;
        const file = state.allFiles.find(f => f.id === fileId) || state.files.find(f => f.id === fileId);
        if (file) {
          const nextArchived = !(file.isArchived || file.archived);
          
          state.allFiles = state.allFiles.map(f =>
            f.id === fileId ? { ...f, isArchived: nextArchived, archived: nextArchived } : f
          );
          
          if (nextArchived) {
            state.files = state.files.filter(f => f.id !== fileId);
          } else {
            const unarchivedFile = { ...file, isArchived: false, archived: false };
            const fileFolder = file.folderId || null;
            const currentFolder = state.currentFolderId || null;
            if (fileFolder === currentFolder) {
              state.files = [unarchivedFile, ...state.files.filter(f => f.id !== fileId)];
            }
          }
        }
      })
      .addCase(toggleArchive.fulfilled, (state, action) => {
        state.archivingId = null;
        const updatedFile = action.payload;
        if (updatedFile.isArchived) {
          state.files = state.files.filter(f => f.id !== updatedFile.id);
        } else {
          const fileFolder = updatedFile.folderId || null;
          const currentFolder = state.currentFolderId || null;
          if (fileFolder === currentFolder) {
            state.files = [updatedFile, ...state.files.filter(f => f.id !== updatedFile.id)];
          }
        }
        state.allFiles = state.allFiles.map(f => f.id === updatedFile.id ? updatedFile : f);
      })
      .addCase(toggleArchive.rejected, (state, action) => {
        state.archivingId = null;
        state.error = action.payload;
        
        // Rollback
        const fileId = action.meta.arg;
        const file = state.allFiles.find(f => f.id === fileId) || state.files.find(f => f.id === fileId);
        if (file) {
          const nextArchived = !(file.isArchived || file.archived);
          state.allFiles = state.allFiles.map(f =>
            f.id === fileId ? { ...f, isArchived: nextArchived, archived: nextArchived } : f
          );
          if (nextArchived) {
            state.files = state.files.filter(f => f.id !== fileId);
          } else {
            const fileFolder = file.folderId || null;
            const currentFolder = state.currentFolderId || null;
            if (fileFolder === currentFolder) {
              state.files = [file, ...state.files.filter(f => f.id !== fileId)];
            }
          }
        }
      })
      // ── Trash reducers ──
      // fetchTrashFiles
      .addCase(fetchTrashFiles.pending, (state) => {
        state.trashLoading = true;
        state.error = null;
      })
      .addCase(fetchTrashFiles.fulfilled, (state, action) => {
        state.trashLoading = false;
        state.trashFiles = action.payload;
      })
      .addCase(fetchTrashFiles.rejected, (state, action) => {
        state.trashLoading = false;
        state.error = action.payload;
      })
      // moveFileToTrash
      .addCase(moveFileToTrash.pending, (state, action) => {
        state.deletingId = action.meta.arg;
        state.error = null;
        
        // Optimistic update
        const fileId = action.meta.arg;
        const file = state.allFiles.find(f => f.id === fileId) || state.files.find(f => f.id === fileId);
        if (file) {
          state.files = state.files.filter(f => f.id !== fileId);
          state.allFiles = state.allFiles.filter(f => f.id !== fileId);
          const trashedFile = { ...file, isTrash: true };
          state.trashFiles = [trashedFile, ...state.trashFiles.filter(f => f.id !== fileId)];
        }
      })
      .addCase(moveFileToTrash.fulfilled, (state, action) => {
        state.deletingId = null;
        const { fileId, file } = action.payload;
        if (file) {
          state.trashFiles = state.trashFiles.map(f => f.id === fileId ? file : f);
        }
      })
      .addCase(moveFileToTrash.rejected, (state, action) => {
        state.deletingId = null;
        state.error = action.payload;
        
        // Rollback
        const fileId = action.meta.arg;
        const file = state.trashFiles.find(f => f.id === fileId);
        if (file) {
          state.trashFiles = state.trashFiles.filter(f => f.id !== fileId);
          const restoredFile = { ...file, isTrash: false };
          state.allFiles = [restoredFile, ...state.allFiles];
          state.files = [restoredFile, ...state.files];
        }
      })
      // restoreFileFromTrash
      .addCase(restoreFileFromTrash.pending, (state, action) => {
        state.restoringId = action.meta.arg;
        state.error = null;
        
        // Optimistic update
        const fileId = action.meta.arg;
        const file = state.trashFiles.find(f => f.id === fileId);
        if (file) {
          state.trashFiles = state.trashFiles.filter(f => f.id !== fileId);
          const restoredFile = { ...file, isTrash: false };
          state.allFiles = [restoredFile, ...state.allFiles];
          state.files = [restoredFile, ...state.files];
        }
      })
      .addCase(restoreFileFromTrash.fulfilled, (state, action) => {
        state.restoringId = null;
        const { fileId, file } = action.payload;
        if (file) {
          state.allFiles = state.allFiles.map(f => f.id === fileId ? file : f);
          state.files = state.files.map(f => f.id === fileId ? file : f);
        }
      })
      .addCase(restoreFileFromTrash.rejected, (state, action) => {
        state.restoringId = null;
        state.error = action.payload;
        
        // Rollback
        const fileId = action.meta.arg;
        const file = state.allFiles.find(f => f.id === fileId) || state.files.find(f => f.id === fileId);
        if (file) {
          state.allFiles = state.allFiles.filter(f => f.id !== fileId);
          state.files = state.files.filter(f => f.id !== fileId);
          const trashedFile = { ...file, isTrash: true };
          state.trashFiles = [trashedFile, ...state.trashFiles];
        }
      })
      // emptyAllTrash
      .addCase(emptyAllTrash.pending, (state) => {
        state.emptyingTrash = true;
        state.error = null;
        
        // Optimistic update
        state.trashFilesBackup = state.trashFiles;
        state.trashFiles = [];
      })
      .addCase(emptyAllTrash.fulfilled, (state) => {
        state.emptyingTrash = false;
        state.trashFilesBackup = null;
        if (state.analytics) {
          state.analytics.trash = { size: 0, count: 0 };
        }
      })
      .addCase(emptyAllTrash.rejected, (state, action) => {
        state.emptyingTrash = false;
        state.error = action.payload;
        
        // Rollback
        if (state.trashFilesBackup) {
          state.trashFiles = state.trashFilesBackup;
          state.trashFilesBackup = null;
        }
      })
        .addCase(fetchStorageActivity.pending, (state) => {
          state.activityLoading = true;
          state.analyticsLoading = true;
          state.error = null;
        })
        .addCase(fetchStorageActivity.fulfilled, (state, action) => {
          state.activityLoading = false;
          state.analyticsLoading = false;
          state.storageActivity = action.payload;
          state.analytics = mapStoragePayloadToAnalytics(action.payload);
        })
        .addCase(fetchStorageActivity.rejected, (state, action) => {
          state.activityLoading = false;
          state.analyticsLoading = false;
          state.error = action.payload;
        })
        // fetchStorageAnalytics
        .addCase(fetchStorageAnalytics.pending, (state) => {
          state.analyticsLoading = true;
          state.activityLoading = true;
          state.error = null;
        })
        .addCase(fetchStorageAnalytics.fulfilled, (state, action) => {
          state.analyticsLoading = false;
          state.activityLoading = false;
          state.analytics = action.payload.analytics;
          state.storageActivity = action.payload.storageActivity;
        })
        .addCase(fetchStorageAnalytics.rejected, (state, action) => {
          state.analyticsLoading = false;
          state.error = action.payload;
        });
  },
});

export const { addUploadedFile, removeDeletedFile } = filesSlice.actions;
export default filesSlice.reducer;