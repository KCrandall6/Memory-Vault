import { Container } from 'react-bootstrap';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import './Layout.css';

const Layout = () => {
  return (
    <div className="app-layout d-flex flex-column vh-100 w-100">
      <Navbar />
      <main className="app-main flex-grow-1 w-100">
        <Container fluid className="app-content-container py-4">
          <Outlet />
        </Container>
      </main>
    </div>
  );
};

export default Layout;