import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { ClerkProvider } from '@clerk/clerk-react';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter } from 'react-router-dom';

console.log('Environment variables:', {
  all: process.env,
  clerk: process.env.REACT_APP_CLERK_PUBLISHABLE_KEY,
  node_env: process.env.NODE_ENV
});

const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

console.log('Clerk key:', PUBLISHABLE_KEY);

if (!PUBLISHABLE_KEY) {
  console.error('Clerk key is missing or undefined');
  throw new Error('Missing Clerk Publishable Key');
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      signInUrl="/login"
      signUpUrl="/login"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
