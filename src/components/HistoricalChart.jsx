import { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { BsGraphUp } from 'react-icons/bs';
import React from 'react';
import { Card, Form, Button, ButtonGroup, Spinner } from 'react-bootstrap';
import { CurrencyDataContext } from '../contexts/CurrencyDataContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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

function HistoricalChart() {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [timeRange, setTimeRange] = useState('1Y');
  const { currencies, getHistoricalRate } = useContext(CurrencyDataContext);
  const [chartData, setChartData] = useState({ labels: [], rates: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);
  const chartRef = useRef(null);

  const COLOR_PRIMARY = '#0d6efd';
  const COLOR_SECONDARY = '#6c757d';

  useEffect(() => {
    let isCancelled = false;
    const fetchData = async () => {
      setIsLoading(true);
      setIsChartReady(false);
      setChartData({ labels: [], rates: [] });

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
      const formattedRates = rates.map(rate => parseFloat(rate)).filter(d => !isNaN(d));

      setChartData({ labels: formattedLabels, rates: formattedRates });
      setIsChartReady(true);
      setIsLoading(false);
    };

    fetchData();

    return () => {
      isCancelled = true;
    };

  }, [fromCurrency, toCurrency, timeRange, getHistoricalRate]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#1a1a1a',
        titleFont: { weight: 'bold', size: 12 },
        bodyFont: { size: 12 },
        padding: 10,
        callbacks: {
          label: function (context) {
            return `${fromCurrency} to ${toCurrency}: ${context.parsed.y.toFixed(4)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: COLOR_SECONDARY, maxRotation: 0, autoSkip: true, maxTicksLimit: 7 },
        grid: { display: false },
      },
      y: {
        ticks: { color: COLOR_SECONDARY },
        grid: { color: 'rgba(255, 255, 255, 0.1)', borderColor: 'transparent' },
      },
    },
    elements: {
      point: { radius: 3, backgroundColor: COLOR_PRIMARY },
      line: { tension: 0.3 },
    },
  }), [fromCurrency, toCurrency]);

  const data = useMemo(() => ({
    labels: chartData.labels,
    datasets: [
      {
        label: `${fromCurrency} to ${toCurrency}`,
        data: chartData.rates,
        fill: true,
        borderColor: COLOR_PRIMARY,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 250);
          gradient.addColorStop(0, 'rgba(13, 110, 253, 0.3)');
          gradient.addColorStop(1, 'rgba(13, 110, 253, 0)');
          return gradient;
        },
        pointRadius: 3,
        pointBackgroundColor: COLOR_PRIMARY,
        pointHoverRadius: 5,
        pointBorderWidth: 0,
      },
    ],
  }), [chartData, fromCurrency, toCurrency]);

  const { currentRate, percentChange } = useMemo(() => {
    const rates = chartData.rates;
    if (!rates || rates.length < 2) return { currentRate: 0, percentChange: 0 };

    const currentRate = rates[rates.length - 1] || 0;
    const startRate = rates[0] || 0;
    const percentChange = startRate === 0 ? 0 : ((currentRate - startRate) / startRate) * 100;

    return { currentRate, percentChange };
  }, [chartData]);

  return (
    <Card bg="dark" text="white" className="border-secondary shadow-lg h-100">
      <Card.Body className="d-flex flex-column">
        <Card.Title className="d-flex align-items-center gap-2">
          <BsGraphUp className="text-primary" size={20} />
          <span>Historical Performance</span>
        </Card.Title>
        <Card.Subtitle className="mb-4 mt-2 text-muted">
          This chart shows the exchange rate between two currencies over time.
          Select two currencies and a time range to see the historical trend.
        </Card.Subtitle>

        {/* Controls Section */}
        <div className="d-flex flex-wrap gap-3 mb-4 align-items-end">
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

        {/* Chart Container */}
        <div className="flex-grow-1 position-relative" style={{ minHeight: '300px' }}>
          {isLoading && (
            <div
              className="d-flex justify-content-center align-items-center"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10,
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                borderRadius: '0.375rem',
              }}
            >
              <Spinner animation="border" variant="primary" />
            </div>
          )}

          <div style={{ height: '100%', width: '100%', opacity: isChartReady ? 1 : 0, transition: 'opacity 0.3s ease' }}>
            {chartData.rates.length > 1 ? (
              <Line ref={chartRef} options={options} data={data} />
            ) : (
              <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                <small>No data available</small>
              </div>
            )}
          </div>
        </div>

        {/* Stats Footer */}
        {!isLoading && chartData.rates.length > 1 && (
          <div className="d-flex justify-content-between mt-4 small border-top border-secondary pt-3">
            <div>
              <span className="text-muted">Most Recent Rate: </span>
              <span className="text-white fw-bold">{currentRate.toFixed(4)}</span>
            </div>
            <div>
              <span className="text-muted">Change ({timeRange}): </span>
              <span className={percentChange >= 0 ? 'text-success' : 'text-danger'}>
                {percentChange >= 0 ? '▲' : '▼'} {Math.abs(percentChange).toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default React.memo(HistoricalChart);
