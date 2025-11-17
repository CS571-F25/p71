import { useState, useEffect, useContext, useMemo } from 'react';
import { BsGraphUp } from 'react-icons/bs';
import React from 'react';
import { Card, Form, Button, ButtonGroup, Spinner, Table, Row, Col } from 'react-bootstrap';
import { CurrencyDataContext } from '../contexts/CurrencyDataContext';

function getDatesForRange(range) {
  const dates = [];
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth(), 0);

  let points = 12; // Default for 1Y
  let interval = 'month';

  if (range === '1M') {
    points = 4; // 4 weeks
    interval = 'week';
  } else if (range === '6M') {
    points = 6; // 6 months
    interval = 'month';
  }

  for (let i = 0; i < points; i++) {
    const date = new Date(startDate.getTime());
    if (interval === 'week') {
      date.setDate(startDate.getDate() - (i * 7));
    } else {
      date.setMonth(startDate.getMonth() - i);
    }
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates.reverse();
}

function HistoricalStats() {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [timeRange, setTimeRange] = useState('1Y');
  const { currencies, getHistoricalRate } = useContext(CurrencyDataContext);
  const [chartData, setChartData] = useState({ labels: [], rates: [] });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const fetchData = async () => {
      setIsLoading(true);

      if (!getHistoricalRate) {
        setIsLoading(false);
        return;
      }

      const datesToFetch = getDatesForRange(timeRange);
      const promises = datesToFetch.map(date =>
        getHistoricalRate(date, fromCurrency, toCurrency)
      );

      const rates = await Promise.all(promises);

      if (isCancelled) {
        return;
      }

      const formattedLabels = datesToFetch.map(date =>
        new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      );

      const formattedRates = rates.map(rate => {
        const val = parseFloat(rate);
        return isNaN(val) ? null : val;
      });

      setChartData({ labels: formattedLabels, rates: formattedRates });
      setIsLoading(false);
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [fromCurrency, toCurrency, timeRange, getHistoricalRate]);

  const { currentRate, percentChange, periodHigh, periodLow } = useMemo(() => {
    const rates = chartData.rates;
    if (!rates || rates.length === 0) {
      return { currentRate: 0, percentChange: 0, periodHigh: 0, periodLow: 0 };
    }

    const validRates = rates.filter(r => r !== null);
    if (validRates.length === 0) {
      return { currentRate: 0, percentChange: 0, periodHigh: 0, periodLow: 0 };
    }
    
    const currentRate = validRates[validRates.length - 1] || 0;
    const startRate = validRates[0] || 0;
    const periodHigh = Math.max(...validRates);
    const periodLow = Math.min(...validRates);
    
    const percentChange = (validRates.length < 2 || startRate === 0) 
      ? 0 
      : ((currentRate - startRate) / startRate) * 100;

    return { currentRate, percentChange, periodHigh, periodLow };
  }, [chartData]);

  const tableData = useMemo(() => {
    return chartData.labels
      .map((label, index) => ({
        label,
        rate: chartData.rates[index],
      }))
      .filter(data => data.rate !== null)
      .reverse();
  }, [chartData]);

  return (
    <Card bg="dark" text="white" className="border-secondary shadow-lg h-100">
      <Card.Body className="d-flex flex-column">
        {/* --- Card Header and Controls --- */}
        <Card.Title className="d-flex align-items-center gap-2">
          <BsGraphUp className="text-primary" size={20} />
          <span>Historical Performance</span>
        </Card.Title>
        <div className="d-flex flex-wrap gap-3 my-4 align-items-end">
          <div className="d-flex gap-2 align-items-center">
            <Form.Group className="mb-0">
              <Form.Select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                data-bs-theme="dark"
                size="sm"
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <span className="text-muted">/</span>
            <Form.Group className="mb-0">
              <Form.Select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                data-bs-theme="dark"
                size="sm"
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </div>
          <ButtonGroup size="sm" className="ms-auto">
            {['1M', '6M', '1Y'].map((range) => (
              <Button
                key={range}
                variant={timeRange === range ? 'primary' : 'outline-secondary'}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </ButtonGroup>
        </div>

        {/* --- (Stats + Table) --- */}
        <div className="flex-grow-1 position-relative">
          {isLoading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
              <Spinner animation="border" variant="primary" />
            </div>
          ) : (
            <div>
              {/* --- Key Statistic Cards --- */}
              <Row className="g-3 mb-4">
                <Col md={6} lg={3}>
                  <Card bg="dark-subtle" text="white" className="border-secondary">
                    <Card.Body>
                      <Card.Subtitle className="text-muted small mb-1">Recent Rate</Card.Subtitle>
                      <Card.Title className="fw-bold">{currentRate.toFixed(4)}</Card.Title>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} lg={3}>
                  <Card bg="dark-subtle" text="white" className="border-secondary">
                    <Card.Body>
                      <Card.Subtitle className="text-muted small mb-1">Change ({timeRange})</Card.Subtitle>
                      <Card.Title className={percentChange >= 0 ? 'text-success' : 'text-danger'}>
                        {percentChange >= 0 ? '▲' : '▼'} {Math.abs(percentChange).toFixed(2)}%
                      </Card.Title>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} lg={3}>
                  <Card bg="dark-subtle" text="white" className="border-secondary">
                    <Card.Body>
                      <Card.Subtitle className="text-muted small mb-1">Period High</Card.Subtitle>
                      <Card.Title className="fw-bold">{periodHigh.toFixed(4)}</Card.Title>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6} lg={3}>
                  <Card bg="dark-subtle" text="white" className="border-secondary">
                    <Card.Body>
                      <Card.Subtitle className="text-muted small mb-1">Period Low</Card.Subtitle>
                      <Card.Title className="fw-bold">{periodLow.toFixed(4)}</Card.Title>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* --- Simple Data Table --- */}
              <Card.Subtitle className="text-muted mb-2">Historical Data</Card.Subtitle>
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {tableData.length > 0 ? (
                  <Table striped borderless hover variant="dark" size="sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Rate (1 {fromCurrency} = X {toCurrency})</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map(({ label, rate }) => (
                        <tr key={label}>
                          <td>{label}</td>
                          <td>{rate.toFixed(4)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <div className="d-flex justify-content-center align-items-center h-100 text-muted small p-4">
                    No data available
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}

export default React.memo(HistoricalStats);