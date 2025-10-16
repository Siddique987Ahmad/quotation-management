import React, { createContext, useContext, useEffect, useState } from "react";

type Currency = "USD" | "EUR" | "PKR" | "GBP" | "INR";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  format: (value: number) => string;
}

// Map currency to locale for proper formatting
const currencyLocaleMap: Record<Currency, string> = {
  USD: "en-US",
  EUR: "de-DE",
  PKR: "ur-PK",
  GBP: "en-GB",
  INR: "en-IN",
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>("USD");

  // Load saved currency from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("currency") as Currency | null;
    if (saved) {
      setCurrencyState(saved);
    }
  }, []);

  // Save to localStorage whenever currency changes
  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("currency", c);
  };

  const format = (value: number): string => {
    return new Intl.NumberFormat(currencyLocaleMap[currency], {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) throw new Error("useCurrency must be used inside CurrencyProvider");
  return context;
};
