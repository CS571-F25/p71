import './App.css'
import { HashRouter, Routes, Route } from 'react-router';
import { CurrencyDataProvider } from './contexts/CurrencyDataContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Converter from './pages/Converter';
import History from './pages/History';

function App() {
  return (
    <CurrencyDataProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="converter" element={<Converter />} />
            <Route path="historical-charts" element={<History />} />
          </Route>
        </Routes>
      </HashRouter>
    </CurrencyDataProvider>
  )
}

export default App
