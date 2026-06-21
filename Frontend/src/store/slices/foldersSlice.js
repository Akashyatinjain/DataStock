import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getFolders, createFolder, deleteFolder } from '../../api/folder.api';
import { normalizeList } from '../../utils/fileHelpers';

export const fetchFolders = createAsyncThunk('folders/fetchFolders', async (_, thunkAPI) => {
  try {
    const data = await getFolders();
    return normalizeList(data, 'folders');
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load folders');
  }
});

export const createNewFolder = createAsyncThunk('folders/createNewFolder', async (folderData, thunkAPI) => {
  try {
    const data = await createFolder(folderData);
    return data.folder || data;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create folder');
  }
});

export const deleteExistingFolder = createAsyncThunk('folders/deleteExistingFolder', async (folderId, thunkAPI) => {
  try {
    await deleteFolder(folderId);
    return folderId;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete folder');
  }
});

const foldersSlice = createSlice({
  name: 'folders',
  initialState: {
    folders: [],
    loading: false,
    creating: false,
    deletingId: null,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchFolders
      .addCase(fetchFolders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFolders.fulfilled, (state, action) => {
        state.loading = false;
        state.folders = action.payload;
      })
      .addCase(fetchFolders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createNewFolder
      .addCase(createNewFolder.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createNewFolder.fulfilled, (state, action) => {
        state.creating = false;
        state.folders = [...state.folders, action.payload];
      })
      .addCase(createNewFolder.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      // deleteExistingFolder
      .addCase(deleteExistingFolder.pending, (state, action) => {
        state.deletingId = action.meta.arg;
        state.error = null;
      })
      .addCase(deleteExistingFolder.fulfilled, (state, action) => {
        state.deletingId = null;
        state.folders = state.folders.filter(f => f.id !== action.payload && f._id !== action.payload);
      })
      .addCase(deleteExistingFolder.rejected, (state, action) => {
        state.deletingId = null;
        state.error = action.payload;
      });
  },
});

export default foldersSlice.reducer;
