import { useContext } from 'react';
import { CurrencyDataContext } from '../contexts/CurrencyDataContext';
import { Card, Table, Spinner, Form, Button } from 'react-bootstrap';
import { FaStar, FaRegStar } from 'react-icons/fa';

export default function ExchangeRateMatrix() {
  const { liveRates, isLoading, watchlist, toggleWatchlist } = useContext(CurrencyDataContext);
  const mainCurrencies = ['USD', 'EUR', 'JPY', 'GBP', 'CAD', 'AUD'];

  const isWatched = (base, target) => {
    return watchlist.some(item => item.base === base && item.target === target);
  };

  return (
    <Card bg="dark" text="white" className="border-secondary shadow h-100">
      <Card.Body>
        <Card.Title className="mb-4">Top Currency Exchange Rate</Card.Title>

        {isLoading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
            <Spinner animation="border" variant="primary" />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <Table bordered hover variant="dark" size="sm" responsive className="align-middle">
              <thead>
                <tr>
                  <th style={{ backgroundColor: '#1e293b' }}>From / To</th>
                  {mainCurrencies.map((curr) => (
                    <th key={curr} className="text-center" style={{ backgroundColor: '#1e293b' }}>
                      {curr}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mainCurrencies.map((fromCurr) => (
                  <tr key={fromCurr}>
                    <td className="fw-bold" style={{ backgroundColor: '#1e293b' }}>
                      {fromCurr}
                    </td>
                    {mainCurrencies.map((toCurr) => {
                      const rate = liveRates ? (liveRates[fromCurr]?.[toCurr] || 1) : 0;
                      const isBase = fromCurr === toCurr;
                      
                      // Check if this specific pair is in the watchlist
                      const watched = isWatched(fromCurr, toCurr);

                      return (
                        <td
                          key={toCurr}
                          className="text-center position-relative"
                          style={{
                            backgroundColor: isBase ? '#1e3a5f' : '#334155',
                            fontWeight: isBase ? 'bold' : 'normal',
                          }}
                        >
                          {rate.toFixed(4)}
                          
                          {/* Add Star Button (Only if not base currency) */}
                          {!isBase && (
                          <Button
                            variant="link"
                            // IMPROVEMENT: Removed 'p-0' to give it padding (hit area). 
                            // Increased perceptible affordance with larger size.
                            className="text-warning position-absolute top-50 end-0 translate-middle-y me-1 d-flex align-items-center justify-content-center"
                            style={{ 
                              opacity: watched ? 1 : 0.2, 
                              width: '32px',   // Explicit touch target size
                              height: '32px', 
                            }}
                            // Add hover effect via inline style or CSS class
                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.2)'; e.currentTarget.style.opacity = '1'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; e.currentTarget.style.opacity = watched ? '1' : '0.2'; }}
                            onClick={() => toggleWatchlist(fromCurr, toCurr)}
                            title={watched ? "Remove from Watchlist" : "Add to Watchlist"}
                            aria-label={watched ? `Stop watching ${fromCurr} to ${toCurr}` : `Watch ${fromCurr} to ${toCurr}`}
                          >
                            {/* Increased icon size from 10 to 14 for better visibility */}
                            {watched ? <FaStar size={14} /> : <FaRegStar size={14} />}
                          </Button>
                        )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}