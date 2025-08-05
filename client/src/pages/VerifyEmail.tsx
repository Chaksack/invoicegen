import React from 'react';
import { useAuth } from '../context/AuthContext';

const VerifyEmail: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl text-center space-y-6">
        <h2 className="text-3xl font-extrabold text-blue-800">Verify Your Email</h2>
        <p className="text-gray-600">
          A verification link has been sent to {user?.email}. 
          Please click the link to activate your account. 
          You may need to check your spam folder.
        </p>
        <p className="text-sm text-gray-500 mt-4">
          Once you verify your email, you can refresh this page or log in again.
        </p>
        <button
          onClick={logout}
          className="bg-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-red-700 transition duration-300"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default VerifyEmail;