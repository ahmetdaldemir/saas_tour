// third party
import { RouterProvider } from 'react-router-dom';
import { useEffect } from 'react';

// project imports
import router from 'routes';
import { useAuthStore } from './stores/auth';

// -----------------------|| APP ||-----------------------//

export default function App() {
  const auth = useAuthStore();

  useEffect(() => {
    // Initialize auth store on app mount
    auth.initialize();
  }, []);

  return <RouterProvider router={router} />;
}
