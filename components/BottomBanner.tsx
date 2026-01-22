import React, { useEffect } from 'react';

interface BottomBannerProps {
  isVisible: boolean;
}

const BottomBanner: React.FC<BottomBannerProps> = ({ isVisible }) => {
  useEffect(() => {
    if (isVisible) {
      try {
        // Guard against multiple pushes or missing script
        const adsbygoogle = (window as any).adsbygoogle;
        if (adsbygoogle) {
          adsbygoogle.push({});
        }
      } catch (e) {
        console.error("AdSense integration error:", e);
      }
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-8">
      {/* 
        Banner Container 
        - Now relative/static flow so it appears only at the bottom of the page
        - Height approx 90px to accommodate standard display ads
        - Rounded corners and subtle border for luxury feel
      */}
      <div className="w-full min-h-[90px] bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl flex items-center justify-center overflow-hidden transition-all duration-300">
          {/* AdSense Placement */}
          <ins className="adsbygoogle"
               style={{ display: 'block', width: '100%', minHeight: '90px' }}
               data-ad-client="ca-pub-5389871242763102"
               data-ad-slot="2358295286"
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
      </div>
    </div>
  );
};

export default BottomBanner;