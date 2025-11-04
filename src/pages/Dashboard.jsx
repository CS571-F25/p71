import ExchangeRateMatrix from '../components/ExchangeRateMatrix';
import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

function Dashboard() {
  return (
    <Container fluid className="py-4">
      <h2 className="mb-4 text-white">Dashboard Overview</h2>
      <Row className="g-4">
        <Col lg={6}>
          <ExchangeRateMatrix />
        </Col>
      </Row>
    </Container>
  );
}

export default React.memo(Dashboard);
