import { Container, Nav, Navbar as BootstrapNavbar, NavDropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <div className="w-100 m-0 p-0">
      <BootstrapNavbar bg="dark" variant="dark" expand="lg" className="w-100">
        <Container fluid>
          <BootstrapNavbar.Brand as={Link} to="/">
            <img
              src="/memory-vault-logo.png"
              width="30"
              height="30"
              className="d-inline-block align-top me-2"
              alt="Memory Vault Logo"
            />
            <span className="brand-font">Memory Vault</span>
          </BootstrapNavbar.Brand>
          <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
          <BootstrapNavbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/">Home</Nav.Link>
              <Nav.Link as={Link} to="/upload">Upload</Nav.Link>
              <Nav.Link as={Link} to="/search">Search</Nav.Link>
              <NavDropdown title="More" id="basic-nav-dropdown">
                <NavDropdown.Item as={Link} to="/help">Help</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/about">About</NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </BootstrapNavbar.Collapse>
        </Container>
      </BootstrapNavbar>
    </div>
  );
};

export default Navbar;