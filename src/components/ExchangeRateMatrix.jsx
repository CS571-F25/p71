import { useContext } from 'react';
import { CurrencyDataContext } from '../contexts/CurrencyDataContext';
import { Card, Table, Spinner } from 'react-bootstrap';

export default function ExchangeRateMatrix() {
  const { liveRates, isLoading } = useContext(CurrencyDataContext); 

  const mainCurrencies = ['USD', 'EUR', 'JPY', 'GBP', 'CAD', 'AUD'];

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
            <Table bordered hover variant="dark" size="sm" responsive>
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
                      return (
                        <td
                          key={toCurr}
                          className="text-center"
                          style={{
                            backgroundColor: isBase ? '#1e3a5f' : '#334155',
                            fontWeight: isBase ? 'bold' : 'normal',
                          }}
                        >
                          {rate.toFixed(4)}
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