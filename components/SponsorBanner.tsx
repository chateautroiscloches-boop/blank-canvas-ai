import React, { useEffect, useState } from 'react';

// Configuration to hide the banner until a sponsor is secured.
// Change this to 'true' to enable the banner and location lookup.
const IS_VISIBLE = false;

const SponsorBanner: React.FC = () => {
  const [bannerText, setBannerText] = useState("Global Banner: Check out our new service!");

  useEffect(() => {
    // Only execute logic if the banner is set to be visible
    if (!IS_VISIBLE) return;

    const fetchCountry = async () => {
      try {
        // Use a free, HTTPS-compatible IP geolocation API suitable for client-side use
        const response = await fetch('https://get.geojs.io/v1/ip/country.json');
        if (response.ok) {
            const data = await response.json();
            const countryCode = data.country;
    
            if (countryCode === 'GB') {
              setBannerText("UK Sponsor: Claim your special UK offer now!");
            } else if (countryCode === 'US') {
              setBannerText("USA Sponsor: Find the best deals across America!");
            }
        }
      } catch (error) {
        console.error("Failed to fetch location for banner:", error);
      }
    };

    fetchCountry();
  }, []);

  // Return null to render nothing if the banner is disabled
  if (!IS_VISIBLE) {
      return null;
  }

  return (
    <div className="bg-surface border-b border-border/50 text-text-secondary text-xs font-medium py-2 px-4 text-center tracking-wide">
      <span className="text-gold mr-2">★</span>
      {bannerText}
      <span className="text-gold ml-2">★</span>
    </div>
  );
};

export default SponsorBanner;