import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { settingsAPI } from '../services/api';
import { CompanySettings } from '../types';

interface CompanyContextType {
  companySettings: CompanySettings | null;
  loading: boolean;
  error: string | null;
  refreshCompanySettings: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastFetchRef = useRef<number>(0);

  const refreshCompanySettings = useCallback(async () => {
    const now = Date.now();
    
    // Prevent too many requests
    if (now - lastFetchRef.current < 2000) {
      console.log('Skipping request - too soon after last fetch');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      lastFetchRef.current = now;
      
      const response = await settingsAPI.getCompany();
      
      if (response.data.success && response.data.data) {
        setCompanySettings(response.data.data);
      } else {
        console.warn('No company settings data received');
        // Provide fallback
        setCompanySettings({
          name: 'QuoteFlow',
          email: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: 'Pakistan',
          phone: '',
          website: '',
          taxId: '',
          logo: '',
        });
      }
    } catch (error: any) {
      console.error('Failed to load company settings:', error);
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        setError('Too many requests. Please wait a moment.');
        return;
      }

      // Provide fallback data for any error
      setCompanySettings({
        name: 'QuoteFlow',
        email: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Pakistan',
        phone: '',
        website: '',
        taxId: '',
        logo: '',
      });
      
      // Don't set error for 401 (expected on public endpoint)
      if (error.response?.status !== 401) {
        setError(error instanceof Error ? error.message : 'Failed to load company settings');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Always fetch company settings on mount (no auth check needed)
  useEffect(() => {
    refreshCompanySettings();
  }, [refreshCompanySettings]);

  return (
    <CompanyContext.Provider value={{
      companySettings,
      loading,
      error,
      refreshCompanySettings
    }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};