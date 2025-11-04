import { createContext, useState, useCallback, useEffect } from 'react';

export const CurrencyDataContext = createContext();

const API_KEY = import.meta.env.VITE_ABSTRACT_API_KEY;
const API_URL = 'https://exchange-rates.abstractapi.com/v1';

const buildRateMatrix = (baseRates, mainCurrencies) => {
  const matrix = {};
  const usdRates = baseRates; 
  
  for (const fromCurr of mainCurrencies) {
    matrix[fromCurr] = {};
    for (const toCurr of mainCurrencies) {
      const rate = (1 / usdRates[fromCurr]) * usdRates[toCurr];
      matrix[fromCurr][toCurr] = rate;
    }
  }
  return matrix;
};

export function CurrencyDataProvider({ children }) {
  const [liveRates, setLiveRates] = useState(null); 
  const [historicalCache, setHistoricalCache] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const currencies = ['USD', 'EUR', 'JPY', 'GBP', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];
  const mainCurrencies = ['USD', 'EUR', 'JPY', 'GBP', 'CAD', 'AUD'];

  useEffect(() => {
    const fetchLiveRates = async () => {
      try {
        const response = await fetch(`${API_URL}/live?api_key=${API_KEY}&base=USD`);
        const data = await response.json();
        const ratesFromApi = data.exchange_rates;
        ratesFromApi.USD = 1.0;
        const rateMatrix = buildRateMatrix(data.exchange_rates, mainCurrencies);
        setLiveRates(rateMatrix);
        
      } catch (error) {
        console.error("Failed to fetch live rates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveRates();
  }, []);


  const getHistoricalRate = useCallback(async (date, base, target) => {
    const cacheKey = `${date}-${base}-${target}`;
    
    if (historicalCache[cacheKey]) {
      return historicalCache[cacheKey];
    }

    try {
      const response = await fetch(`${API_URL}/convert?api_key=${API_KEY}&base=${base}&target=${target}&date=${date}&base_amount=1`);
      const data = await response.json();

      if (data.exchange_rate) {
        const rate = data.exchange_rate;
        setHistoricalCache(prev => ({ ...prev, [cacheKey]: rate }));
        return rate;
      }
    } catch (error) {
      console.error("Failed to fetch historical rate:", error);
      return null;
    }
  }, [historicalCache]);

  const value = {
    liveRates,
    currencies,
    getHistoricalRate,
    isLoading,
  };

  return (
    <CurrencyDataContext.Provider value={value}>
      {children}
    </CurrencyDataContext.Provider>
  );
}