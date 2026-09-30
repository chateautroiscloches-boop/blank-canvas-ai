import React from 'react';
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
  const handleDownload = async () => {
    try {
      logConversionEvent(
        'output_download_click',
        activeTab,
        contextSummary
      );

      if (!imageUrl) {
        console.error('No image URL available to save.');
        return;
      }

      /*
       * Convert the generated image into a Blob/File.
       * This works with both data URLs and normal image URLs.
       */
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const file = new File(
        [blob],
        `blank-canvas-ai-${Date.now()}.png`,
        {
          type: blob.type || 'image/png',
        }
      );

      /*
       * MOBILE:
       *
       * iPhone/iPad Safari and many Android browsers handle the
       * native share sheet much more reliably than a programmatic
       * <a download> click.
       *
       * If the browser supports sharing image files, use it.
       */
      if (
        typeof navigator !== 'undefined' &&
        'share' in navigator &&
        'canShare' in navigator
      ) {
        const shareData = {
          files: [file],
          title: 'Blank Canvas AI',
          text: 'My design from Blank Canvas AI',
        };

        try {
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return;
          }
        } catch (shareError) {
          /*
           * The user may have cancelled the share sheet.
           * In that case we simply continue to the normal
           * download method rather than showing an error.
           */
          if (
            shareError instanceof DOMException &&
            shareError.name === 'AbortError'
          ) {
            return;
          }

          console.warn(
            'Native sharing was unavailable:',
            shareError
          );
        }
      }

      /*
       * DESKTOP / BROWSERS WITHOUT FILE SHARING:
       *
       * Use a temporary Blob URL and the standard download
       * attribute.
       */
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `blank-canvas-ai-${Date.now()}.png`;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      /*
       * Give the browser a little time to start the download
       * before removing the temporary object URL.
       */
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
      }, 2000);
    } catch (error) {
      console.error('Failed to save image:', error);

      /*
       * FINAL FALLBACK:
       *
       * If the browser refuses the Blob/download approach,
       * open the original image directly.
       *
       * On iPhone this allows the user to press and hold the
       * image and choose "Save to Photos".
       */
      try {
        const newWindow = window.open(
          imageUrl,
          '_blank',
          'noopener,noreferrer'
        );

        /*
         * Some browsers block window.open unless it happens
         * directly from the user interaction. If that happens,
         * navigate the current window instead.
         */
        if (!newWindow) {
          window.location.href = imageUrl;
        }
      } catch (fallbackError) {
        console.error(
          'Unable to open image fallback:',
          fallbackError
        );
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="bg-surface text-text-primary p-2.5 rounded-full shadow-lg hover:bg-gold hover:text-background focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-gold transition-all duration-300 z-20"
      aria-label="Save image to device"
      title="Save image"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
    </button>
  );
};

export default SaveButton;
