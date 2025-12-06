import { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router';
import { Navbar, Nav, Container, Button, Modal, Form, Alert } from 'react-bootstrap';
import { IoGlobeOutline, IoPersonCircleOutline, IoLogOutOutline } from 'react-icons/io5';
import { CurrencyDataContext } from '../contexts/CurrencyDataContext';

export default function AppNavbar() {
  const location = useLocation();
  const { user, login, register, logout } = useContext(CurrencyDataContext);
  const [showAuthModal, setShowAuthModal] = useState(false);  
  const [isRegistering, setIsRegistering] = useState(false);  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  // Reset form when modal closes or mode switches
  const handleClose = () => {
    setShowAuthModal(false);
    setIsRegistering(false);
    setError('');
    setEmail('');
    setPassword('');
    setUsername('');
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let result;
    if (isRegistering) {
      if (!username) {
        setError("Username is required");
        return;
      }
      result = await register(email, password, username);
    } else {
      result = await login(email, password);
    }

    if (result.success) {
      handleClose();
    } else {
      const msg = result.message
        .replace("Firebase: ", "")
        .replace("auth/", "")
        .replace(/-/g, " ");
      setError(msg.charAt(0).toUpperCase() + msg.slice(1));
    }
  };

  const navLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'Converter', path: '/converter' },
    { name: 'Historical Charts', path: '/history' },
    { name: 'Fluctuation', path: '/fluctuation' },
    { name: 'Watchlist', path: '/watchlist' },
  ];

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" sticky="top" className="border-bottom border-secondary shadow-sm">
        <Container fluid className="px-4">
          <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
            <IoGlobeOutline className="text-primary" size={24} />
            <span className="fw-bold">Currency Exchange</span>
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto align-items-center gap-2">
              {navLinks.map((link) => (
                <Nav.Link 
                  key={link.path} 
                  as={Link} 
                  to={link.path} 
                  active={location.pathname === link.path}
                  className="px-3"
                >
                  {link.name}
                </Nav.Link>
              ))}

              <div className="vr d-none d-lg-block mx-2 text-secondary" style={{ height: '24px' }}></div>
              
              {user ? (
                <div className="d-flex align-items-center gap-3">
                  <div className="d-flex align-items-center gap-2">
                    <IoPersonCircleOutline size={32} className="text-white" />
                    <div className="d-flex flex-column" style={{lineHeight: '1.2'}}>
                      <span className="text-white fw-bold small">{user.displayName || "User"}</span>
                      <span className="text-muted small" style={{fontSize: '0.75rem'}}>{user.email}</span>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline-danger" 
                    size="sm" 
                    onClick={logout}
                    title="Sign Out"
                  >
                    <IoLogOutOutline size={18} />
                  </Button>
                </div>
              ) : (
                <Button variant="primary" size="sm" onClick={() => setShowAuthModal(true)}>
                  Sign In / Register
                </Button>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* --- AUTH MODAL --- */}
      <Modal show={showAuthModal} onHide={handleClose} centered contentClassName="bg-dark text-white border-secondary">
        <Modal.Header closeButton closeVariant="white" className="border-secondary">
          <Modal.Title>{isRegistering ? "Create Account" : "Sign In"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && <Alert variant="danger" className="py-2">{error}</Alert>}
          
          <Form onSubmit={handleAuthSubmit}>
            {/* Username field - Only visible when Registering */}
            {isRegistering && (
              <Form.Group className="mb-3">
                <Form.Label>Username</Form.Label>
                <Form.Control 
                  type="text" 
                  placeholder="e.g. Amsyar" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-dark text-white border-secondary" 
                  data-bs-theme="dark"
                />
              </Form.Group>
            )}

            <Form.Group className="mb-3">
              <Form.Label>Email Address</Form.Label>
              <Form.Control 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-dark text-white border-secondary" 
                data-bs-theme="dark"
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Password</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="******" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-dark text-white border-secondary" 
                data-bs-theme="dark"
              />
            </Form.Group>

            <div className="d-grid gap-3">
              <Button variant="primary" type="submit" size="lg">
                {isRegistering ? "Register" : "Sign In"}
              </Button>
              
              {/* --- TOGGLE BUTTON --- */}
              <div className="text-center border-top border-secondary pt-3">
                <span className="text-muted small me-2">
                  {isRegistering ? "Already have an account?" : "Don't have an account?"}
                </span>
                <Button 
                  variant="link" 
                  className="p-0 text-info text-decoration-none fw-bold"
                  onClick={() => {
                    setIsRegistering(!isRegistering);
                    setError('');
                  }}
                >
                  {isRegistering ? "Sign In here" : "Register here"}
                </Button>
              </div>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
}