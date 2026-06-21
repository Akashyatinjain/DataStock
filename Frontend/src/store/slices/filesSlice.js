import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getFiles, getAllFiles, uploadFile, deleteFile, toggleStarFile } from '../../api/file.api';
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

const filesSlice = createSlice({
  name: 'files',
  initialState: {
    files: [],
    allFiles: [],
    loading: false,
    uploading: false,
    deletingId: null,
    starringId: null,
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
      // deleteExistingFile
      .addCase(deleteExistingFile.pending, (state, action) => {
        state.deletingId = action.meta.arg;
        state.error = null;
      })
      .addCase(deleteExistingFile.fulfilled, (state, action) => {
        state.deletingId = null;
        const fileId = action.payload;
        state.files = state.files.filter(f => f.id !== fileId);
        state.allFiles = state.allFiles.filter(f => f.id !== fileId);
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
      });
  },
});

export const { addUploadedFile, removeDeletedFile } = filesSlice.actions;
export default filesSlice.reducer;
