import HistoricalChart from '../components/HistoricalChart';
import { Container, Row, Col } from 'react-bootstrap';

export default function HistoricalCharts() {
  return (
    <Container fluid className="px-4 py-5">
      <h2 className="text-white mb-4">Historical Charts</h2>
      <Row>
        <Col>
          <HistoricalChart />
        </Col>
      </Row>
    </Container>
  );
}
