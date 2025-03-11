import { Container } from 'react-bootstrap';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="d-flex flex-column vh-100 w-100">
      <Navbar />
      <div className="flex-grow-1 w-100">
        <Container fluid className="py-4">
          <Outlet />
        </Container>
      </div>
    </div>
  );
};

export default Layout;