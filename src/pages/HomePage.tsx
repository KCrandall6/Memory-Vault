// src/pages/HomePage.tsx
import { Container, Row, Col, Card, Button, Carousel } from 'react-bootstrap';
import './HomePage.css'; // We'll create this file for custom styling

const HomePage = () => {
  return (
    <Container>
      <h1 className="mb-4 title-font text-center display-4">Welcome to Memory Vault</h1>
      <p className="lead text-center mb-5">Your personal media archive for preserving cherished memories</p>
      
      {/* Featured media carousel */}
      <Card className="mb-5 shadow">
        <Card.Body className="p-0">
          <Carousel className="featured-carousel">
            {[1, 2, 3].map((num) => (
              <Carousel.Item key={num}>
                <div 
                  className="d-block w-100 carousel-placeholder"
                  style={{ backgroundColor: '#1E3A5F' }}
                >
                  <h3 className="text-white">Featured Memory {num}</h3>
                  <p className="text-light">Brief description of this memory</p>
                </div>
                <Carousel.Caption>
                  <h3>Memory Title {num}</h3>
                  <p>Description of this cherished memory</p>
                </Carousel.Caption>
              </Carousel.Item>
            ))}
          </Carousel>
        </Card.Body>
      </Card>
      
      {/* Quick actions */}
      <Row className="g-4 mb-4">
        <Col md={6} className="d-flex">
          <Card className="shadow w-100 action-card">
            <Card.Body className="d-flex flex-column">
              <Card.Title className="title-font fs-4 mb-3">Upload New Media</Card.Title>
              <Card.Text className="mb-4 flex-grow-1">
                Add new photos, documents or videos to your vault. Preserve your memories 
                with detailed information for easy searching later.
              </Card.Text>
              <div className="text-center mt-auto">
                <Button 
                  href="/upload" 
                  variant="warning" 
                  className="text-dark fw-bold px-4 py-2"
                  style={{ backgroundColor: '#FFB800' }}
                >
                  Start Upload
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} className="d-flex">
          <Card className="shadow w-100 action-card">
            <Card.Body className="d-flex flex-column">
              <Card.Title className="title-font fs-4 mb-3">Search Your Archive</Card.Title>
              <Card.Text className="mb-4 flex-grow-1">
                Find your cherished memories quickly and easily using powerful search filters.
                Search by date, people, location, or tags to find exactly what you're looking for.
              </Card.Text>
              <div className="text-center mt-auto">
                <Button 
                  href="/search" 
                  variant="primary"
                  className="px-4 py-2"
                  style={{ backgroundColor: '#1E3A5F' }}
                >
                  Search Memories
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Additional section */}
      <Card className="mt-4 mb-4 shadow-sm border-0 bg-light">
        <Card.Body className="p-4">
          <Row>
            <Col md={6}>
              <h3 className="title-font">Your Memories, Organized</h3>
              <p>Memory Vault helps you organize your media by collection, date, location, and people. 
              Add detailed information to your photos and documents to make them easy to find later.</p>
            </Col>
            <Col md={6}>
              <h3 className="title-font">Easy to Use</h3>
              <p>With a simple interface designed for everyone, Memory Vault makes preserving your 
              memories a breeze, whether you're tech-savvy or not.</p>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default HomePage;