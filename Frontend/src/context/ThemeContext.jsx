import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setTheme, THEME_KEY, applyTheme } from '../store/slices/themeSlice';

export function ThemeProvider({ children }) {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme.theme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return children;
}
