import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTheme, THEME_KEY, applyTheme } from '../store/slices/themeSlice';

export function ThemeProvider({ children }) {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const stored = localStorage.getItem(THEME_KEY);
      if (!stored) {
        dispatch(setTheme(e.matches ? 'dark' : 'light'));
      }
    };
    media.addEventListener('change', handleChange);
    return () => media.removeEventListener('change', handleChange);
  }, [dispatch]);

  return children;
}
