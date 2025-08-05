import { NextPage } from 'next';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { useAuth } from '../lib/context/AuthContext';

interface Settings {
  sender: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  logoUrl: string;
}

const Settings: NextPage = () => {
  const { user, loading } = useAuth();
  
  const [settings, setSettings] = useState<Settings>({
    sender: {
      name: '',
      address: '',
      city: '',
      postalCode: '',
      country: ''
    },
    logoUrl: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Load settings
  useEffect(() => {
    if (!loading && user) {
      // Initialize settings from user data if available
      if (user.settings) {
        setSettings({
          sender: {
            name: user.settings.sender?.name || '',
            address: user.settings.sender?.address || '',
            city: user.settings.sender?.city || '',
            postalCode: user.settings.sender?.postalCode || '',
            country: user.settings.sender?.country || ''
          },
          logoUrl: user.settings.logoUrl || ''
        });
      }
    }
  }, [loading, user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      
      setSettings(prev => {
        // Create a safe copy of the parent object or an empty object if it doesn't exist
        const parentObj = typeof prev[parent as keyof Settings] === 'object' && prev[parent as keyof Settings] !== null
          ? { ...prev[parent as keyof Settings] as Record<string, any> }
          : {};
          
        // Return the updated settings
        return {
          ...prev,
          [parent]: {
            ...parentObj,
            [child]: value
          }
        };
      });
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');
      
      const response = await axios.put('/api/users/settings', { settings });
      
      if (response.data.success) {
        setSuccess('Settings updated successfully');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }
  
  return (
    <>
      <Head>
        <title>Settings | Invoice Generator</title>
      </Head>
      
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="card">
            <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {success}
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Your Information</h2>
                <p className="text-gray-600 mb-4">
                  This information will be pre-filled in your invoices. You can always change it when creating an invoice.
                </p>
                
                <div className="mb-4">
                  <label htmlFor="sender.name" className="block text-gray-700 mb-2">Name/Company</label>
                  <input
                    id="sender.name"
                    name="sender.name"
                    type="text"
                    className="input"
                    value={settings.sender.name}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="sender.address" className="block text-gray-700 mb-2">Address</label>
                  <input
                    id="sender.address"
                    name="sender.address"
                    type="text"
                    className="input"
                    value={settings.sender.address}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label htmlFor="sender.city" className="block text-gray-700 mb-2">City</label>
                    <input
                      id="sender.city"
                      name="sender.city"
                      type="text"
                      className="input"
                      value={settings.sender.city}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="sender.postalCode" className="block text-gray-700 mb-2">Postal Code</label>
                    <input
                      id="sender.postalCode"
                      name="sender.postalCode"
                      type="text"
                      className="input"
                      value={settings.sender.postalCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="sender.country" className="block text-gray-700 mb-2">Country</label>
                  <input
                    id="sender.country"
                    name="sender.country"
                    type="text"
                    className="input"
                    value={settings.sender.country}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Logo</h2>
                
                <div className="mb-4">
                  <label htmlFor="logoUrl" className="block text-gray-700 mb-2">Logo URL</label>
                  <input
                    id="logoUrl"
                    name="logoUrl"
                    type="text"
                    className="input"
                    value={settings.logoUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a URL to your logo image. The logo will appear on your invoices.
                  </p>
                </div>
                
                {settings.logoUrl && (
                  <div className="mt-4">
                    <p className="text-gray-700 mb-2">Preview:</p>
                    <div className="border border-gray-300 rounded p-4 bg-white">
                      <img 
                        src={settings.logoUrl} 
                        alt="Logo Preview" 
                        className="h-16 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          setError('Failed to load logo image. Please check the URL.');
                        }}
                        onLoad={() => {
                          setError('');
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;