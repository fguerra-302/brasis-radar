import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeBranding } from './config/branding'

console.log('Main.tsx - Iniciando aplicação');

// Inicializar configurações de branding
initializeBranding();

createRoot(document.getElementById("root")!).render(<App />);
console.log('Main.tsx - App renderizada');
