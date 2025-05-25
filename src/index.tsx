/**
 * @file index.tsx
 * @description Main entry point for the React application, responsible for rendering the root component.
 * @author Harsha Attray
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
