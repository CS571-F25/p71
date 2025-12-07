import { useContext } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router'; 
import { BsStarFill, BsArrowRight, BsCurrencyExchange, BsGraphUp } from 'react-icons/bs';
import ExchangeRateMatrix from '../components/ExchangeRateMatrix';
import AIInsights from '../components/AIInsights';
import { CurrencyDataContext } from '../contexts/CurrencyDataContext';

export default function Dashboard() {
  const { watchlist, liveRates, user } = useContext(CurrencyDataContext);

  // Helper to safely get rate for watchlist items
  const getRate = (base, target) => {
    if (liveRates && liveRates[base] && liveRates[base][target]) {
      return liveRates[base][target].toFixed(4);
    }
    return '---';
  };

  // Helper to get user's name
  const getUserName = () => {
    if (user && user.displayName) return user.displayName;
    if (user && user.email) return user.email.split('@')[0];
    return 'Trader';
  };

  return (
    <Container fluid className="py-4">
      {/* --- Page Header --- */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-white mb-0">Welcome back, {getUserName()}</h2>
          <p className="text-muted small mb-0">Here is your market overview for today.</p>
        </div>
        <div className="d-none d-md-block text-end text-muted small">
          Data refreshes automatically
        </div>
      </div>
      
      <Row className="g-4">
        {/* --- LEFT COLUMN: Analysis & Data --- */}
        <Col lg={7} xl={8} className="d-flex flex-column gap-4">
          
          {/* 1. AI Insights (The attractive component we built) */}
          <AIInsights /> 

          {/* 2. Rate Matrix */}
          <ExchangeRateMatrix />
        </Col>
        
        {/* --- RIGHT COLUMN: Personal & Navigation --- */}
        <Col lg={5} xl={4} className="d-flex flex-column gap-4">
          
          {/* 3. Quick Actions (Replaces Chart to fill space without API calls) */}
          <Card bg="dark" text="white" className="border-secondary shadow-sm">
            <Card.Header className="border-secondary d-flex justify-content-between align-items-center">
              Quick Actions
            </Card.Header>
            <Card.Body className="d-grid gap-2">
              <Button 
                as={Link} 
                to="/converter" 
                variant="outline-primary" 
                className="d-flex justify-content-between align-items-center p-3"
              >
                <span><BsCurrencyExchange className="me-2"/> Convert Currency</span>
                <BsArrowRight />
              </Button>
              <Button 
                as={Link} 
                to="/history" 
                variant="outline-info" 
                className="d-flex justify-content-between align-items-center p-3"
              >
                <span><BsGraphUp className="me-2"/> View Historical Charts</span>
                <BsArrowRight />
              </Button>
            </Card.Body>
          </Card>

          {/* 4. Watchlist Preview */}
          <Card bg="dark" text="white" className="border-secondary shadow-sm flex-grow-1">
            <Card.Header className="border-secondary d-flex justify-content-between align-items-center">
              <span className="fw-bold d-flex align-items-center gap-2">
                <BsStarFill className="text-warning"/> My Watchlist
              </span>
              <Button as={Link} to="/watchlist" variant="link" size="sm" className="text-decoration-none text-light opacity-75">
                View All <BsArrowRight />
              </Button>
            </Card.Header>
            
            <div className="flex-grow-1" style={{ minHeight: '300px' }}>
              {watchlist.length === 0 ? (
                <div className="h-100 d-flex flex-column justify-content-center align-items-center text-muted p-4 text-center">
                  <BsStarFill size={32} className="mb-3 opacity-25" />
                  <h6>Your watchlist is empty</h6>
                  <p className="small">Star currency pairs to track them here.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {/* We map specific watchlist items here */}
                  {watchlist.slice(0, 5).map((item) => (
                    <div key={item.id} className="list-group-item bg-transparent text-white border-secondary d-flex justify-content-between align-items-center px-3 py-3">
                      <div>
                        <div className="fw-bold fs-5">{item.base} <span className="text small">to</span> {item.target}</div>
                        {item.note && (
                          <div className="text-muted text-truncate small" style={{ maxWidth: '150px' }}>
                            {item.note}
                          </div>
                        )}
                      </div>
                      <div className="text-end">
                        <div className="fs-5 fw-bold font-monospace">{getRate(item.base, item.target)}</div>
                        <div className="badge bg-secondary bg-opacity-25 text-light fw-normal">Live</div>
                      </div>
                    </div>
                  ))}
                  
                  {watchlist.length > 5 && (
                     <div className="text-center p-3 border-top border-secondary">
                        <small className="text-muted">And {watchlist.length - 5} more...</small>
                     </div>
                  )}
                </div>
              )}
            </div>
          </Card>

        </Col>
      </Row>
    </Container>
  );
}