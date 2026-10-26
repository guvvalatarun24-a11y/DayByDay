import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
<<<<<<< HEAD

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', {scope: '/', updateViaCache: 'none'})
      .then((registration) => registration.update())
      .catch((error: unknown) => {
        console.error('Service worker registration or update failed:', error);
      });
  });
}
=======
>>>>>>> a1ebbdf4ee6c5ba1b1354632d1633ba619606d27
