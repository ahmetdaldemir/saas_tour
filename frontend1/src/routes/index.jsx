import { lazy, useEffect } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// project import
import MainRoutes from './MainRoutes';
import AdminLayout from 'layouts/AdminLayout';
import GuestLayout from 'layouts/GuestLayout';
import { useAuthStore } from '../stores/auth';
import Loader from '../components/Loader/Loader';

// render - landing page
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Languages = lazy(() => import('../pages/Languages'));
const Countries = lazy(() => import('../pages/Countries'));
const Destinations = lazy(() => import('../pages/Destinations'));
const Hotels = lazy(() => import('../pages/Hotels'));
const Blogs = lazy(() => import('../pages/Blogs'));
const Login = lazy(() => import('../views/auth/login'));

// Rent A Car pages
const RentacarTabs = lazy(() => import('../pages/RentacarTabs'));
const VehicleForm = lazy(() => import('../pages/VehicleForm'));
const VehiclePlates = lazy(() => import('../pages/VehiclePlates'));
const Reservations = lazy(() => import('../pages/Reservations'));
const ReservationLogs = lazy(() => import('../pages/ReservationLogs'));
const Trips = lazy(() => import('../pages/Trips'));
const Transfer = lazy(() => import('../pages/Transfer'));
const Contracts = lazy(() => import('../pages/Contracts'));
const Marketplace = lazy(() => import('../pages/Marketplace'));
const Campaigns = lazy(() => import('../pages/Campaigns'));
const Coupons = lazy(() => import('../pages/Coupons'));
const Operations = lazy(() => import('../pages/Operations'));

// CRM pages
const Customers = lazy(() => import('../pages/Customers'));
const CrmPages = lazy(() => import('../pages/CrmPages'));
const Crm = lazy(() => import('../pages/Crm'));

// Other modules
const Finance = lazy(() => import('../pages/Finance'));
const Chat = lazy(() => import('../pages/Chat'));

// System pages
const MasterLocations = lazy(() => import('../pages/MasterLocations'));
const Users = lazy(() => import('../pages/Users'));
const Surveys = lazy(() => import('../pages/Surveys'));
const EmailTemplates = lazy(() => import('../pages/EmailTemplates'));
const Settings = lazy(() => import('../pages/Settings'));

// Protected route wrapper
const ProtectedRoute = ({ children }) => {
  const auth = useAuthStore();
  const isAuthenticated = !!auth.token && !!auth.user && !!auth.tenant;

  useEffect(() => {
    auth.initialize();
  }, []);

  if (!auth.initialized) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// ==============================|| ROUTING RENDER ||============================== //

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <GuestLayout />,
      children: [
        {
          path: 'login',
          element: <Login />
        }
      ]
    },
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <Navigate to="/app/dashboard" replace />
        },
        {
          path: 'app/dashboard',
          element: <Dashboard />
        },
        {
          path: 'app/languages',
          element: <Languages />
        },
        {
          path: 'app/countries',
          element: <Countries />
        },
        {
          path: 'app/destinations',
          element: <Destinations />
        },
        {
          path: 'app/hotels',
          element: <Hotels />
        },
        {
          path: 'app/blogs',
          element: <Blogs />
        },
        // Rent A Car routes
        {
          path: 'app/rentacar',
          element: <RentacarTabs />
        },
        {
          path: 'app/rentacar/add',
          element: <VehicleForm />
        },
        {
          path: 'app/rentacar/edit/:id',
          element: <VehicleForm />
        },
        {
          path: 'app/rentacar/:vehicleId/plates',
          element: <VehiclePlates />
        },
        {
          path: 'app/reservations',
          element: <Reservations />
        },
        {
          path: 'app/reservation-logs',
          element: <ReservationLogs />
        },
        {
          path: 'app/trips',
          element: <Trips />
        },
        {
          path: 'app/transfer',
          element: <Transfer />
        },
        {
          path: 'app/contracts',
          element: <Contracts />
        },
        {
          path: 'app/marketplace',
          element: <Marketplace />
        },
        {
          path: 'app/campaigns',
          element: <Campaigns />
        },
        {
          path: 'app/coupons',
          element: <Coupons />
        },
        {
          path: 'app/operations',
          element: <Operations />
        },
        // CRM routes
        {
          path: 'app/customers',
          element: <Customers />
        },
        {
          path: 'app/crm/pages',
          element: <CrmPages />
        },
        {
          path: 'app/crm',
          element: <Crm />
        },
        // Other modules
        {
          path: 'app/finance',
          element: <Finance />
        },
        {
          path: 'app/chat',
          element: <Chat />
        },
        // System routes
        {
          path: 'app/master-locations',
          element: <MasterLocations />
        },
        {
          path: 'app/users',
          element: <Users />
        },
        {
          path: 'app/surveys',
          element: <Surveys />
        },
        {
          path: 'app/email-templates',
          element: <EmailTemplates />
        },
        {
          path: 'app/settings',
          element: <Settings />
        }
      ]
    },
    MainRoutes
  ],
  {
    future: {
      v7_startTransition: true,
    },
  }
);

export default router;
