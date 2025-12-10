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
import Sentiment from 'sentiment';

export const CurrencyDataContext = createContext();

const API_KEY = import.meta.env.VITE_ABSTRACT_API_KEY;
const API_URL = 'https://exchange-rates.abstractapi.com/v1';
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
      if (!API_KEY) {
        setIsLoading(false);
        return; 
      }
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

  // --- NEW LOCAL SENTIMENT FUNCTION ---
  const fetchAIInsights = useCallback(async (currency) => {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `${currency}-${today}`;
    
    if (aiCache[cacheKey]) return aiCache[cacheKey];

    if (!GNEWS_KEY) {
       console.warn("Missing GNews Key");
       return { sentiment: 'Unavailable', summary: 'GNews API Key is missing.' };
    }

    try {
      // 1. Fetch News
      const gnewsUrl = `https://gnews.io/api/v4/search?q=${currency}+AND+(currency+OR+economy)&lang=en&max=5&sortby=publishedAt&apikey=${GNEWS_KEY}`;
      const newsResponse = await fetch(`https://corsproxy.io/?${encodeURIComponent(gnewsUrl)}`);
      
      if (!newsResponse.ok) throw new Error("GNews API Error");
      const newsData = await newsResponse.json();

      if (!newsData.articles || newsData.articles.length === 0) {
        return { sentiment: 'Neutral', summary: 'No recent news found to analyze.', articles: [] };
      }

      // 2. Perform Enhanced Local Analysis
      const sentiment = new Sentiment();
      let totalScore = 0;
      let allPositiveWords = [];
      let allNegativeWords = [];

      newsData.articles.forEach(article => {
        const text = `${article.title} ${article.description}`;
        const result = sentiment.analyze(text);
        
        totalScore += result.score;
        
        // Collect the specific words that triggered the score
        if (result.positive) allPositiveWords.push(...result.positive);
        if (result.negative) allNegativeWords.push(...result.negative);
      });

      // Helper to get unique top words (prevents repeating 'gain, gain, gain')
      const getTopWords = (words) => {
         const unique = [...new Set(words)];
         return unique.slice(0, 3).join("', '"); // Get top 3 unique words
      };

      // 3. Determine Label & Construct Dynamic Summary
      let sentimentLabel = 'Neutral';
      let explanation = "Market signals appear mixed with no strong directional indicators in the headlines.";

      if (totalScore > 0) {
        sentimentLabel = 'Bullish';
        const words = getTopWords(allPositiveWords);
        if (words) {
            explanation = `Positive sentiment is being driven by mentions of keywords such as '${words}' in recent coverage.`;
        } else {
            explanation = "General news coverage is positive, though specific key drivers were varied.";
        }
      } 
      else if (totalScore < 0) {
        sentimentLabel = 'Bearish';
        const words = getTopWords(allNegativeWords);
        if (words) {
            explanation = `Negative sentiment is weighing on the market, highlighted by terms like '${words}'.`;
        } else {
            explanation = "Recent headlines indicate downward pressure or uncertainty in the market.";
        }
      }

      const summary = `Analysis of ${newsData.articles.length} recent articles suggests a ${sentimentLabel} trend (Score: ${totalScore}). ${explanation}`;

      const finalResult = {
        sentiment: sentimentLabel,
        summary: summary,
        articles: newsData.articles
      };

      setAiCache(prev => ({ ...prev, [cacheKey]: finalResult }));
      
      return finalResult;

    } catch (error) {
      console.error("Analysis failed:", error);
      return { sentiment: 'Unavailable', summary: 'Could not generate analysis at this time.' };
    }
  }, [aiCache]);

  const value = {
    liveRates,
    currencies,
    mainCurrencies,
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