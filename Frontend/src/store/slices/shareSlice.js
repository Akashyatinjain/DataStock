import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  generatePublicLink,
  getFileShares,
  getPublicFile,
  getSharedWithMe,
  removeShare,
  revokePublicLink,
  shareFile,
  getPublicLinkInfo,
  verifyPublicFilePassword,
  shareFolder,
  getFolderShares,
  removeFolderShare,
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

export const createPublicLink = createAsyncThunk('share/createPublicLink', async ({ fileId, options = {} }, thunkAPI) => {
  try {
    const data = await generatePublicLink(fileId, options);
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Failed to generate link'));
  }
});

export const fetchPublicLinkInfo = createAsyncThunk('share/fetchPublicLinkInfo', async (fileId, thunkAPI) => {
  try {
    const data = await getPublicLinkInfo(fileId);
    return data.share;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Failed to load link settings'));
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
    return data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Failed to load file'));
  }
});

export const verifyPublicFilePasswordThunk = createAsyncThunk(
  'share/verifyPublicFilePasswordThunk',
  async ({ token, password }, thunkAPI) => {
    try {
      const data = await verifyPublicFilePassword(token, password);
      return data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, 'Incorrect password'));
    }
  }
);

export const fetchFolderShares = createAsyncThunk('share/fetchFolderShares', async (folderId, thunkAPI) => {
  try {
    const data = await getFolderShares(folderId);
    return data.shares || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Failed to load folder shares'));
  }
});

export const shareFolderWithUser = createAsyncThunk(
  'share/shareFolderWithUser',
  async ({ folderId, email, permission = 'VIEW' }, thunkAPI) => {
    try {
      const data = await shareFolder(folderId, email, permission);
      return data.share || data;
    } catch (error) {
      return thunkAPI.rejectWithValue(getErrorMessage(error, 'Failed to share'));
    }
  }
);

export const removeFolderShareThunk = createAsyncThunk('share/removeFolderShare', async (shareId, thunkAPI) => {
  try {
    await removeFolderShare(shareId);
    return shareId;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Failed to remove access'));
  }
});

const shareSlice = createSlice({
  name: 'share',
  initialState: {
    sharedWithMe: { files: [], folders: [] },
    fileShares: [],
    publicLink: '',
    publicLinkSettings: null,
    publicFile: null,
    loading: false,
    fileSharesLoading: false,
    sharing: false,
    removingId: null,
    linkLoading: false,
    revoking: false,
    publicFileLoading: false,
    error: null,
    removedShareBackup: null,
  },
  reducers: {
    clearShareModalState: (state) => {
      state.fileShares = [];
      state.publicLink = '';
      state.publicLinkSettings = null;
      state.error = null;
      state.fileSharesLoading = false;
      state.sharing = false;
      state.removingId = null;
      state.linkLoading = false;
      state.revoking = false;
      state.removedShareBackup = null;
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
        
        // Optimistic update
        const shareId = action.meta.arg;
        state.removedShareBackup = state.fileShares.find((share) => share.id === shareId);
        state.fileShares = state.fileShares.filter((share) => share.id !== shareId);
      })
      .addCase(removeFileShare.fulfilled, (state) => {
        state.removingId = null;
        state.removedShareBackup = null;
      })
      .addCase(removeFileShare.rejected, (state, action) => {
        state.removingId = null;
        state.error = action.payload;
        
        // Rollback
        const shareId = action.meta.arg;
        if (state.removedShareBackup && state.removedShareBackup.id === shareId) {
          state.fileShares = [...state.fileShares, state.removedShareBackup];
          state.removedShareBackup = null;
        }
      })
      .addCase(createPublicLink.pending, (state) => {
        state.linkLoading = true;
        state.error = null;
      })
      .addCase(createPublicLink.fulfilled, (state, action) => {
        state.linkLoading = false;
        if (action.payload) {
          state.publicLink = action.payload.url;
          state.publicLinkSettings = action.payload.share;
        }
      })
      .addCase(createPublicLink.rejected, (state, action) => {
        state.linkLoading = false;
        state.error = action.payload;
      })
      .addCase(fetchPublicLinkInfo.pending, (state) => {
        state.linkLoading = true;
        state.error = null;
      })
      .addCase(fetchPublicLinkInfo.fulfilled, (state, action) => {
        state.linkLoading = false;
        if (action.payload) {
          state.publicLink = action.payload.url;
          state.publicLinkSettings = action.payload;
        } else {
          state.publicLink = '';
          state.publicLinkSettings = null;
        }
      })
      .addCase(fetchPublicLinkInfo.rejected, (state, action) => {
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
        state.publicLinkSettings = null;
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
      })
      .addCase(verifyPublicFilePasswordThunk.pending, (state) => {
        state.publicFileLoading = true;
        state.error = null;
      })
      .addCase(verifyPublicFilePasswordThunk.fulfilled, (state, action) => {
        state.publicFileLoading = false;
        state.publicFile = action.payload;
        state.error = null;
      })
      .addCase(verifyPublicFilePasswordThunk.rejected, (state, action) => {
        state.publicFileLoading = false;
        state.error = action.payload;
      })
      // fetchFolderShares
      .addCase(fetchFolderShares.pending, (state) => {
        state.fileSharesLoading = true;
        state.error = null;
      })
      .addCase(fetchFolderShares.fulfilled, (state, action) => {
        state.fileSharesLoading = false;
        state.fileShares = action.payload;
      })
      .addCase(fetchFolderShares.rejected, (state, action) => {
        state.fileSharesLoading = false;
        state.error = action.payload;
      })
      // shareFolderWithUser
      .addCase(shareFolderWithUser.pending, (state) => {
        state.sharing = true;
        state.error = null;
      })
      .addCase(shareFolderWithUser.fulfilled, (state, action) => {
        state.sharing = false;
        state.fileShares = [...state.fileShares, action.payload];
      })
      .addCase(shareFolderWithUser.rejected, (state, action) => {
        state.sharing = false;
        state.error = action.payload;
      })
      // removeFolderShareThunk
      .addCase(removeFolderShareThunk.pending, (state, action) => {
        state.removingId = action.meta.arg;
        state.error = null;
        
        // Optimistic update
        const shareId = action.meta.arg;
        state.removedShareBackup = state.fileShares.find((share) => share.id === shareId);
        state.fileShares = state.fileShares.filter((share) => share.id !== shareId);
      })
      .addCase(removeFolderShareThunk.fulfilled, (state) => {
        state.removingId = null;
        state.removedShareBackup = null;
      })
      .addCase(removeFolderShareThunk.rejected, (state, action) => {
        state.removingId = null;
        state.error = action.payload;
        
        // Rollback
        const shareId = action.meta.arg;
        if (state.removedShareBackup && state.removedShareBackup.id === shareId) {
          state.fileShares = [...state.fileShares, state.removedShareBackup];
          state.removedShareBackup = null;
        }
      });
  },
});

export const { clearShareModalState, clearPublicFile } = shareSlice.actions;
export default shareSlice.reducer;
