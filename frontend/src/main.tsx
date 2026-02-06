import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App';

// --- ADICIONE ESTAS IMPORTAÇÕES ---
import { polyfill } from "mobile-drag-drop";
import { scrollBehaviourDragImageTranslateOverride } from "mobile-drag-drop/scroll-behaviour";
import "mobile-drag-drop/default.css";
// Importação opcional do CSS do polyfill para estilos padrão de arrasto
import "mobile-drag-drop/default.css";

// Inicializa o suporte a Drag and Drop em dispositivos móveis
polyfill({
  // Usando o nome correto que o seu VS Code/TS sugeriu
  dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride,
});


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
