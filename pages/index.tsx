import { NextPage } from 'next';
import Head from 'next/head';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../lib/context/AuthContext';

const Home: NextPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Redirect authenticated users to the invoice generator page
  useEffect(() => {
    if (user && !loading) {
      router.push('/invoice-generator');
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>Invoice Generator - Create Professional Invoices</title>
        <meta name="description" content="Generate professional invoices easily with our free invoice generator. Create, manage, and download invoices in seconds." />
      </Head>
      
      <main className="min-h-screen bg-gray-100">
        {/* Hero section */}
        <div className="bg-primary-700 text-white">
          <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
            <div className="text-center">
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                Professional Invoices in Seconds
              </h1>
              <p className="mt-4 text-base sm:text-lg md:text-xl max-w-3xl mx-auto">
                Create, manage, and download professional invoices with our easy-to-use invoice generator.
              </p>
              <div className="mt-8 sm:mt-10">
                <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link href="/login" className="btn btn-primary bg-white text-primary-700 hover:bg-gray-100 w-full sm:w-auto">
                    Login
                  </Link>
                  <Link href="/register" className="btn btn-secondary border border-white hover:bg-primary-600 w-full sm:w-auto">
                    Register
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Features section */}
        <div className="py-12 sm:py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Features
              </h2>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
                Everything you need to create and manage professional invoices.
              </p>
            </div>
            
            <div className="mt-8 sm:mt-12 grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <div className="card">
                <div className="text-lg sm:text-xl font-semibold mb-2">Easy to Use</div>
                <p className="text-sm sm:text-base text-gray-600">
                  Create invoices in seconds with our intuitive interface. No accounting knowledge required.
                </p>
              </div>
              
              <div className="card">
                <div className="text-lg sm:text-xl font-semibold mb-2">Professional Templates</div>
                <p className="text-sm sm:text-base text-gray-600">
                  Choose from professional invoice templates that make your business look great.
                </p>
              </div>
              
              <div className="card">
                <div className="text-lg sm:text-xl font-semibold mb-2">Download & Share</div>
                <p className="text-sm sm:text-base text-gray-600">
                  Download invoices as PDF or share them directly with your clients via a link.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* CTA section */}
        <div className="bg-primary-50 py-10 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-700">
              Ready to get started?
            </h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
              Join thousands of businesses that use our invoice generator to create professional invoices.
            </p>
            <div className="mt-6 sm:mt-8">
              <Link href="/register" className="btn btn-primary w-full sm:w-auto">
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default Home;