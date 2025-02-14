import React from 'react';
import ReactDOM from 'react-dom/client';
import AdminApp  from './AdminApp';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AdminApp />
    </React.StrictMode>
  );
} else {
  console.error('Root element not found');
}
