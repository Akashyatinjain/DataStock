import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Toaster } from 'react-hot-toast';
import { Provider } from 'react-redux';
import { store } from './store';
import { ThemeProvider } from './context/ThemeContext';
import { CryptoProvider } from './context/CryptoContext';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <CryptoProvider>
          <App />
          <Toaster position="top-right" reverseOrder={false} />
        </CryptoProvider>
      </ThemeProvider>
    </Provider>
  </StrictMode>,
)

