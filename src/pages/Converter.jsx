import { useState, useMemo, useRef, useEffect, useContext } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { BsCurrencyExchange } from 'react-icons/bs';
import { CurrencyDataContext } from '../contexts/CurrencyDataContext';
import { Container, Card, Form, Button, Row, Col, Spinner } from 'react-bootstrap';

export default function Converter() {
  const { liveRates, currencies, getHistoricalRate } = useContext(CurrencyDataContext);

  const [amount, setAmount] = useState('100.00');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [historicalDate, setHistoricalDate] = useState('');
  
  const [conversionResult, setConversionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const amountInputRef = useRef(null);

  useEffect(() => {
    amountInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const calculateConversion = async () => {
      if (!liveRates && !historicalDate) return; 

      const numAmount = parseFloat(amount) || 0;
      setIsLoading(true);

      let rate = 1;

      if (historicalDate) {
        const historicalRate = await getHistoricalRate(historicalDate, fromCurrency, toCurrency);
        rate = historicalRate || 0;
      } else {
        rate = liveRates[fromCurrency]?.[toCurrency] || 1;
      }

      const converted = numAmount * rate;
      setConversionResult(converted.toFixed(2));
      setIsLoading(false);
    };

    calculateConversion();
  }, [amount, fromCurrency, toCurrency, historicalDate, liveRates, getHistoricalRate]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };
  const handleAmountChange = (value) => setAmount(value);
  const handleFromChange = (value) => setFromCurrency(value);
  const handleToChange = (value) => setToCurrency(value);

  return (
    <Container className="py-4" style={{ maxWidth: '900px' }}>
      <h2 className="mb-4 text-white">Currency Converter</h2>

      <Card bg="dark" text="white" className="border-secondary shadow">
        <Card.Body>
          <div className="d-flex align-items-center gap-2 mb-4">
            <BsCurrencyExchange className="text-primary" size={24} />
            <Card.Title className="mb-0">Live Converter</Card.Title>
          </div>

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                ref={amountInputRef}
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                style={{ backgroundColor: '#334155', color: 'white', borderColor: '#475569' }}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Historical Date (Optional)</Form.Label>
              <Form.Control
                type="date"
                value={historicalDate}
                onChange={(e) => setHistoricalDate(e.target.value)}
                style={{ backgroundColor: '#334155', color: 'white', borderColor: '#475569' }}
              />
              <Form.Text className="text-muted">
                Leave empty for current rates or select a date for historical conversion
              </Form.Text>
            </Form.Group>

            <Row className="align-items-center">
              <Col>
                <Form.Group>
                  <Form.Label>From</Form.Label>
                  <Form.Select
                    value={fromCurrency}
                    onChange={(e) => handleFromChange(e.target.value)}
                    style={{ backgroundColor: '#334155', color: 'white', borderColor: '#475569' }}
                  >
                    {currencies.map((curr) => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col xs="auto" className="mt-4">
                <Button
                  variant="primary"
                  onClick={handleSwap}
                  className="rounded"
                >
                  <ArrowLeftRight size={20} />
                </Button>
              </Col>

              <Col>
                <Form.Group>
                  <Form.Label>To</Form.Label>
                  <Form.Select
                    value={toCurrency}
                    onChange={(e) => handleToChange(e.target.value)}
                    style={{ backgroundColor: '#334155', color: 'white', borderColor: '#475569' }}
                  >
                    {currencies.map((curr) => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <div className="mt-4 pt-4 border-top border-secondary">
                <div className="fs-4 fw-bold text-center mb-0" style={{ minHeight: '38px' }}>
                {isLoading ? (
                        <Spinner animation="border" variant="primary" size="sm" />
                ) : (
                        `${amount || 0} ${fromCurrency} = ${conversionResult} ${toCurrency}`
                )}
                </div>
             </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
