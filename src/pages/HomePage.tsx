// src/pages/HomePage.tsx
import { Container, Row, Col, Card, Button, Carousel } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <Container>
      <h1 className="mb-4">Welcome to Memory Vault</h1>
      
      {/* Featured media carousel */}
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>Featured Memories</Card.Title>
          <Carousel>
            {[1, 2, 3].map((num) => (
              <Carousel.Item key={num}>
                <div 
                  className="d-block w-100 bg-secondary" 
                  style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <h3 className="text-white">Featured Memory {num}</h3>
                </div>
              </Carousel.Item>
            ))}
          </Carousel>
        </Card.Body>
      </Card>
      
      {/* Quick actions */}
      <Row>
        <Col md={6} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Upload New Media</Card.Title>
              <Card.Text>
                Add new photos, documents or videos to your vault.
              </Card.Text>
              <Button 
                // as={Link} 
                // to="/upload" 
                variant="warning" 
                className="text-dark fw-bold"
              >
                Start Upload
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} className="mb-4">
          <Card>
            <Card.Body>
              <Card.Title>Search Your Archive</Card.Title>
              <Card.Text>
                Find your cherished memories quickly and easily.
              </Card.Text>
              <Button 
                // as={Link} 
                // to="/search" 
                variant="primary"
              >
                Search
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage;