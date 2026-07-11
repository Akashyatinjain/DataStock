import { useDispatch, useSelector } from 'react-redux';
import { toggleTheme, setTheme } from '../store/slices/themeSlice';

export default function useTheme() {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.theme.theme);

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme: () => dispatch(toggleTheme()),
    setLightTheme: () => dispatch(setTheme('light')),
    setDarkTheme: () => dispatch(setTheme('dark')),
  };
}
