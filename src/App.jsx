import './App.css'
import { HashRouter, Routes, Route } from 'react-router';
import { CurrencyDataProvider } from './contexts/CurrencyDataContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Converter from './pages/Converter'; 
import History from './pages/History'; 
import Fluctuation from './pages/Fluctuation'; 
import Watchlist from './components/Watchlist';

function App() {
  return (
    <CurrencyDataProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="converter" element={<Converter />} />            
            <Route path="history" element={<History />} />            
            <Route path="fluctuation" element={<Fluctuation />} />
            <Route path="watchlist" element={<Watchlist />} />
            
          </Route>
        </Routes>
      </HashRouter>
    </CurrencyDataProvider>
  )
}

export default App