import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('Main.tsx - Iniciando aplicação');
createRoot(document.getElementById("root")!).render(<App />);
console.log('Main.tsx - App renderizada');
