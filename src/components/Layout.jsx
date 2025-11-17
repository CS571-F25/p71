import { Outlet, Link } from 'react-router';
import { Navbar, Nav, Container } from 'react-bootstrap';

export default function Layout() {
  return (
    <div className='min-vh-100'>
      <Navbar bg="dark" variant="dark" expand="lg" className="border-bottom border-secondary">
        <Container fluid>
          <Navbar.Brand as={Link} to="/">Currency Exchange</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/">Dashboard</Nav.Link>
              <Nav.Link as={Link} to="/converter">Converter</Nav.Link>
              <Nav.Link as={Link} to="/historical-charts">History</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
