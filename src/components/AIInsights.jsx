import { useState, useEffect, useContext } from 'react';
import { Card, Spinner, Badge } from 'react-bootstrap';
import { BsRobot, BsGraphUpArrow, BsGraphDownArrow, BsDashCircle } from 'react-icons/bs';
import { CurrencyDataContext } from '../contexts/CurrencyDataContext';

export default function AIInsights({ currency }) {
  const { fetchAIInsights } = useContext(CurrencyDataContext);
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      const data = await fetchAIInsights(currency);
      if (isMounted) {
        setInsight(data);
        setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [currency, fetchAIInsights]);

  // Helper for sentiment styling
  const getVariant = (sentiment) => {
    if (sentiment === 'Bullish') return { bg: 'success', icon: <BsGraphUpArrow /> };
    if (sentiment === 'Bearish') return { bg: 'danger', icon: <BsGraphDownArrow /> };
    return { bg: 'secondary', icon: <BsDashCircle /> };
  };

  if (loading) {
    return (
      <Card bg="dark" text="white" className="border-secondary shadow-sm mb-4">
        <Card.Body className="d-flex align-items-center justify-content-center py-4">
          <Spinner animation="border" size="sm" className="me-2 text-primary" />
          <span className="text-muted small">AI is analyzing market trends...</span>
        </Card.Body>
      </Card>
    );
  }

  if (!insight) return null;

  const style = getVariant(insight.sentiment);

  return (
    <Card bg="dark" text="white" className="border-secondary shadow-sm mb-4">
      <Card.Header className="border-secondary d-flex align-items-center gap-2">
        <BsRobot className="text-info" />
        <span className="fw-bold">AI Market Analysis ({currency})</span>
      </Card.Header>
      <Card.Body>
        <div className="d-flex align-items-center gap-2 mb-3">
          <Badge bg={style.bg} className="d-flex align-items-center gap-1 px-3 py-2">
            {style.icon} {insight.sentiment}
          </Badge>
          <span className="text-muted small">Based on recent news</span>
        </div>
        <p className="card-text text-light small mb-0" style={{ lineHeight: '1.6' }}>
          {insight.summary}
        </p>
      </Card.Body>
    </Card>
  );
}