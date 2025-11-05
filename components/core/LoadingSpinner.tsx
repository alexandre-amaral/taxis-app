
import React from 'react';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full">
    <div
      className="animate-spin rounded-full h-16 w-16"
      style={{
        border: '3px solid rgba(0, 255, 255, 0.1)',
        borderTopColor: '#00ffff',
        boxShadow: '0 0 15px rgba(0, 255, 255, 0.15)'
      }}
    ></div>
  </div>
);

export default LoadingSpinner;
