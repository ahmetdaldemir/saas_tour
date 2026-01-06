import { useContext, useMemo } from 'react';

// project imports
import NavContent from './NavContent';
import { ConfigContext } from 'contexts/ConfigContext';
import useWindowSize from 'hooks/useWindowSize';
import * as actionType from 'store/actions';
import { useAuthStore } from 'stores/auth';
import { useFeaturesStore } from 'stores/features';

// -----------------------|| NAVIGATION ||-----------------------//

// Icon mapping from Material Design Icons to Feather icons
const iconMap = {
  'mdi-view-dashboard-outline': 'home',
  'mdi-file-document-multiple-outline': 'file-text',
  'mdi-translate': 'globe',
  'mdi-earth': 'map',
  'mdi-map-marker-radius': 'map-pin',
  'mdi-bed': 'home',
  'mdi-file-document-outline': 'edit',
  'mdi-airballoon': 'send',
  'mdi-car-sports': 'truck',
  'mdi-calendar-check': 'calendar',
  'mdi-file-document-alert-outline': 'file-text',
  'mdi-map-marker-path': 'map',
  'mdi-car-limousine': 'truck',
  'mdi-file-document-edit-outline': 'file-text',
  'mdi-store-outline': 'shopping-cart',
  'mdi-tag': 'tag',
  'mdi-ticket-percent': 'tag',
  'mdi-tools': 'settings',
  'mdi-account-group': 'users',
  'mdi-account-multiple': 'user',
  'mdi-file-document-edit': 'file-text',
  'mdi-cog': 'settings',
  'mdi-cash-multiple': 'dollar-sign',
  'mdi-chat-outline': 'message-square',
  'mdi-cog-outline': 'settings',
  'mdi-map-marker-multiple': 'map',
  'mdi-account-group-outline': 'users',
  'mdi-clipboard-text-outline': 'list',
  'mdi-email-multiple-outline': 'mail',
};

