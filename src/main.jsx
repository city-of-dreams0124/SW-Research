import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// StrictMode is intentionally NOT used: it double-invokes renders in development
// and would corrupt the re-render counts.
createRoot(document.getElementById('root')).render(<App />);
