import React, { useContext } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { CurrencyDataContext } from '../contexts/CurrencyDataContext';
import { BsTrash, BsJournalText, BsPersonLock } from 'react-icons/bs';

export default function Watchlist() {
  const { watchlist, liveRates, toggleWatchlist, updateWatchlistNote, user } = useContext(CurrencyDataContext);

  if (!user) {
    return (
      <Container fluid className="px-4 py-5">
        <h2 className="text-white mb-4">My Watchlist</h2>
        <Card bg="dark" text="white" className="border-secondary shadow text-center py-5">
          <Card.Body>
            <BsPersonLock size={48} className="text-muted mb-3" />
            <h4>Sign In Required</h4>
            <p className="text-muted">
              Please sign in using the button in the navigation bar to access and save your personal watchlist.
            </p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  // Fallback if displayName is null
  const displayName = user.displayName || user.email.split('@')[0];

  return (
    <Container fluid className="px-4 py-5">
      <h2 className="text-white mb-4">{displayName}'s Watchlist</h2>

      {watchlist.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <h4>No currencies watched yet.</h4>
          <p>Go to the Dashboard and click the star icon next to a currency pair to add it here.</p>
        </div>
      ) : (
        <Row className="g-4">
          {watchlist.map((item) => {
            const rate = liveRates && liveRates[item.base] && liveRates[item.base][item.target]
              ? liveRates[item.base][item.target].toFixed(4)
              : "Loading...";

            return (
              <Col key={item.id} md={6} lg={4}>
                <Card bg="dark" text="white" className="border-secondary shadow-sm h-100">
                  <Card.Header className="d-flex justify-content-between align-items-center border-secondary">
                    <span className="fw-bold fs-5">{item.base} to {item.target}</span>
                    <Button 
                      variant="link" 
                      className="text-danger p-0" 
                      onClick={() => toggleWatchlist(item.base, item.target)}
                    >
                      <BsTrash size={18} />
                    </Button>
                  </Card.Header>
                  <Card.Body>
                    <div className="mb-3">
                      <div className="text-muted small">Current Rate</div>
                      <div className="fs-3 fw-bold text-primary">{rate}</div>
                    </div>
                    
                    <Form.Group>
                      <Form.Label className="text-muted small d-flex align-items-center gap-2">
                        <BsJournalText /> Your Notes
                      </Form.Label>
                      <Form.Control 
                        as="textarea" 
                        rows={2}
                        placeholder="Ex: Buy when rate hits 1.10..."
                        value={item.note}
                        onChange={(e) => updateWatchlistNote(item.base, item.target, e.target.value)}
                        className="border-secondary small"
                        data-bs-theme="dark"
                        style={{ 
                          resize: 'none', 
                          backgroundColor: '#1a1d20', 
                          color: '#e9ecef'
                        }}
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Container>
  );
}