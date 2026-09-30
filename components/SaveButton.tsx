import React, { useState } from 'react';
import { Tab } from '../types';
import { logConversionEvent } from '../services/analyticsService';

interface SaveButtonProps {
  imageUrl: string;
  activeTab: Tab;
  contextSummary: string | null;
}

const SaveButton: React.FC<SaveButtonProps> = ({
  imageUrl,
  activeTab,
  contextSummary,
}) => {
  const [saved, setSaved] = useState(false);

  const handleDownload = async () => {
    try {
      logConversionEvent(
        'output_download_click',
        activeTab,
        contextSummary
      );

      // Convert data URL to blob for better mobile support
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `blank-canvas-ai-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 1000);

      // Show a tick so the user knows the download action happened
      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2000);

    } catch (error) {
      console.error('Failed to download image:', error);

      // Fallback — open image in new tab so user can save manually
      window.open(imageUrl, '_blank');

      // Still give the user visual confirmation that the
      // fallback action was triggered
      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="bg-surface text-text-primary p-2.5 rounded-full shadow-lg hover:bg-gold hover:text-background focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-gold transition-all duration-300 z-20"
      aria-label={saved ? 'Image saved' : 'Save image to device'}
      title={saved ? 'Image saved' : 'Save image'}
    >
      {saved ? (
        // Tick icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        // Download icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      )}
    </button>
  );
};

export default SaveButton;
