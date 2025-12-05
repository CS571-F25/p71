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
        <Card.Title className="mb-4">Exchange Rate Matrix</Card.Title>

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
                              className="p-0 ms-2 text-warning position-absolute top-50 end-0 translate-middle-y me-1"
                              style={{ opacity: watched ? 1 : 0.3 }}
                              onClick={() => toggleWatchlist(fromCurr, toCurr)}
                              title={watched ? "Remove from Watchlist" : "Add to Watchlist"}
                            >
                              {watched ? <FaStar size={10} /> : <FaRegStar size={10} />}
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