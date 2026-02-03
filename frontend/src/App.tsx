import { AuthProvider } from './context/AuthContext';
import { AppRoutes } from './rotas/routes';
import { ToastProvider } from './context/ToastContext';

// Importações de CSS global podem ficar aqui ou no main.tsx
import "primereact/resources/themes/lara-light-blue/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import './index.css';

function App() {
  return (
    <ToastProvider>
      <AuthProvider> 
          <AppRoutes /> {/* O Login está aqui dentro */}
`    </AuthProvider>`
    </ToastProvider>
  )
}

export default App
