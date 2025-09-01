import { ErrorBoundary } from '@/components/ErrorBoundary';
import '@/index.css';
import { enableNetworkDebugging } from '@/utils/debugNetworkRequests';
import 'flag-icons/css/flag-icons.min.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Enable network debugging in development
enableNetworkDebugging();

const container = document.getElementById('root');
if (!container) {
  throw new Error('Failed to find the root element');
}

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
