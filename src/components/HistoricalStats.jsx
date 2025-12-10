import { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { BsGraphUp } from 'react-icons/bs';
import React from 'react';
import { Card, Form, Button, ButtonGroup, Row, Col, Table, Alert } from 'react-bootstrap';
import { CurrencyDataContext } from '../contexts/CurrencyDataContext';
import Loader from './Loader';
import TrendIndicator from './TrendIndicator';

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
  // Start from the last day of the previous month
  const startDate = new Date(today.getFullYear(), today.getMonth(), 0);

  let points = 12;
  let interval = 'month';

  if (range === '3M') {
    points = 3;
    interval = 'month';
  } else if (range === '6M') {
    points = 6;
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

// Helper for delays
const delay = (ms) => new Promise(res => setTimeout(res, ms));

function HistoricalStats() {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  
  // --- OPTIMIZATION: Default to '3M' ---
  // This reduces initial API calls from 12 to 3.
  const [timeRange, setTimeRange] = useState('3M');
  
  const { currencies, getHistoricalRate } = useContext(CurrencyDataContext);
  const [chartData, setChartData] = useState({ labels: [], rates: [] });
  const [isLoading, setIsLoading] = useState(false);  
  const [isChartReady, setIsChartReady] = useState(false);
  const [showTip, setShowTip] = useState(true);
  const chartRef = useRef(null);
  const COLOR_PRIMARY = '#0d6efd';
  const COLOR_SECONDARY = '#6c757d';

  // --- 1. Main Data Fetching Logic ---
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
      const rates = [];

      // --- CHANGE: Use a loop instead of Promise.all ---
      for (const date of datesToFetch) {
        if (isCancelled) return;

        try {
          // Fetch one rate
          const rate = await getHistoricalRate(date, fromCurrency, toCurrency);
          rates.push(rate);

          // Wait 1.1 seconds before the next request to respect API limits
          // (AbstractAPI free tier is usually 1 request per second)
          if (datesToFetch.indexOf(date) !== datesToFetch.length - 1) {
             await delay(1100); 
          }
        } catch (error) {
          console.error(`Failed to fetch for ${date}`, error);
          rates.push(null); // Push null so we keep the index alignment
        }
      }

      if (isCancelled) return;

      const formattedLabels = datesToFetch.map(date =>
        new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      );

      const formattedRates = rates.map(rate => {
        const val = parseFloat(rate);
        return isNaN(val) ? null : val;
      }).filter(val => val !== null);

      setChartData({ labels: formattedLabels, rates: formattedRates });
    };

    fetchData();
    return () => { isCancelled = true; };
  }, [fromCurrency, toCurrency, timeRange, getHistoricalRate]);

  // --- 2. Background Prefetch Logic ---
  useEffect(() => {
    // Only run this if we are currently on the default '3M' view
    if (timeRange !== '3M' || !getHistoricalRate) return;

    let isCancelled = false;

    const prefetchData = async () => {
      // Wait 2 seconds to let the main chart render and the UI settle
      await delay(2000); 
      if (isCancelled) return;

      // Get the dates for the full '1Y' view
      const allDates = getDatesForRange('1Y');
      
      for (const date of allDates) {
        if (isCancelled) break;
        await getHistoricalRate(date, fromCurrency, toCurrency);
        await delay(1200); // Small delay between background requests
      }
    };

    prefetchData();

    return () => { isCancelled = true; };
  }, [fromCurrency, toCurrency, timeRange, getHistoricalRate]);


  // --- Stats Calculation ---
  const stats = useMemo(() => {
    const rates = chartData.rates;
    if (!rates || rates.length === 0) {
      return { currentRate: 0, percentChange: 0, periodHigh: 0, periodLow: 0 };
    }
    const currentRate = rates[rates.length - 1] || 0;
    const startRate = rates[0] || 0;
    const periodHigh = Math.max(...rates);
    const periodLow = Math.min(...rates);
    const percentChange = (rates.length < 2 || startRate === 0) 
      ? 0 
      : ((currentRate - startRate) / startRate) * 100;

    return { currentRate, percentChange, periodHigh, periodLow };
  }, [chartData]);

  // --- Chart Options ---
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800, 
      onComplete: () => {
        setIsChartReady(true);
        setIsLoading(false);
      }
    },
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
          label: (context) => `${fromCurrency} to ${toCurrency}: ${context.parsed.y.toFixed(4)}`
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

  const chartJsData = useMemo(() => ({
    labels: chartData.labels,
    datasets: [{
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
      pointRadius: 4,
      pointHoverRadius: 6,
    }],
  }), [chartData, fromCurrency, toCurrency]);

  return (
    <Card bg="dark" text="white" className="border-secondary shadow-lg h-100">
      <Card.Body className="d-flex flex-column">
        
        {/* HEADER */}
        <Card.Title className="d-flex align-items-center gap-2">
          <BsGraphUp className="text-primary" size={20} />
          <span>Historical Analysis</span>
        </Card.Title>
        <Card.Subtitle className="mb-4 mt-2 text-white">
          Analyze exchange rate trends and volatility over time.
        </Card.Subtitle>

        {showTip && (
          <Alert variant="info" onClose={() => setShowTip(false)} dismissible className="mb-4 border-info">
            <div className="d-flex align-items-center gap-2 small">
              <strong>System Notice: Data loading may be slower than usual due to API rate limiting. </strong>
              <span>We are working on caching improvements for the next release to speed this up.</span>
            </div>
          </Alert>
        )}

        {/* CONTROLS */}
        <div className="d-flex flex-wrap gap-3 mb-4 align-items-end">
          <div className="d-flex gap-2 align-items-center">
            <Form.Select 
              value={fromCurrency} 
              onChange={(e) => setFromCurrency(e.target.value)} 
              data-bs-theme="dark" size="sm" style={{ width: '100px' }}
            >
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </Form.Select>
            <span className="text">to</span>
            <Form.Select 
              value={toCurrency} 
              onChange={(e) => setToCurrency(e.target.value)} 
              data-bs-theme="dark" size="sm" style={{ width: '100px' }}
            >
              {currencies.map(c => <option key={c} value={c}>{c}</option>)}
            </Form.Select>
          </div>
          
          <ButtonGroup size="sm" className="ms-auto">
            {['3M', '6M', '1Y'].map((range) => (
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

        {/* MAIN CONTENT */}
        <div className="flex-grow-1 position-relative">
          {isLoading && (
             <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10, backgroundColor: 'rgba(33, 37, 41, 0.9)' }}>
                <Loader />
             </div>
          )}

          {chartData.rates.length > 1 ? (
            <div className="vstack gap-4">
              
              {/* 1. CHART */}
              <div style={{ height: '300px', width: '100%' }}>
                <Line ref={chartRef} options={chartOptions} data={chartJsData} />
              </div>

              {/* 2. STATS & TABLE */}
              <div style={{ opacity: isChartReady ? 1 : 0, transition: 'opacity 0.3s ease' }}>
                
                {/* Stats Cards */}
                <Row className="g-3">
                  <Col xs={6} lg={3}>
                    <Card bg="dark-subtle" className="border-secondary text-center h-100">
                      <Card.Body className="p-3">
                        <div className="text-muted small mb-1">Current Rate</div>
                        <div className="fw-bold fs-5">{stats.currentRate.toFixed(4)}</div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={6} lg={3}>
                    <Card bg="dark-subtle" className="border-secondary text-center h-100">
                      <Card.Body className="p-3">
                        <div className="text-muted small mb-1">Change</div>
                        <TrendIndicator value={stats.percentChange} />
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={6} lg={3}>
                    <Card bg="dark-subtle" className="border-secondary text-center h-100">
                      <Card.Body className="p-3">
                        <div className="text-muted small mb-1">Period High</div>
                        <div className="fw-bold fs-5 text-success">{stats.periodHigh.toFixed(4)}</div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col xs={6} lg={3}>
                    <Card bg="dark-subtle" className="border-secondary text-center h-100">
                      <Card.Body className="p-3">
                        <div className="text-muted small mb-1">Period Low</div>
                        <div className="fw-bold fs-5 text-danger">{stats.periodLow.toFixed(4)}</div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>

                {/* Data Table */}
                <div className="mt-4">
                  <h6 className="text-muted mb-3">Detailed Data</h6>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <Table striped bordered hover variant="dark" size="sm" className="mb-0">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...chartData.labels].reverse().map((label, index) => (
                          <tr key={label}>
                            <td>{label}</td>
                            <td>{chartData.rates[chartData.rates.length - 1 - index]?.toFixed(4)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            !isLoading && (
              <div className="d-flex justify-content-center align-items-center text-muted" style={{ minHeight: '300px' }}>
                No data available
              </div>
            )
          )}
        </div>

      </Card.Body>
    </Card>
  );
}

export default React.memo(HistoricalStats);