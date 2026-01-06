import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import AppLayout from '../layouts/AppLayout';
import Tours from '../pages/Tours';
import Reservations from '../pages/Reservations';
import Customers from '../pages/Customers';
import Rentacar from '../pages/Rentacar';
import Languages from '../pages/Languages';
import Destinations from '../pages/Destinations';
import Hotels from '../pages/Hotels';
import Blogs from '../pages/Blogs';
import Settings from '../pages/Settings';
import Users from '../pages/Users';
import Crm from '../pages/Crm';
import Finance from '../pages/Finance';
import Transfer from '../pages/Transfer';
import Contracts from '../pages/Contracts';
import Marketplace from '../pages/Marketplace';
import Campaigns from '../pages/Campaigns';
import Coupons from '../pages/Coupons';
import Operations from '../pages/Operations';
import Countries from '../pages/Countries';
import MasterLocations from '../pages/MasterLocations';
import Surveys from '../pages/Surveys';
import EmailTemplates from '../pages/EmailTemplates';
import Chat from '../pages/Chat';
import Trips from '../pages/Trips';
import ReservationLogs from '../pages/ReservationLogs';
import CrmPages from '../pages/CrmPages';

// Helper to check if route is subdomain
function isSubdomain(): boolean {
  const hostname = window.location.hostname;
  const cleanHostname = hostname.split(':')[0];
  const parts = cleanHostname.split('.');
  
  if (parts.length >= 3) {
    const firstPart = parts[0];
    if (firstPart === 'www') return false;
    const slugRegex = /^[a-z0-9-]+$/;
    if (slugRegex.test(firstPart)) return true;
  }
  
  return false;
}

// Protected route wrapper
import { useAuthStore } from '../stores/auth';

const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
  const auth = useAuthStore();
  const isAuthenticated = !!auth.token && !!auth.user && !!auth.tenant;
  
  if (!auth.initialized) {
    return <div>Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <Navigate to="/app/dashboard" replace />,
      },
      {
        path: 'app/dashboard',
        element: <Dashboard />,
      },
      {
        path: 'app/tours',
        element: <Tours />,
      },
      {
        path: 'app/reservations',
        element: <Reservations />,
      },
      {
        path: 'app/customers',
        element: <Customers />,
      },
      {
        path: 'app/rentacar',
        element: <Rentacar />,
      },
      {
        path: 'app/languages',
        element: <Languages />,
      },
      {
        path: 'app/destinations',
        element: <Destinations />,
      },
      {
        path: 'app/hotels',
        element: <Hotels />,
      },
      {
        path: 'app/blogs',
        element: <Blogs />,
      },
      {
        path: 'app/settings',
        element: <Settings />,
      },
      {
        path: 'app/users',
        element: <Users />,
      },
      {
        path: 'app/crm',
        element: <Crm />,
      },
      {
        path: 'app/crm/pages',
        element: <CrmPages />,
      },
      {
        path: 'app/finance',
        element: <Finance />,
      },
      {
        path: 'app/transfer',
        element: <Transfer />,
      },
      {
        path: 'app/contracts',
        element: <Contracts />,
      },
      {
        path: 'app/marketplace',
        element: <Marketplace />,
      },
      {
        path: 'app/campaigns',
        element: <Campaigns />,
      },
      {
        path: 'app/coupons',
        element: <Coupons />,
      },
      {
        path: 'app/operations',
        element: <Operations />,
      },
      {
        path: 'app/countries',
        element: <Countries />,
      },
      {
        path: 'app/master-locations',
        element: <MasterLocations />,
      },
      {
        path: 'app/surveys',
        element: <Surveys />,
      },
      {
        path: 'app/email-templates',
        element: <EmailTemplates />,
      },
      {
        path: 'app/chat',
        element: <Chat />,
      },
      {
        path: 'app/trips',
        element: <Trips />,
      },
      {
        path: 'app/reservation-logs',
        element: <ReservationLogs />,
      },
    ],
  },
]);

