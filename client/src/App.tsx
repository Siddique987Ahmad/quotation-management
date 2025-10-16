import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { CompanyProvider } from './contexts/CompanyContext';
import AppRoutes from './routes';
import './App.css';
import { CurrencyProvider } from './contexts/CurrencyContext';

function App() {
  return (
    <Router>
      <CompanyProvider>
        <CurrencyProvider>
        <div className="App">
          <AppRoutes />
        </div>
         </CurrencyProvider>
      </CompanyProvider>
    </Router>
  );
}

export default App;