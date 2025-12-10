import HistoricalStats from '../components/HistoricalStats';
import { Container, Row, Col } from 'react-bootstrap';

export default function History() {
  return (
    <Container fluid className="px-4 py-5">
      <h1 className="text-white mb-4">History</h1>
      <Row>
        <Col>
          <HistoricalStats />
        </Col>
      </Row>
    </Container>
  );
}
