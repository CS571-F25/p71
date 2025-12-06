import ExchangeRateMatrix from '../components/ExchangeRateMatrix';
import AIInsights from '../components/AIInsights';
import { Container, Row, Col } from 'react-bootstrap';

export default function Dashboard() {
  return (
    <Container fluid className="py-4">
      <h2 className="mb-4 text-white">Dashboard Overview</h2>
      
      <Row className="g-4">
        {/* Left Column: AI Insights + Matrix */}
        <Col lg={6}>
          {/* Automatically analyzes USD by default, or you can make this dynamic */}
          <AIInsights currency="USD" /> 
          <ExchangeRateMatrix />
        </Col>
        
        {/* Right Column: Watchlist preview or other stats */}
        <Col lg={6}>
        </Col>
      </Row>
    </Container>
  );
}