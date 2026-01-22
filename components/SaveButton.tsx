
import React from 'react';
import { Tab } from '../types';
import { logConversionEvent } from '../services/analyticsService';

interface SaveButtonProps {
  imageUrl: string;
  activeTab: Tab;
  contextSummary: string | null;
}

const SaveButton: React.FC<SaveButtonProps> = ({ imageUrl, activeTab, contextSummary }) => {
  const handleDownload = () => {
    try {
      // Log conversion event asynchronously
      logConversionEvent('output_download_click', activeTab, contextSummary);

      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `ai-design-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="bg-surface text-text-primary p-2.5 rounded-full shadow-lg hover:bg-gold hover:text-background focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-gold transition-all duration-300 z-20"
      aria-label="Save image to device"
      title="Save image"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    </button>
  );
};

export default SaveButton;
