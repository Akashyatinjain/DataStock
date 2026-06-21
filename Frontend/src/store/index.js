import { configureStore } from '@reduxjs/toolkit';
import themeReducer from './slices/themeSlice';
import authReducer from './slices/authSlice';
import filesReducer from './slices/filesSlice';
import foldersReducer from './slices/foldersSlice';
import notificationsReducer from './slices/notificationsSlice';
import shareReducer from './slices/shareSlice';
import paymentReducer from './slices/paymentSlice';

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    auth: authReducer,
    files: filesReducer,
    folders: foldersReducer,
    notifications: notificationsReducer,
    share: shareReducer,
    payment: paymentReducer,
  },
});
