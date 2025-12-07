import { createContext, useState, useCallback, useEffect } from 'react';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  arrayUnion, 
} from "firebase/firestore";
import { auth, db } from '../firebase';
import { GoogleGenerativeAI } from "@google/generative-ai";

export const CurrencyDataContext = createContext();

const API_KEY = import.meta.env.VITE_ABSTRACT_API_KEY;
const API_URL = 'https://exchange-rates.abstractapi.com/v1';
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GNEWS_KEY = import.meta.env.VITE_GNEWS_API_KEY;

// Helper: Build the nested rate matrix
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
  const [user, setUser] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [aiCache, setAiCache] = useState({});

  const currencies = ['USD', 'EUR', 'JPY', 'GBP', 'CAD', 'AUD', 'CHF', 'CNY', 'INR'];
  const mainCurrencies = ['USD', 'EUR', 'JPY', 'GBP', 'CAD', 'AUD'];

  // 1. Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setWatchlist([]); 
    });
    return () => unsubscribe();
  }, []);

  // 2. Monitor Database
  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setWatchlist(docSnap.data().watchlist || []);
        } else {
          setDoc(userRef, { watchlist: [] });
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  // --- AUTH ACTIONS ---
  const register = async (email, password, username) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: username });
      setUser({ ...userCredential.user, displayName: username });
      return { success: true };
    } catch (error) {
      console.error("Registration failed", error);
      return { success: false, message: error.message };
    }
  };

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      console.error("Login failed", error);
      return { success: false, message: error.message };
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  // --- WATCHLIST ACTIONS ---
  const saveWatchlistToDb = async (newList) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { watchlist: newList });
  };

  const toggleWatchlist = async (base, target) => {
    if (!user) {
      alert("Please sign in to save currencies.");
      return;
    }
    const exists = watchlist.find(item => item.base === base && item.target === target);
    const userRef = doc(db, "users", user.uid);

    if (exists) {
      const newList = watchlist.filter(item => item.base !== base || item.target !== target);
      await updateDoc(userRef, { watchlist: newList });
    } else {
      const newItem = { id: `${base}-${target}`, base, target, note: '' };
      await updateDoc(userRef, { watchlist: arrayUnion(newItem) });
    }
  };

  const updateWatchlistNote = (base, target, note) => {
    const newList = watchlist.map(item => 
      (item.base === base && item.target === target) ? { ...item, note } : item
    );
    setWatchlist(newList); 
    saveWatchlistToDb(newList);
  };

  // --- API ACTIONS ---
  useEffect(() => {
    const fetchLiveRates = async () => {
      if (!API_KEY) return; 
      try {
        const response = await fetch(`${API_URL}/live?api_key=${API_KEY}&base=USD`);
        const data = await response.json();
        
        if (data && data.exchange_rates) {
            const ratesFromApi = data.exchange_rates;
            ratesFromApi.USD = 1.0; 
            const rateMatrix = buildRateMatrix(ratesFromApi, mainCurrencies);
            setLiveRates(rateMatrix);
        }
      } catch (error) {
        console.error("Failed to fetch live rates:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLiveRates();
  }, []);

  const getHistoricalRate = useCallback(async (date, base, target) => {
    if (!API_KEY) return null;
    const cacheKey = `${date}-${base}-${target}`;
    if (historicalCache[cacheKey]) return historicalCache[cacheKey];

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

  // --- CHANGE 2: Updated AI Function ---
  const fetchAIInsights = useCallback(async (currency) => {
    if (!GEMINI_KEY || !GNEWS_KEY) {
      console.warn("Missing AI API Keys");
      return { sentiment: 'Unavailable', summary: 'API Keys missing. Please check .env file.' };
    }

    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `${currency}-${today}`;
    
    if (aiCache[cacheKey]) {
      return aiCache[cacheKey];
    }

    try {
      // A. Fetch News (GNews)
      const newsResponse = await fetch(
        `https://gnews.io/api/v4/search?q=${currency}+AND+(currency+OR+economy)&lang=en&max=5&sortby=publishedAt&apikey=${GNEWS_KEY}`
      );
      
      if (!newsResponse.ok) throw new Error("GNews API Error");
      const newsData = await newsResponse.json();
      
      if (!newsData.articles || newsData.articles.length === 0) {
        return { sentiment: 'Neutral', summary: 'No recent news found to analyze.', articles: [] };
      }

      const headlines = newsData.articles.map(a => `- ${a.title}`).join('\n');

      // B. Call Gemini (New SDK)
      const genAI = new GoogleGenerativeAI(GEMINI_KEY);
      
      const prompt = `
        Act as a financial analyst. Analyze these news headlines for the ${currency} currency:
        ${headlines}
        
        Provide a JSON response with:
        1. "sentiment": One word (Bullish, Bearish, or Neutral).
        2. "summary": A 2-sentence explanation of the trends affecting the currency.
        Do not use markdown formatting. Return raw JSON.
      `;

      // Get the model
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text(); // text() is a function in this SDK
      
      // Clean up the JSON string (Gemini sometimes adds markdown blocks)
      const jsonText = text.replace(/```json|```/g, '').trim();
      const analysis = JSON.parse(jsonText);

      const finalResult = {
        ...analysis,
        articles: newsData.articles
      }

      setAiCache(prev => ({ ...prev, [cacheKey]: finalResult }));
      
      return finalResult;

    } catch (error) {
      console.error("AI Analysis failed:", error);
      return { sentiment: 'Unavailable', summary: 'Could not generate analysis at this time.' };
    }
  }, [aiCache]);

  const value = {
    liveRates,
    currencies,
    getHistoricalRate,
    fetchAIInsights, 
    isLoading,
    watchlist,
    user,
    login,
    register, 
    logout,
    toggleWatchlist,
    updateWatchlistNote,
  };

  return (
    <CurrencyDataContext.Provider value={value}>
      {children}
    </CurrencyDataContext.Provider>
  );
}