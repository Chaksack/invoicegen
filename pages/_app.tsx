import { AppProps } from 'next/app';
import { useState, useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { AuthProvider, useAuth } from '../lib/context/AuthContext';
import Navigation from '../components/Navigation';
import '../styles/globals.css';

// Wrap the app with the AuthProvider
function MyApp({ Component, pageProps }: AppProps) {
  const [isClient, setIsClient] = useState(false);

  // This effect runs only on the client, after the component has mounted
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <SessionProvider session={pageProps.session}>
      <AuthProvider>
        {/* Only render the component on the client side */}
        {isClient && <AppContent Component={Component} pageProps={pageProps} />}
      </AuthProvider>
    </SessionProvider>
  );
}

// Inner component that has access to the auth context
function AppContent({ Component, pageProps }: { Component: AppProps['Component'], pageProps: AppProps['pageProps'] }) {
  const { user, loading } = useAuth();
  
  // Show navigation for all users
  return (
    <>
      {!loading && <Navigation />}
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;