'use client';

import React, { useState } from 'react';

interface MetaAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  isLoading?: boolean;
}

const MetaAuthButton: React.FC<MetaAuthButtonProps> = ({
  onSuccess,
  onError,
  isLoading = false,
}) => {
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleMetaLogin = () => {
    setIsAuthLoading(true);
    // Redirecionar para a rota de OAuth que inicia o fluxo com Facebook
    // O servidor vai gerar o state CSRF e redirecionar para Facebook
    window.location.href = '/api/auth/meta';
  };

  const isDisabled = isLoading || isAuthLoading;

  return (
    <button
      onClick={handleMetaLogin}
      disabled={isDisabled}
      className="w-full py-3 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500 disabled:opacity-50 border-0 rounded-lg shadow-lg hover:shadow-xl disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-gray-950 focus:outline-none"
    >
      {/* Meta/Facebook Logo */}
      <svg
        className={`w-5 h-5 ${isDisabled ? 'opacity-50' : ''}`}
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          fill="#FFFFFF"
          d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
        />
      </svg>
      <span className={`text-white font-semibold ${isDisabled ? 'opacity-50' : ''}`}>
        {isDisabled ? 'Conectando...' : 'Conectar com Facebook'}
      </span>
    </button>
  );
};

export default MetaAuthButton;
