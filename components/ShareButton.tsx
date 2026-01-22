
import React, { useState } from 'react';
import { Tab } from '../types';
import { logConversionEvent } from '../services/analyticsService';

interface ShareButtonProps {
  imageUrl: string;
  activeTab: Tab;
  contextSummary: string | null;
}

const ShareButton: React.FC<ShareButtonProps> = ({ imageUrl, activeTab, contextSummary }) => {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataUrlToFile = async (dataUrl: string, fileName: string): Promise<File | null> => {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      return new File([blob], fileName, { type: blob.type });
    } catch (e) {
      console.error("Error converting data URL to file", e);
      return null;
    }
  };

  const handleShare = async () => {
    setError(null);
    setIsSharing(true);

    // Log conversion event asynchronously
    logConversionEvent('output_share_click', activeTab, contextSummary);

    const fileName = `ai-design-${Date.now()}.png`;
    const shareData = {
      title: 'AI Interior Design',
      text: 'Check out this new look for my room, created with Blank Canvas AI by Chateau Trois Cloches!',
    };

    if (navigator.share) {
      const file = await dataUrlToFile(imageUrl, fileName);
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ ...shareData, files: [file] });
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.error('Share API error:', err);
            setError('Could not share image.');
          }
        }
      } else {
         handleDownload();
      }
    } else {
      handleDownload();
    }
    
    setIsSharing(false);
  };
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ai-design-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <>
      <button
        onClick={handleShare}
        disabled={isSharing}
        className="flex items-center gap-2 bg-gold text-background px-4 py-2 rounded-full font-bold shadow-lg hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-gold transition-all duration-300 z-20"
        aria-label="Share image"
        title="Share image"
      >
        {isSharing ? (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8m-4-6l-4-4m0 0L8 6m4-4v12" />
          </svg>
        )}
        <span>Share</span>
      </button>
      {error && <p className="absolute bottom-16 right-4 text-xs text-red-400 bg-red-900/70 p-1 rounded z-20">{error}</p>}
    </>
  );
};

export default ShareButton;
