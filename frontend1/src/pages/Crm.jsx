import { useState } from 'react';
import { Row, Col, Card, Badge, Alert } from 'react-bootstrap';

// project imports
import MainCard from '../components/Card/MainCard';

export default function Crm() {
  return (
    <MainCard title="CRM - Müşteri İlişkileri Yönetimi">
      <Row className="mb-3">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h3>
                <i className="fas fa-users text-primary"></i>
              </h3>
              <h4>Toplam Müşteri</h4>
              <h2>0</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h3>
                <i className="fas fa-star text-warning"></i>
              </h3>
              <h4>VIP Müşteriler</h4>
              <h2>0</h2>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <h3>
                <i className="fas fa-chart-line text-success"></i>
              </h3>
              <h4>Bu Ay Yeni</h4>
              <h2>0</h2>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Alert variant="info">
        <strong>CRM Modülü</strong> - Müşteri segmentasyonu, kampanya yönetimi ve müşteri analizi için özel
        araçlar burada yer alacak.
      </Alert>
    </MainCard>
  );
}

