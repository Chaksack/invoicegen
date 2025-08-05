import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Navbar from '../components/Navbar';

interface UserSettings {
  sender: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  logoUrl: string;
}

interface SettingsProps {
  setAlertMessage: (message: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ setAlertMessage }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    sender: {
      name: '',
      address: '',
      city: '',
      postalCode: '',
      country: '',
    },
    logoUrl: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/users/settings');
        
        if (response.data.success && response.data.data) {
          setSettings(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching user settings:', error);
        setAlertMessage('Failed to load settings. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchSettings();
    }
  }, [user, setAlertMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSenderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      sender: {
        ...prev.sender,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const response = await axios.put('/api/users/settings', settings);
      
      if (response.data.success) {
        setAlertMessage('Settings saved successfully!');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setAlertMessage('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-extrabold text-center text-blue-800 mb-6">Settings</h2>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Company Information</h3>
          <p className="text-gray-600 mb-6">
            This information will be used as the default sender on your invoices.
          </p>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={settings.sender.name} 
                  onChange={handleSenderChange} 
                  className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Your Company Name" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input 
                  type="text" 
                  name="address" 
                  value={settings.sender.address} 
                  onChange={handleSenderChange} 
                  className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Street Address" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input 
                  type="text" 
                  name="city" 
                  value={settings.sender.city} 
                  onChange={handleSenderChange} 
                  className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="City" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                <input 
                  type="text" 
                  name="postalCode" 
                  value={settings.sender.postalCode} 
                  onChange={handleSenderChange} 
                  className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Postal Code" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input 
                  type="text" 
                  name="country" 
                  value={settings.sender.country} 
                  onChange={handleSenderChange} 
                  className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="Country" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input 
                  type="text" 
                  name="logoUrl" 
                  value={settings.logoUrl} 
                  onChange={handleInputChange} 
                  className="w-full bg-gray-50 border border-gray-300 p-2 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="https://example.com/logo.png" 
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter a URL to your company logo. The logo will appear on your invoices.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                type="submit" 
                className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition duration-300 flex items-center"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Account Information</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="bg-gray-100 p-2 rounded-lg text-sm text-gray-800">
              {user?.email}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This is the email address associated with your account.
            </p>
          </div>
          
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
            <div>
              <h4 className="text-md font-semibold text-gray-800">Email Verification</h4>
              <p className="text-sm text-gray-600">
                {user?.emailVerified 
                  ? 'Your email has been verified.' 
                  : 'Please verify your email to access all features.'}
              </p>
            </div>
            
            {!user?.emailVerified && (
              <button 
                className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 transition duration-300 text-sm"
                onClick={() => setAlertMessage('Verification email would be sent here.')}
              >
                Resend Verification
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;