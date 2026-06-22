import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
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
} from '../../api/file.api';
import { normalizeFile } from '../../utils/fileHelpers';

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

export const uploadNewFile = createAsyncThunk('files/uploadNewFile', async (formData, thunkAPI) => {
  try {
    const data = await uploadFile(formData);
    return normalizeFile(data.file || data);
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to upload file');
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

const filesSlice = createSlice({
  name: 'files',
  initialState: {
    files: [],
    allFiles: [],
    trashFiles: [],
    loading: false,
    trashLoading: false,
    uploading: false,
    deletingId: null,
    starringId: null,
    restoringId: null,
    emptyingTrash: false,
    error: null,
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
        state.error = action.payload;
      })
      // deleteExistingFile (permanent delete)
      .addCase(deleteExistingFile.pending, (state, action) => {
        state.deletingId = action.meta.arg;
        state.error = null;
      })
      .addCase(deleteExistingFile.fulfilled, (state, action) => {
        state.deletingId = null;
        const fileId = action.payload;
        state.files = state.files.filter(f => f.id !== fileId);
        state.allFiles = state.allFiles.filter(f => f.id !== fileId);
        state.trashFiles = state.trashFiles.filter(f => f.id !== fileId);
      })
      .addCase(deleteExistingFile.rejected, (state, action) => {
        state.deletingId = null;
        state.error = action.payload;
      })
      // toggleStar
      .addCase(toggleStar.pending, (state, action) => {
        state.starringId = action.meta.arg;
        state.error = null;
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
      })
      .addCase(moveFileToTrash.fulfilled, (state, action) => {
        state.deletingId = null;
        const { fileId } = action.payload;
        state.files = state.files.filter(f => f.id !== fileId);
        state.allFiles = state.allFiles.filter(f => f.id !== fileId);
      })
      .addCase(moveFileToTrash.rejected, (state, action) => {
        state.deletingId = null;
        state.error = action.payload;
      })
      // restoreFileFromTrash
      .addCase(restoreFileFromTrash.pending, (state, action) => {
        state.restoringId = action.meta.arg;
        state.error = null;
      })
      .addCase(restoreFileFromTrash.fulfilled, (state, action) => {
        state.restoringId = null;
        const { fileId, file } = action.payload;
        state.trashFiles = state.trashFiles.filter(f => f.id !== fileId);
        state.allFiles = [file, ...state.allFiles];
      })
      .addCase(restoreFileFromTrash.rejected, (state, action) => {
        state.restoringId = null;
        state.error = action.payload;
      })
      // emptyAllTrash
      .addCase(emptyAllTrash.pending, (state) => {
        state.emptyingTrash = true;
        state.error = null;
      })
      .addCase(emptyAllTrash.fulfilled, (state) => {
        state.emptyingTrash = false;
        state.trashFiles = [];
      })
      .addCase(emptyAllTrash.rejected, (state, action) => {
        state.emptyingTrash = false;
        state.error = action.payload;
      });
  },
});

export const { addUploadedFile, removeDeletedFile } = filesSlice.actions;
export default filesSlice.reducer;
