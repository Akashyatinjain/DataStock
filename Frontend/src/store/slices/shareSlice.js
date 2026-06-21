import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  generatePublicLink,
  getFileShares,
  getPublicFile,
  getSharedWithMe,
  removeShare,
  revokePublicLink,
  shareFile,
} from '../../api/share.api';

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

export const fetchSharedWithMe = createAsyncThunk('share/fetchSharedWithMe', async (_, thunkAPI) => {
  try {
    const data = await getSharedWithMe();
    return data.shares || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Failed to load shared files'));
  }
});

export const fetchFileShares = createAsyncThunk('share/fetchFileShares', async (fileId, thunkAPI) => {
  try {
    const data = await getFileShares(fileId);
    return data.shares || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Failed to load file shares'));
  }
});

export const shareFileWithUser = createAsyncThunk(
  'share/shareFileWithUser',
  async ({ fileId, email, permission = 'VIEW' }, thunkAPI) => {
    try {
      const data = await shareFile(fileId, email, permission);
      return data.share || data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, 'Failed to share'));
    }
  }
);

export const removeFileShare = createAsyncThunk('share/removeFileShare', async (shareId, thunkAPI) => {
  try {
    await removeShare(shareId);
    return shareId;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Failed to remove access'));
  }
});

export const createPublicLink = createAsyncThunk('share/createPublicLink', async (fileId, thunkAPI) => {
  try {
    const data = await generatePublicLink(fileId);
    return data.url || `${window.location.origin}/share/${data.token}`;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Failed to generate link'));
  }
});

export const deletePublicLink = createAsyncThunk('share/deletePublicLink', async (token, thunkAPI) => {
  try {
    await revokePublicLink(token);
    return token;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Failed to revoke link'));
  }
});

export const fetchPublicFile = createAsyncThunk('share/fetchPublicFile', async (token, thunkAPI) => {
  try {
    const data = await getPublicFile(token);
    return data.file;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Failed to load file'));
  }
});

const shareSlice = createSlice({
  name: 'share',
  initialState: {
    sharedWithMe: [],
    fileShares: [],
    publicLink: '',
    publicFile: null,
    loading: false,
    fileSharesLoading: false,
    sharing: false,
    removingId: null,
    linkLoading: false,
    revoking: false,
    publicFileLoading: false,
    error: null,
  },
  reducers: {
    clearShareModalState: (state) => {
      state.fileShares = [];
      state.publicLink = '';
      state.error = null;
      state.fileSharesLoading = false;
      state.sharing = false;
      state.removingId = null;
      state.linkLoading = false;
      state.revoking = false;
    },
    clearPublicFile: (state) => {
      state.publicFile = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchSharedWithMe
      .addCase(fetchSharedWithMe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSharedWithMe.fulfilled, (state, action) => {
        state.loading = false;
        state.sharedWithMe = action.payload;
      })
      .addCase(fetchSharedWithMe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchFileShares.pending, (state) => {
        state.fileSharesLoading = true;
        state.error = null;
      })
      .addCase(fetchFileShares.fulfilled, (state, action) => {
        state.fileSharesLoading = false;
        state.fileShares = action.payload;
      })
      .addCase(fetchFileShares.rejected, (state, action) => {
        state.fileSharesLoading = false;
        state.error = action.payload;
      })
      .addCase(shareFileWithUser.pending, (state) => {
        state.sharing = true;
        state.error = null;
      })
      .addCase(shareFileWithUser.fulfilled, (state, action) => {
        state.sharing = false;
        state.fileShares = [...state.fileShares, action.payload];
      })
      .addCase(shareFileWithUser.rejected, (state, action) => {
        state.sharing = false;
        state.error = action.payload;
      })
      .addCase(removeFileShare.pending, (state, action) => {
        state.removingId = action.meta.arg;
        state.error = null;
      })
      .addCase(removeFileShare.fulfilled, (state, action) => {
        state.removingId = null;
        state.fileShares = state.fileShares.filter((share) => share.id !== action.payload);
      })
      .addCase(removeFileShare.rejected, (state, action) => {
        state.removingId = null;
        state.error = action.payload;
      })
      .addCase(createPublicLink.pending, (state) => {
        state.linkLoading = true;
        state.error = null;
      })
      .addCase(createPublicLink.fulfilled, (state, action) => {
        state.linkLoading = false;
        state.publicLink = action.payload;
      })
      .addCase(createPublicLink.rejected, (state, action) => {
        state.linkLoading = false;
        state.error = action.payload;
      })
      .addCase(deletePublicLink.pending, (state) => {
        state.revoking = true;
        state.error = null;
      })
      .addCase(deletePublicLink.fulfilled, (state) => {
        state.revoking = false;
        state.publicLink = '';
      })
      .addCase(deletePublicLink.rejected, (state, action) => {
        state.revoking = false;
        state.error = action.payload;
      })
      .addCase(fetchPublicFile.pending, (state) => {
        state.publicFileLoading = true;
        state.publicFile = null;
        state.error = null;
      })
      .addCase(fetchPublicFile.fulfilled, (state, action) => {
        state.publicFileLoading = false;
        state.publicFile = action.payload;
      })
      .addCase(fetchPublicFile.rejected, (state, action) => {
        state.publicFileLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearShareModalState, clearPublicFile } = shareSlice.actions;
export default shareSlice.reducer;
