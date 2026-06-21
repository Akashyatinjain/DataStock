import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import API from '../../api/axios';
import { getStoredUser, clearStoredAuth, persistAuth } from '../../utils/auth';

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || error.message || fallback;

export const signupUser = createAsyncThunk('auth/signupUser', async (payload, thunkAPI) => {
  try {
    const response = await API.post('/auth/signup', payload);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Signup failed'));
  }
});

export const loginUser = createAsyncThunk('auth/loginUser', async (payload, thunkAPI) => {
  try {
    const response = await API.post('/auth/login', payload);
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Login failed'));
  }
});

export const sendLoginOtp = createAsyncThunk('auth/sendLoginOtp', async (email, thunkAPI) => {
  try {
    const response = await API.post('/auth/send-otp', { email });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'OTP failed'));
  }
});

export const verifyLoginOtp = createAsyncThunk('auth/verifyLoginOtp', async ({ email, otp }, thunkAPI) => {
  try {
    const response = await API.post('/auth/verify-otp', { email, otp });
    return response.data;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Invalid OTP'));
  }
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, thunkAPI) => {
  try {
    await API.post('/auth/logout');
    return true;
  } catch (error) {
    return thunkAPI.rejectWithValue(getErrorMessage(error, 'Logout failed'));
  }
});

export const fetchProfile = createAsyncThunk('auth/fetchProfile', async (_, thunkAPI) => {
  try {
    const response = await API.get('/user/profile');
    return response.data; // { success: true, user: ... }
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
  }
});

export const updateUserProfile = createAsyncThunk('auth/updateUserProfile', async ({ username }, thunkAPI) => {
  try {
    const response = await API.put('/user/update', { username });
    return response.data; // { success: true, user: ... }
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update profile');
  }
});

export const uploadProfileImage = createAsyncThunk('auth/uploadProfileImage', async (formData, thunkAPI) => {
  try {
    const response = await API.post('/user/upload-profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data; // { success: true, imageUrl: ... }
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to upload image');
  }
});

export const deleteProfileImage = createAsyncThunk('auth/deleteProfileImage', async (_, thunkAPI) => {
  try {
    const response = await API.delete('/user/delete-profile');
    return response.data; // { success: true }
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to delete profile image');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: getStoredUser(),
    loading: false,
    authLoading: false,
    otpLoading: false,
    updating: false,
    uploading: false,
    deletingImage: false,
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearAuth: (state) => {
      state.user = null;
      clearStoredAuth();
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProfile
      .addCase(signupUser.pending, (state) => {
        state.authLoading = true;
        state.error = null;
      })
      .addCase(signupUser.fulfilled, (state, action) => {
        state.authLoading = false;
        state.user = action.payload.user || action.payload.data?.user || action.payload;
        persistAuth({
          token: action.payload.token,
          user: state.user,
          refreshToken: action.payload.refreshToken,
        });
      })
      .addCase(signupUser.rejected, (state, action) => {
        state.authLoading = false;
        state.error = action.payload;
      })
      .addCase(loginUser.pending, (state) => {
        state.authLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.authLoading = false;
        state.user = action.payload.user || action.payload.data?.user || action.payload;
        persistAuth({
          token: action.payload.token,
          user: state.user,
          refreshToken: action.payload.refreshToken,
        });
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.authLoading = false;
        state.error = action.payload;
      })
      .addCase(sendLoginOtp.pending, (state) => {
        state.otpLoading = true;
        state.error = null;
      })
      .addCase(sendLoginOtp.fulfilled, (state) => {
        state.otpLoading = false;
      })
      .addCase(sendLoginOtp.rejected, (state, action) => {
        state.otpLoading = false;
        state.error = action.payload;
      })
      .addCase(verifyLoginOtp.pending, (state) => {
        state.authLoading = true;
        state.error = null;
      })
      .addCase(verifyLoginOtp.fulfilled, (state, action) => {
        state.authLoading = false;
        state.user = action.payload.user || action.payload.data?.user || action.payload;
        persistAuth({
          token: action.payload.token,
          user: state.user,
          refreshToken: action.payload.refreshToken,
        });
      })
      .addCase(verifyLoginOtp.rejected, (state, action) => {
        state.authLoading = false;
        state.error = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        clearStoredAuth();
      })
      // fetchProfile
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user || action.payload.data?.user || action.payload;
        if (state.user) {
          persistAuth({ user: state.user });
        }
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // updateUserProfile
      .addCase(updateUserProfile.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.updating = false;
        state.user = action.payload.user || action.payload.data?.user || action.payload;
        if (state.user) {
          persistAuth({ user: state.user });
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })
      // uploadProfileImage
      .addCase(uploadProfileImage.pending, (state) => {
        state.uploading = true;
        state.error = null;
      })
      .addCase(uploadProfileImage.fulfilled, (state, action) => {
        state.uploading = false;
        if (state.user) {
          state.user.imageUrl = action.payload.imageUrl;
          persistAuth({ user: state.user });
        }
      })
      .addCase(uploadProfileImage.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.payload;
      })
      // deleteProfileImage
      .addCase(deleteProfileImage.pending, (state) => {
        state.deletingImage = true;
        state.error = null;
      })
      .addCase(deleteProfileImage.fulfilled, (state) => {
        state.deletingImage = false;
        if (state.user) {
          state.user.imageUrl = null;
          persistAuth({ user: state.user });
        }
      })
      .addCase(deleteProfileImage.rejected, (state, action) => {
        state.deletingImage = false;
        state.error = action.payload;
      });
  },
});

export const { setUser, clearAuth } = authSlice.actions;
export default authSlice.reducer;
