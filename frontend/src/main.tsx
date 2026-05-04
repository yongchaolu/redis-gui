import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import {ErrorBoundary} from './ErrorBoundary';
import {ToastProvider} from './components/Toast';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App/>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
);
