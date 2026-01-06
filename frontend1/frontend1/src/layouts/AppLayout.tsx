import { useState, useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from 'primereact/sidebar';
import { Button } from 'primereact/button';
import { PanelMenu } from 'primereact/panelmenu';
import { useAuthStore } from '../stores/auth';
import { useFeaturesStore } from '../stores/features';
import { MenuItem } from 'primereact/menuitem';
import './AppLayout.css';

const AppLayout = () => {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuthStore();
  const features = useFeaturesStore();

  useEffect(() => {
    auth.ensureSession();
    features.initialize();
  }, []);

  const navigationItems = useMemo(() => {
    const items: MenuItem[] = [
      {
        label: 'Genel Bakış',
        icon: 'pi pi-th-large',
        command: () => navigate('/app/dashboard'),
      },
      {
        label: 'İçerik Yönetimi',
        icon: 'pi pi-file',
        items: [
          {
            label: 'Diller',
            icon: 'pi pi-globe',
            command: () => navigate('/app/languages'),
          },
          {
            label: 'Ülkeler',
            icon: 'pi pi-map',
            command: () => navigate('/app/countries'),
          },
          {
            label: 'Destinasyonlar',
            icon: 'pi pi-map-marker',
            command: () => navigate('/app/destinations'),
          },
          {
            label: 'Oteller',
            icon: 'pi pi-home',
            command: () => navigate('/app/hotels'),
          },
          {
            label: 'Blog',
            icon: 'pi pi-file-edit',
            command: () => navigate('/app/blogs'),
          },
        ],
      },
    ];

    if (auth.tenant?.category === 'tour') {
      items.push({
        label: 'Turlar',
        icon: 'pi pi-send',
        command: () => navigate('/app/tours'),
      });
    }

    if (auth.tenant?.category === 'rentacar') {
      const rentacarItems: MenuItem[] = [
        {
          label: 'Araçlar',
          icon: 'pi pi-car',
          command: () => navigate('/app/rentacar'),
        },
        {
          label: 'Rezervasyonlar',
          icon: 'pi pi-calendar-check',
          command: () => navigate('/app/reservations'),
        },
        {
          label: 'Rezervasyon Logları',
          icon: 'pi pi-file',
          command: () => navigate('/app/reservation-logs'),
        },
        {
          label: 'VIP Transfer',
          icon: 'pi pi-car',
          command: () => navigate('/app/transfer'),
        },
      ];

      if (features.hasFeature('vehicleTracking')) {
        rentacarItems.splice(3, 0, {
          label: 'Araç Takip',
          icon: 'pi pi-map',
          command: () => navigate('/app/trips'),
        });
      }

      items.push({
        label: 'Rent A Car',
        icon: 'pi pi-car',
        items: rentacarItems,
      });

      items.push(
        {
          label: 'Sözleşmeler',
          icon: 'pi pi-file-edit',
          command: () => navigate('/app/contracts'),
        },
        {
          label: 'Marketplace',
          icon: 'pi pi-shopping-cart',
          command: () => navigate('/app/marketplace'),
        },
        {
          label: 'Kampanyalar',
          icon: 'pi pi-tag',
          command: () => navigate('/app/campaigns'),
        },
        {
          label: 'Kuponlar',
          icon: 'pi pi-ticket',
          command: () => navigate('/app/coupons'),
        },
        {
          label: 'Operasyonlar',
          icon: 'pi pi-cog',
          command: () => navigate('/app/operations'),
        }
      );

      items.push({
        label: 'CRM',
        icon: 'pi pi-users',
        items: [
          {
            label: 'Müşteriler',
            icon: 'pi pi-user',
            command: () => navigate('/app/customers'),
          },
          {
            label: 'Sayfalar',
            icon: 'pi pi-file',
            command: () => navigate('/app/crm/pages'),
          },
          {
            label: 'Diğer',
            icon: 'pi pi-cog',
            command: () => navigate('/app/crm'),
          },
        ],
      });

      if (features.hasFeature('finance')) {
        items.push({
          label: 'Ön Muhasebe',
          icon: 'pi pi-money-bill',
          command: () => navigate('/app/finance'),
        });
      }
    }

    if (features.hasFeature('chat')) {
      items.push({
        label: 'Chat / Agency',
        icon: 'pi pi-comments',
        command: () => navigate('/app/chat'),
      });
    }

    items.push({
      label: 'Sistem',
      icon: 'pi pi-cog',
      items: [
        {
          label: 'Master Lokasyonlar',
          icon: 'pi pi-map',
          command: () => navigate('/app/master-locations'),
        },
        {
          label: 'Kullanıcılar',
          icon: 'pi pi-users',
          command: () => navigate('/app/users'),
        },
        {
          label: 'Anketler',
          icon: 'pi pi-list',
          command: () => navigate('/app/surveys'),
        },
        {
          label: 'Mail Şablonları',
          icon: 'pi pi-envelope',
          command: () => navigate('/app/email-templates'),
        },
        {
          label: 'Ayarlar',
          icon: 'pi pi-cog',
          command: () => navigate('/app/settings'),
        },
      ],
    });

    return items;
  }, [auth.tenant, features.features, navigate]);

  const handleLogout = () => {
    auth.logout();
    navigate('/login');
  };

  const isAuthenticated = !!auth.token && !!auth.user && !!auth.tenant;

  return (
    <div className="app-layout">
      <div className="app-header">
        <Button
          icon="pi pi-bars"
          onClick={() => setSidebarVisible(true)}
          className="p-button-text"
        />
        <h2 className="app-title">{auth.tenant?.name || 'SaaS Yönetim Paneli'}</h2>
        <div className="app-header-right">
          {isAuthenticated && (
            <>
              <div className="user-info">
                <div className="user-name">{auth.user?.name}</div>
                <small className="user-email">{auth.user?.email}</small>
              </div>
              <Button
                icon="pi pi-sign-out"
                onClick={handleLogout}
                className="p-button-text"
                tooltip="Çıkış Yap"
                tooltipOptions={{ position: 'bottom' }}
              />
            </>
          )}
        </div>
      </div>
      <Sidebar
        visible={sidebarVisible}
        onHide={() => setSidebarVisible(false)}
        className="app-sidebar"
      >
        <div className="sidebar-header">
          <h2>{auth.tenant?.name || 'SaaS Yönetim Paneli'}</h2>
          <p className="text-color-secondary">Yönetim Modülleri</p>
        </div>
        <PanelMenu model={navigationItems} className="sidebar-menu" />
      </Sidebar>
      <div className="app-content">
        <Outlet />
      </div>
    </div>
  );
};

export default AppLayout;
