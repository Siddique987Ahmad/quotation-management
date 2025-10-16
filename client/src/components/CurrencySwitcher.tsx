// src/components/CurrencySwitcher.tsx
import React from "react";
import { useCurrency } from "../contexts/CurrencyContext";

const CurrencySwitcher: React.FC = () => {
  const { currency, setCurrency } = useCurrency();

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value as any)}
      className="border border-gray-300 rounded-md p-2 text-sm"
    >
      <option value="USD">USD ($)</option>
      <option value="EUR">EUR (€)</option>
      <option value="PKR">PKR (₨)</option>
      <option value="GBP">GBP (£)</option>
      <option value="INR">INR (₹)</option>
    </select>
  );
};

export default CurrencySwitcher;
