import { Link, useLocation } from 'react-router';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { IoGlobeOutline } from 'react-icons/io5';

export default function AppNavbar() {
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/' },
    { name: 'Converter', path: '/converter' },
    { name: 'Historical Charts', path: '/history' },
    { name: 'Fluctuation', path: '/fluctuation' },
    { name: 'Watchlist', path: '/watchlist' },
  ];

  return (
    <Navbar 
      bg="dark" 
      variant="dark" 
      expand="lg" 
      sticky="top" 
      className="border-bottom border-secondary shadow-sm"
    >
      <Container fluid className="px-4">
        {/* Brand Logo & Title */}
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center gap-2">
          <IoGlobeOutline className="text-primary" size={24} />
          <span className="fw-bold">Currency Exchange</span>
        </Navbar.Brand>
        
        {/* Mobile Toggle Button */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        {/* Collapsible Links */}
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
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
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}