import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {ErrorBoundary} from './components/ErrorBoundary.tsx';
import {ToastProvider} from './components/Toast.tsx';
import {AuthProvider} from './contexts/AuthContext.tsx';
import {ClinicalNotesProvider} from './contexts/ClinicalNotesContext.tsx';
import {AIAssistantProvider} from './contexts/AIAssistantContext.tsx';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <ClinicalNotesProvider>
            <AIAssistantProvider>
              <App />
            </AIAssistantProvider>
          </ClinicalNotesProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>,
);
