import { createSlice } from '@reduxjs/toolkit';

export const THEME_KEY = 'datastock-theme';

export function getStoredTheme() {
  return 'light';
}

export function applyTheme() {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('dark');
  }
  try {
    localStorage.setItem(THEME_KEY, 'light');
  } catch (e) {}
}

// Apply light theme immediately
if (typeof window !== 'undefined') {
  applyTheme();
}

const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    theme: 'light',
  },
  reducers: {
    toggleTheme: (state) => {
      state.theme = 'light';
      applyTheme();
    },
    setTheme: (state) => {
      state.theme = 'light';
      applyTheme();
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
