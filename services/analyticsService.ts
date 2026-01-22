
import { Tab } from '../types';

interface PaintSearchEvent {
  query: string;
  brand: string | null;
  colour: string | null;
  country: string | null;
  month: string;
}

interface ConversionEvent {
  event: 'output_download_click' | 'output_share_click';
  timestamp: string;
  month: string;
  country: string | null;
  active_tab: string;
  context_summary: string | null;
}

/**
 * Internal helper to get coarse country data.
 */
const getCoarseCountry = async (): Promise<string | null> => {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timeZone.includes('London') || timeZone.includes('Europe/London')) return 'UK';
    if (timeZone.includes('America')) return 'US';
    
    const geoRes = await fetch('https://get.geojs.io/v1/ip/country.json');
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      return geoData.country || 'Unknown';
    }
    return navigator.language.split('-').pop() || null;
  } catch (e) {
    return null;
  }
};

/**
 * Logs paint search events anonymously for internal analytics.
 */
export const logPaintSearch = async (query: string): Promise<void> => {
  if (!query || query.trim().length === 0) return;

  setTimeout(async () => {
    try {
      const parts = query.split(',').map(p => p.trim());
      let brand: string | null = null;
      let colour: string | null = null;

      if (parts.length > 1) {
        brand = parts[0];
        colour = parts.slice(1).join(', ').trim();
      } else {
        const commonBrands = ['Mylands', 'Farrow & Ball', 'Benjamin Moore', 'Little Greene', 'Dulux'];
        const detectedBrand = commonBrands.find(b => query.toLowerCase().includes(b.toLowerCase()));
        if (detectedBrand) {
          brand = detectedBrand;
          colour = query.replace(new RegExp(detectedBrand, 'gi'), '').trim();
        } else {
          colour = query.trim();
        }
      }

      const country = await getCoarseCountry();
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const eventData: PaintSearchEvent = {
        query: query.trim(),
        brand: brand || null,
        colour: colour || null,
        country: country,
        month: month
      };

      fetch('/api/analytics/paint_search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
        keepalive: true
      }).catch(() => {});
    } catch (error) {}
  }, 0);
};

/**
 * Logs conversion events (downloads/shares) anonymously.
 */
export const logConversionEvent = async (
  type: 'output_download_click' | 'output_share_click',
  activeTab: Tab,
  contextSummary: string | null
): Promise<void> => {
  setTimeout(async () => {
    try {
      const country = await getCoarseCountry();
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const eventData: ConversionEvent = {
        event: type,
        timestamp: now.toISOString(),
        month: month,
        country: country,
        active_tab: activeTab,
        context_summary: contextSummary
      };

      fetch('/api/analytics/conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
        keepalive: true
      }).catch(() => {});
    } catch (error) {}
  }, 0);
};

/**
 * INTERNAL REPORT SPECIFICATION (CONCEPTUAL OUTPUT)
 * ------------------------------------------------
 * This defines the schema for monthly aggregation.
 * 
 * Target Output Format (CSV):
 * month, country, active_tab, search_count, top_terms, download_clicks, share_clicks
 * 
 * Example Row:
 * 2024-05, UK, Paint, 150, "Bond Street No.219; Hague Blue", 45, 12
 * 2024-05, US, Wallpaper, 0, null, 80, 30
 */
