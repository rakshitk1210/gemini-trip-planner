import React from 'react';
import ReactDOM from 'react-dom/client';
import { APIProvider } from '@vis.gl/react-google-maps';
import App from './App.jsx';
import './styles.css';
import { MAPS_API_KEY } from './constants.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <APIProvider apiKey={MAPS_API_KEY} libraries={['places']}>
    <App />
  </APIProvider>
);