export default function Navigation() {
  const configContext = useContext(ConfigContext);
  const { collapseMenu, collapseLayout } = configContext.state;
  const windowSize = useWindowSize();
  const { dispatch } = configContext;
  const auth = useAuthStore();
  const features = useFeaturesStore();

  const navToggleHandler = () => {
    dispatch({ type: actionType.COLLAPSE_MENU });
  };

  // Generate menu items dynamically based on tenant and features
  const navigationItems = useMemo(() => {
    const mainItems = [
      {
        id: 'dashboard',
        type: 'item',
        title: 'Genel Bakış',
        icon: 'material-icons-two-tone',
        iconname: 'home',
        url: '/app/dashboard',
      },
    ];

    // İçerik Yönetimi
    const contentItems = [
      {
        id: 'languages',
        type: 'item',
        title: 'Diller',
        icon: 'material-icons-two-tone',
        iconname: 'translate',
        url: '/app/languages',
      },
      {
        id: 'countries',
        type: 'item',
        title: 'Ülkeler',
        icon: 'material-icons-two-tone',
        iconname: 'public',
        url: '/app/countries',
      },
      {
        id: 'destinations',
        type: 'item',
        title: 'Destinasyonlar',
        icon: 'material-icons-two-tone',
        iconname: 'place',
        url: '/app/destinations',
      },
      {
        id: 'hotels',
        type: 'item',
        title: 'Oteller',
        icon: 'material-icons-two-tone',
        iconname: 'hotel',
        url: '/app/hotels',
      },
      {
        id: 'blogs',
        type: 'item',
        title: 'Blog',
        icon: 'material-icons-two-tone',
        iconname: 'article',
        url: '/app/blogs',
      },
    ];

    if (contentItems.length > 0) {
      mainItems.push({
        id: 'content',
        type: 'collapse',
        title: 'İçerik Yönetimi',
        icon: 'material-icons-two-tone',
        iconname: 'description',
        children: contentItems,
      });
    }

    // Tour category
    if (auth.tenant?.category === 'tour') {
      mainItems.push({
        id: 'tours',
        type: 'item',
        title: 'Turlar',
        icon: 'material-icons-two-tone',
        iconname: 'flight',
        url: '/app/tours',
      });
    }

    // Rentacar category
    // TODO: Remove !auth.tenant check after auth integration - this is temporary for testing
    if (auth.tenant?.category === 'rentacar' || !auth.tenant) {
      const rentacarItems = [
        {
          id: 'vehicles',
          type: 'item',
          title: 'Araçlar',
          icon: 'material-icons-two-tone',
          iconname: 'directions_car',
          url: '/app/rentacar',
        },
        {
          id: 'reservations',
          type: 'item',
          title: 'Rezervasyonlar',
          icon: 'material-icons-two-tone',
          iconname: 'event',
          url: '/app/reservations',
        },
        {
          id: 'reservation-logs',
          type: 'item',
          title: 'Rezervasyon Logları',
          icon: 'material-icons-two-tone',
          iconname: 'description',
          url: '/app/reservation-logs',
        },
        {
          id: 'transfer',
          type: 'item',
          title: 'VIP Transfer',
          icon: 'material-icons-two-tone',
          iconname: 'airport_shuttle',
          url: '/app/transfer',
        },
      ];

      // Add vehicle tracking only if feature is enabled (insert at index 3, before VIP Transfer)
      if (features.initialized && features.hasFeature('vehicleTracking')) {
        rentacarItems.splice(3, 0, {
          id: 'trips',
          type: 'item',
          title: 'Araç Takip',
          icon: 'material-icons-two-tone',
          iconname: 'map',
          url: '/app/trips',
        });
      }

      mainItems.push({
        id: 'rentacar',
        type: 'collapse',
        title: 'Rent A Car',
        icon: 'material-icons-two-tone',
        iconname: 'directions_car',
        children: rentacarItems,
      });

      mainItems.push(
        {
          id: 'contracts',
          type: 'item',
          title: 'Sözleşmeler',
          icon: 'material-icons-two-tone',
          iconname: 'description',
          url: '/app/contracts',
        },
        {
          id: 'marketplace',
          type: 'item',
          title: 'Marketplace',
          icon: 'material-icons-two-tone',
          iconname: 'store',
          url: '/app/marketplace',
        },
        {
          id: 'campaigns',
          type: 'item',
          title: 'Kampanyalar',
          icon: 'material-icons-two-tone',
          iconname: 'local_offer',
          url: '/app/campaigns',
        },
        {
          id: 'coupons',
          type: 'item',
          title: 'Kuponlar',
          icon: 'material-icons-two-tone',
          iconname: 'confirmation_number',
          url: '/app/coupons',
        },
        {
          id: 'operations',
          type: 'item',
          title: 'Operasyonlar',
          icon: 'material-icons-two-tone',
          iconname: 'build',
          url: '/app/operations',
        }
      );

      mainItems.push({
        id: 'crm',
        type: 'collapse',
        title: 'CRM',
        icon: 'material-icons-two-tone',
        iconname: 'people',
        children: [
          {
            id: 'customers',
            type: 'item',
            title: 'Müşteriler',
            icon: 'material-icons-two-tone',
            iconname: 'person',
            url: '/app/customers',
          },
          {
            id: 'crm-pages',
            type: 'item',
            title: 'Sayfalar',
            icon: 'material-icons-two-tone',
            iconname: 'description',
            url: '/app/crm/pages',
          },
          {
            id: 'crm-other',
            type: 'item',
            title: 'Diğer',
            icon: 'material-icons-two-tone',
            iconname: 'settings',
            url: '/app/crm',
          },
        ],
      });

      if (features.hasFeature('finance')) {
        mainItems.push({
          id: 'finance',
          type: 'item',
          title: 'Ön Muhasebe',
          icon: 'material-icons-two-tone',
          iconname: 'account_balance',
          url: '/app/finance',
        });
      }
    }

    if (features.hasFeature('chat')) {
      mainItems.push({
        id: 'chat',
        type: 'item',
        title: 'Chat / Agency',
        icon: 'material-icons-two-tone',
        iconname: 'chat',
        url: '/app/chat',
      });
    }

    const systemItems = [
        {
          id: 'master-locations',
          type: 'item',
          title: 'Master Lokasyonlar',
        icon: 'material-icons-two-tone',
        iconname: 'place',
          url: '/app/master-locations',
        },
        {
          id: 'users',
          type: 'item',
          title: 'Kullanıcılar',
        icon: 'material-icons-two-tone',
        iconname: 'people',
          url: '/app/users',
        },
        {
          id: 'surveys',
          type: 'item',
          title: 'Anketler',
        icon: 'material-icons-two-tone',
        iconname: 'list',
          url: '/app/surveys',
        },
        {
          id: 'email-templates',
          type: 'item',
          title: 'Mail Şablonları',
        icon: 'material-icons-two-tone',
        iconname: 'email',
          url: '/app/email-templates',
        },
        {
          id: 'settings',
          type: 'item',
          title: 'Ayarlar',
        icon: 'material-icons-two-tone',
        iconname: 'settings',
          url: '/app/settings',
        },
    ];

    mainItems.push({
      id: 'system',
      type: 'collapse',
      title: 'Sistem',
      icon: 'material-icons-two-tone',
      iconname: 'settings',
      children: systemItems,
    });

    return {
      items: [
        {
          id: 'main',
          type: 'group',
          title: 'Navigation',
          children: mainItems,
        },
      ],
    };
  }, [auth.tenant, features.features]);

  let navClass = ['dark-sidebar', 'pc-sidebar'];
  if (windowSize.width <= 1024 && collapseMenu) {
    navClass.push('mob-sidebar-active');
  } else if (collapseMenu) {
    navClass.push('navbar-collapsed');
  }

  let navBarClass = ['navbar-wrapper'];

  let mobileOverlay = <></>;
  if (windowSize.width <= 1024 && collapseMenu) {
    mobileOverlay = <div className="pc-menu-overlay" onClick={navToggleHandler} aria-hidden="true" />;
  }

  const navItemsArray = navigationItems?.items || [];
  let navContent = <NavContent navigation={navItemsArray} />;
  let navContentDOM = <div className={navBarClass.join(' ')}>{navContent}</div>;

  return (
    <nav className={navClass.join(' ')}>
      {navContentDOM}
      {mobileOverlay}
    </nav>
  );
}
