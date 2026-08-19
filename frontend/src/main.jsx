import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App.jsx';
import './index.css';

axios.defaults.headers.common['Bypass-Tunnel-Reminder'] = 'true';
axios.defaults.baseURL = window.location.origin;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
