
import React from 'react';

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => {
  return (
    <div className="absolute inset-0 bg-surface/80 flex flex-col justify-center items-center z-10 backdrop-blur-sm rounded-md">
      <div className="w-16 h-16 border-4 border-t-gold border-r-gold border-b-gold border-l-border rounded-full animate-spin"></div>
      <p className="mt-4 text-lg font-semibold text-text-primary">{message}</p>
    </div>
  );
};

export default Loader;