import { useState, useContext } from 'react';
import { IoAnalyticsSharp } from 'react-icons/io5';
import React from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Spinner } from 'react-bootstrap';
import { CurrencyDataContext } from '../contexts/CurrencyDataContext';
import TrendIndicator from '../components/TrendIndicator';

function Fluctuation() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCurrencies, setSelectedCurrencies] = useState(['EUR', 'JPY', 'GBP']);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { currencies, getHistoricalRate } = useContext(CurrencyDataContext);
  const baseCurrency = 'USD'; 

  // --- Date Restriction Logic ---
  // Restrict selection to yesterday to ensure API data exists
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const maxDate = yesterday.toISOString().split('T')[0];

  // --- Helper for API Rate Limiting ---
  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  const handleCalculate = async () => {
    setIsLoading(true);
    setResults([]); // Clear previous results

    const newResults = [];

    // --- SEQUENTIAL FETCHING LOOP ---
    // We use a for...of loop instead of map/Promise.all to ensure
    // requests happen one by one, respecting the 1 req/sec limit.
    for (const currency of selectedCurrencies) {
      
      // 1. Fetch Start Rate
      const startRate = await getHistoricalRate(startDate, baseCurrency, currency);
      
      // WAIT: Delay 1.1s to respect API limit
      await delay(1100); 

      // 2. Fetch End Rate
      const endRate = await getHistoricalRate(endDate, baseCurrency, currency);
      
      // WAIT: Delay 1.1s before next currency loop
      await delay(1100);

      // 3. Validation & Calculation
      // We check if both rates exist to avoid NaN errors
      if (startRate && endRate) {
        const start = parseFloat(startRate);
        const end = parseFloat(endRate);
        const change = end - start;
        const changePct = start !== 0 ? (change / start) * 100 : 0;

        newResults.push({
          currency: currency,
          startRate: start,
          endRate: end,
          change: change,
          changePct: changePct,
        });
      }
    }

    setResults(newResults);
    setIsLoading(false);
  };

  const handleCurrencyToggle = (currency) => {
    setSelectedCurrencies((prev) =>
      prev.includes(currency)
        ? prev.filter((c) => c !== currency)
        : [...prev, currency]
    );
  };

  return (
    <Container fluid className="px-4 py-5">
      <div className="d-flex align-items-center gap-3 mb-4">
        <IoAnalyticsSharp className="text-primary" size={28} />
        <h1 className="text-white mb-0">Currency Fluctuation Analysis</h1>
      </div>

      <Row className="mb-4">
        <Col>
          <Card className="border-secondary shadow-lg" bg="dark" text="white">
            <Card.Body>
              <Row className="mb-4">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-muted">Start Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="bg-dark border-secondary text-white"
                      data-bs-theme="dark"
                      max={maxDate} 
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="fw-semibold text-muted">End Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-dark border-secondary text-white"
                      data-bs-theme="dark"
                      max={maxDate}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-4">
                <Form.Label className="fw-semibold text-muted">Select Currencies (Base: {baseCurrency})</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {currencies.map((currency) => (
                    <Button
                      key={currency}
                      variant={selectedCurrencies.includes(currency) ? 'primary' : 'outline-secondary'}
                      size="sm"
                      onClick={() => handleCurrencyToggle(currency)}
                    >
                      {currency}
                    </Button>
                  ))}
                </div>
              </Form.Group>

              <Button
                variant="primary"
                size="lg"
                className="w-100 d-flex justify-content-center align-items-center gap-2"
                onClick={handleCalculate}
                disabled={isLoading || selectedCurrencies.length === 0 || !startDate || !endDate}
              >
                {isLoading && <Spinner animation="border" size="sm" />}
                {isLoading ? 'Calculating...' : 'Calculate Fluctuation'}
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {results.length > 0 && (
        <Row>
          <Col>
            <Card className="border-secondary shadow-lg" bg="dark" text="white">
              <Card.Body>
                <Card.Title className="mb-4">Fluctuation Results</Card.Title>
                <div className="table-responsive">
                  <Table hover variant="dark" className="mb-0 align-middle">
                    <thead>
                      <tr>
                        <th>Currency</th>
                        <th className="text-end">Start Rate</th>
                        <th className="text-end">End Rate</th>
                        <th className="text-end">Change</th>
                        <th className="text-end">Change %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result) => (
                        <tr key={result.currency}>
                          <td className="fw-bold text-white">{result.currency}</td>
                          <td className="text-end text-white">{result.startRate.toFixed(4)}</td>
                          <td className="text-end text-white">{result.endRate.toFixed(4)}</td>
                          <td className={`text-end fw-medium ${result.change >= 0 ? 'text-success' : 'text-danger'}`}>
                            {result.change >= 0 ? '+' : ''}{result.change.toFixed(4)}
                          </td>
                          
                          <td className="text-end">
                            <TrendIndicator value={result.changePct} />
                          </td>
                          
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}

export default React.memo(Fluctuation);