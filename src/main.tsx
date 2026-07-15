import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Add cross-origin and dynamic iframe script error interceptor
if (typeof window !== 'undefined') {
  window.onerror = function (message, source, lineno, colno, error) {
    const msgStr = String(message || '');
    const srcStr = String(source || '');
    if (
      msgStr.includes('Script error') || 
      msgStr === 'Script error.' || 
      srcStr.includes('snap.js') || 
      srcStr.includes('midtrans')
    ) {
      console.warn('Silently intercepted and suppressed cross-origin script error:', { message, source, lineno, colno, error });
      return true; // Return true to prevent error reporting/bubbling up
    }
    return false;
  };

  window.addEventListener('error', (event) => {
    const msgStr = String(event.message || '');
    const srcStr = String(event.filename || '');
    if (
      msgStr.includes('Script error') || 
      msgStr === 'Script error.' || 
      srcStr.includes('snap.js') || 
      srcStr.includes('midtrans')
    ) {
      event.preventDefault();
      event.stopPropagation();
      console.warn('Event listener intercepted cross-origin error:', event);
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event.reason || '');
    if (reasonStr.includes('Script error') || reasonStr.includes('snap.js') || reasonStr.includes('midtrans')) {
      event.preventDefault();
      event.stopPropagation();
      console.warn('Silently intercepted unhandled rejection:', event.reason);
    } else {
      console.warn('Unhandled promise rejection:', event.reason);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

