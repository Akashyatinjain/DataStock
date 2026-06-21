import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getNotifications, markAsRead, markAllAsRead } from '../../api/notification.api';

export const fetchNotifications = createAsyncThunk('notifications/fetchNotifications', async (_, thunkAPI) => {
  try {
    const data = await getNotifications();
    return data.notifications || [];
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to load notifications');
  }
});

export const readNotification = createAsyncThunk('notifications/readNotification', async (id, thunkAPI) => {
  try {
    await markAsRead(id);
    return id;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to read notification');
  }
});

export const readAllNotifications = createAsyncThunk('notifications/readAllNotifications', async (_, thunkAPI) => {
  try {
    await markAllAsRead();
    return;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to read all notifications');
  }
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    loading: false,
    error: null,
  },
  reducers: {
    addNotification: (state, action) => {
      state.notifications = [action.payload, ...state.notifications];
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchNotifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // readNotification
      .addCase(readNotification.fulfilled, (state, action) => {
        const id = action.payload;
        state.notifications = state.notifications.map((n) =>
          n.id === id || n._id === id ? { ...n, read: true, isRead: true } : n
        );
      })
      // readAllNotifications
      .addCase(readAllNotifications.fulfilled, (state) => {
        state.notifications = state.notifications.map((n) => ({ ...n, read: true, isRead: true }));
      });
  },
});

export const { addNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
