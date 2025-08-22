import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { enableNetworkDebugging } from '@/utils/debugNetworkRequests';
import '@/index.css';
import 'flag-icons/css/flag-icons.min.css';

// Enable network debugging in development
enableNetworkDebugging();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
