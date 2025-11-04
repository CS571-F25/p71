import './App.css'
import { HashRouter, Routes, Route } from 'react-router';
import { CurrencyDataProvider } from './contexts/CurrencyDataContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ConverterPage from './pages/ConverterPage';

function App() {
  return (
    <CurrencyDataProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="converter" element={<ConverterPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </CurrencyDataProvider>
  )
}

export default App
