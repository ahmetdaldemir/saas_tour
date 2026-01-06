// react-bootstrap
import { Row, Col, Card } from 'react-bootstrap';

// third party
import Chart from 'react-apexcharts';

// project imports
import FlatCard from 'components/Widgets/Statistic/FlatCard';
import ProductCard from 'components/Widgets/Statistic/ProductCard';
import FeedTable from 'components/Widgets/FeedTable';
import ProductTable from 'components/Widgets/ProductTable';
import { SalesCustomerSatisfactionChartData } from '../views/dashboard/DashSales/chart/sales-customer-satisfication-chart';
import { SalesAccountChartData } from '../views/dashboard/DashSales/chart/sales-account-chart';
import { SalesSupportChartData } from '../views/dashboard/DashSales/chart/sales-support-chart';
import { SalesSupportChartData1 } from '../views/dashboard/DashSales/chart/sales-support-chart1';
import feedData from 'data/feedData';
import productData from 'data/productTableData';

// -----------------------|| DASHBOARD ||-----------------------//
export default function Dashboard() {
  return (
    <Row>
      <Col md={12} xl={6}>
        <Card className="flat-card">
          <div className="row-table">
            <Card.Body className="col-sm-6 br">
              <FlatCard params={{ title: 'Toplam Rezervasyon', iconClass: 'text-primary mb-1', icon: 'calendar', value: '0' }} />
            </Card.Body>
            <Card.Body className="col-sm-6 d-none d-md-table-cell d-lg-table-cell d-xl-table-cell card-body br">
              <FlatCard params={{ title: 'Bugün Teslim', iconClass: 'text-primary mb-1', icon: 'arrow-right', value: '0' }} />
            </Card.Body>
            <Card.Body className="col-sm-6 card-bod">
              <FlatCard params={{ title: 'Bugün İade', iconClass: 'text-primary mb-1', icon: 'arrow-left', value: '0' }} />
            </Card.Body>
          </div>
          <div className="row-table">
            <Card.Body className="col-sm-6 br">
              <FlatCard
                params={{
                  title: 'Aktif Araçlar',
                  iconClass: 'text-primary mb-1',
                  icon: 'truck',
                  value: '0'
                }}
              />
            </Card.Body>
            <Card.Body className="col-sm-6 d-none d-md-table-cell d-lg-table-cell d-xl-table-cell card-body br">
              <FlatCard params={{ title: 'Bugün Gelir', iconClass: 'text-primary mb-1', icon: 'dollar-sign', value: '₺0' }} />
            </Card.Body>
            <Card.Body className="col-sm-6 card-bod">
              <FlatCard params={{ title: 'Bekleyen Ödeme', iconClass: 'text-primary mb-1', icon: 'credit-card', value: '₺0' }} />
            </Card.Body>
          </div>
        </Card>
        <Row>
          <Col md={6}>
            <Card className="support-bar overflow-hidden">
              <Card.Body className="pb-0">
                <h2 className="m-0">0%</h2>
                <span className="text-primary">Dönüşüm Oranı</span>
                <p className="mb-3 mt-3">Toplam ziyaretçi sayısına göre dönüşüm oranı.</p>
              </Card.Body>
              <Chart {...SalesSupportChartData()} />
              <Card.Footer className="border-0 bg-primary text-white background-pattern-white">
                <Row className="text-center">
                  <Col>
                    <h4 className="m-0 text-white">0</h4>
                    <span>Bu Ay</span>
                  </Col>
                  <Col>
                    <h4 className="m-0 text-white">0</h4>
                    <span>Geçen Ay</span>
                  </Col>
                  <Col>
                    <h4 className="m-0 text-white">0</h4>
                    <span>Önceki Ay</span>
                  </Col>
                </Row>
              </Card.Footer>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="support-bar overflow-hidden">
              <Card.Body className="pb-0">
                <h2 className="m-0">0</h2>
                <span className="text-primary">Tamamlanan Rezervasyon</span>
                <p className="mb-3 mt-3">Toplam ziyaretçi sayısına göre dönüşüm oranı.</p>
              </Card.Body>
              <Card.Footer className="border-0">
                <Row className="text-center">
                  <Col>
                    <h4 className="m-0">0</h4>
                    <span>Ocak</span>
                  </Col>
                  <Col>
                    <h4 className="m-0">0</h4>
                    <span>Şubat</span>
                  </Col>
                  <Col>
                    <h4 className="m-0">0</h4>
                    <span>Mart</span>
                  </Col>
                </Row>
              </Card.Footer>
              <Chart type="bar" {...SalesSupportChartData1()} />
            </Card>
          </Col>
        </Row>
      </Col>
      <Col md={12} xl={6}>
        <Card>
          <Card.Header>
            <h5>Aylık rezervasyon raporu</h5>
          </Card.Header>
          <Card.Body>
            <Row className="pb-2">
              <div className="col-auto m-b-10">
                <h3 className="mb-1">₺0</h3>
                <span>Toplam Gelir</span>
              </div>
              <div className="col-auto m-b-10">
                <h3 className="mb-1">₺0</h3>
                <span>Ortalama</span>
              </div>
            </Row>
            <Chart {...SalesAccountChartData()} />
          </Card.Body>
        </Card>
      </Col>
      <Col md={12} xl={6}>
        <Card>
          <Card.Body>
            <h6>Müşteri Memnuniyeti</h6>
            <span>Yüksek müşteri memnuniyeti seviyelerini korumak için sürekli çaba gereklidir.</span>
            <Row className="d-flex justify-content-center align-items-center">
              <Col>
                <Chart type="pie" {...SalesCustomerSatisfactionChartData()} />
              </Col>
            </Row>
          </Card.Body>
        </Card>
        {/* Product Table */}
        <ProductTable {...productData} />
      </Col>
      <Col md={12} xl={6}>
        <Row>
          <Col sm={6}>
            <ProductCard params={{ title: 'Toplam Kar', primaryText: '₺0', icon: 'dollar-sign' }} />
          </Col>
          <Col sm={6}>
            <ProductCard params={{ variant: 'primary', title: 'Toplam Rezervasyon', primaryText: '0', icon: 'calendar' }} />
          </Col>
          <Col sm={6}>
            <ProductCard params={{ variant: 'primary', title: 'Ortalama Fiyat', primaryText: '₺0', icon: 'tag' }} />
          </Col>
          <Col sm={6}>
            <ProductCard params={{ title: 'Tamamlanan', primaryText: '0', icon: 'check-circle' }} />
          </Col>
        </Row>
        {/* Feed Table */}
        <FeedTable {...feedData} />
      </Col>
    </Row>
  );
}

