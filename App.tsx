import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Tab, GroundingChunk, PanellingStyle, PanellingHeight } from './types';
import { fileToBase64, addWatermark, getHexFromFile } from './utils/fileUtils';
import {
  applyStyle,
  editText,
  getDesignIdeasFromImage,
  implementDesignIdeas,
  extractPatternFromImage,
  applyPanelling,
  applyPaintColor
} from './services/geminiService';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import TabSelector from './components/TabSelector';
import Loader from './components/Loader';
import ResultDisplay from './components/ResultDisplay';
import SplashScreen from './components/SplashScreen';
import BottomBanner from './components/BottomBanner';
import Footer from './components/Footer';
import Modal from './components/Modal';
import { SHOW_ADS } from './config/brandConfig';
import { logPaintSearch } from './services/analyticsService';

const WEEKLY_LIMIT = 10;
const STORAGE_KEY = 'bcai_usage';

const getUsageData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { count: 0, weekStart: Date.now() };

    const data = JSON.parse(raw);
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    if (Date.now() - data.weekStart > oneWeek) {
      return { count: 0, weekStart: Date.now() };
    }

    return data;
  } catch {
    return { count: 0, weekStart: Date.now() };
  }
};

const saveUsageData = (data: { count: number; weekStart: number }) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
};

/* =========================================================
   CURATED PAINT PALETTE
   ========================================================= */

type PaintColour = {
  name: string;
  hex: string;
};

type PaintFamily = {
  name: string;
  colours: PaintColour[];
};

const PAINT_FAMILIES: PaintFamily[] = [
  {
    name: 'Whites & Creams',
    colours: [
      { name: 'Soft White', hex: '#F5F3ED' },
      { name: 'Warm White', hex: '#F1EEE5' },
      { name: 'Ivory', hex: '#F3EBDD' },
      { name: 'Cream', hex: '#EFE3C5' },
      { name: 'Chalk White', hex: '#E8E5DC' },
      { name: 'Linen', hex: '#E5DCCB' },
      { name: 'Vanilla', hex: '#E9D9B7' },
      { name: 'Porcelain', hex: '#E7E4DC' },
      { name: 'Oat', hex: '#DED4C0' },
      { name: 'Almond', hex: '#D9CBB5' },
      { name: 'Pale Stone', hex: '#D6CCBB' },
      { name: 'Off White', hex: '#EDE9DF' },
    ],
  },
  {
    name: 'Greys',
    colours: [
      { name: 'Pale Grey', hex: '#D7D7D3' },
      { name: 'Silver Grey', hex: '#C5C6C3' },
      { name: 'Warm Grey', hex: '#B9B4AA' },
      { name: 'Stone Grey', hex: '#A9A59C' },
      { name: 'Mushroom Grey', hex: '#9E968A' },
      { name: 'French Grey', hex: '#8E8D87' },
      { name: 'Slate Grey', hex: '#737675' },
      { name: 'Charcoal', hex: '#4A4B49' },
      { name: 'Soft Charcoal', hex: '#555652' },
      { name: 'Graphite', hex: '#3F4140' },
      { name: 'Deep Grey', hex: '#353736' },
      { name: 'Almost Black', hex: '#252625' },
    ],
  },
  {
    name: 'Beiges & Taupes',
    colours: [
      { name: 'Natural Beige', hex: '#D8CBB7' },
      { name: 'Soft Beige', hex: '#D2C3AD' },
      { name: 'Sand', hex: '#CBB99D' },
      { name: 'Limestone', hex: '#C8BBA5' },
      { name: 'Warm Stone', hex: '#B8A890' },
      { name: 'Taupe', hex: '#A89B89' },
      { name: 'Mushroom', hex: '#A39787' },
      { name: 'Putty', hex: '#B3A58F' },
      { name: 'Mocha', hex: '#8D7D6A' },
      { name: 'Cocoa', hex: '#735E4C' },
      { name: 'Deep Taupe', hex: '#655749' },
      { name: 'Dark Mocha', hex: '#4C4036' },
    ],
  },
  {
    name: 'Greens',
    colours: [
      { name: 'Pale Sage', hex: '#C4CEBD' },
      { name: 'Soft Sage', hex: '#AAB9A2' },
      { name: 'Sage Green', hex: '#8FA18A' },
      { name: 'Olive', hex: '#8D9167' },
      { name: 'Moss', hex: '#747C59' },
      { name: 'Eucalyptus', hex: '#6F8978' },
      { name: 'Fern', hex: '#5F765C' },
      { name: 'Forest Green', hex: '#3F5A45' },
      { name: 'Deep Green', hex: '#334C3B' },
      { name: 'Bottle Green', hex: '#294538' },
      { name: 'Hunter Green', hex: '#233B31' },
      { name: 'Dark Green', hex: '#1E332B' },
    ],
  },
  {
    name: 'Blues',
    colours: [
      { name: 'Powder Blue', hex: '#C4D4DA' },
      { name: 'Pale Blue', hex: '#B4C9D0' },
      { name: 'Soft Blue', hex: '#9EB8C3' },
      { name: 'Denim Blue', hex: '#718D9B' },
      { name: 'Slate Blue', hex: '#647F8C' },
      { name: 'Dusty Blue', hex: '#748E9B' },
      { name: 'Steel Blue', hex: '#506B78' },
      { name: 'Teal Blue', hex: '#416B70' },
      { name: 'Deep Teal', hex: '#315A5D' },
      { name: 'Navy', hex: '#263D4B' },
      { name: 'Ink Blue', hex: '#243542' },
      { name: 'Midnight Blue', hex: '#1E2B35' },
    ],
  },
  {
    name: 'Yellows',
    colours: [
      { name: 'Pale Yellow', hex: '#F0E3B8' },
      { name: 'Soft Lemon', hex: '#E9D98F' },
      { name: 'Butter', hex: '#E7D28A' },
      { name: 'Primrose', hex: '#E3CB72' },
      { name: 'Ochre', hex: '#C6A24A' },
      { name: 'Mustard', hex: '#B89536' },
      { name: 'Golden Yellow', hex: '#C49A32' },
      { name: 'Muted Gold', hex: '#AA8734' },
      { name: 'Honey', hex: '#B8863B' },
      { name: 'Deep Ochre', hex: '#9A762E' },
      { name: 'Antique Gold', hex: '#8C7130' },
      { name: 'Dark Mustard', hex: '#6F5A27' },
    ],
  },
  {
    name: 'Pinks',
    colours: [
      { name: 'Blush', hex: '#E5C9C5' },
      { name: 'Pale Pink', hex: '#E2C1BD' },
      { name: 'Dusty Pink', hex: '#CFA7A5' },
      { name: 'Rose', hex: '#C68F91' },
      { name: 'Old Rose', hex: '#B77F82' },
      { name: 'Muted Rose', hex: '#A86F73' },
      { name: 'Clay Pink', hex: '#A87973' },
      { name: 'Terracotta Pink', hex: '#B66F63' },
      { name: 'Dusky Rose', hex: '#8F5E63' },
      { name: 'Deep Rose', hex: '#754B51' },
      { name: 'Berry', hex: '#673E48' },
      { name: 'Dark Plum', hex: '#4A303A' },
    ],
  },
  {
    name: 'Terracotta & Reds',
    colours: [
      { name: 'Pale Terracotta', hex: '#D9B19D' },
      { name: 'Soft Terracotta', hex: '#C9937E' },
      { name: 'Clay', hex: '#B97963' },
      { name: 'Terracotta', hex: '#A9624E' },
      { name: 'Burnt Orange', hex: '#A6533B' },
      { name: 'Rust', hex: '#934A36' },
      { name: 'Brick', hex: '#884638' },
      { name: 'Burnt Red', hex: '#793D35' },
      { name: 'Warm Red', hex: '#813C36' },
      { name: 'Deep Red', hex: '#683431' },
      { name: 'Burgundy', hex: '#552F32' },
      { name: 'Dark Red', hex: '#45282A' },
    ],
  },
  {
    name: 'Dark Colours',
    colours: [
      { name: 'Deep Charcoal', hex: '#30302E' },
      { name: 'Soft Black', hex: '#292A28' },
      { name: 'Blackened Green', hex: '#27352F' },
      { name: 'Blackened Blue', hex: '#27323A' },
      { name: 'Deep Navy', hex: '#202D36' },
      { name: 'Deep Teal', hex: '#203532' },
      { name: 'Dark Olive', hex: '#3B4030' },
      { name: 'Deep Brown', hex: '#3F322A' },
      { name: 'Espresso', hex: '#342A25' },
      { name: 'Dark Plum', hex: '#392B34' },
      { name: 'Blackened Red', hex: '#392726' },
      { name: 'True Black', hex: '#171817' },
    ],
  },
];

const panellingIcons: Record<PanellingStyle, React.ReactNode> = {
  [PanellingStyle.TONGUE_AND_GROOVE]: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M17 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  [PanellingStyle.VICTORIAN]: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="5" width="16" height="14" rx="1" stroke="currentColor" strokeWidth="2"/>
      <rect x="7" y="8" width="10" height="8" rx="0.5" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  [PanellingStyle.SHAKER]: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="16" height="16" rx="1" stroke="currentColor" strokeWidth="2"/>
      <path d="M12 4V20" stroke="currentColor" strokeWidth="2"/>
      <path d="M4 12H20" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
};

/* =========================================================
   PAINT COLOUR PICKER
   ========================================================= */

interface PaintColourPickerProps {
  selectedHex: string | null;
  onSelect: (colour: PaintColour) => void;
}

const PaintColourPicker: React.FC<PaintColourPickerProps> = ({
  selectedHex,
  onSelect,
}) => {
  const [activeFamily, setActiveFamily] = useState(0);

  const currentFamily = PAINT_FAMILIES[activeFamily];

  return (
    <div className="space-y-5 min-w-0 max-w-full">

      <div className="min-w-0">
        <div className="mb-3">
          <h4 className="text-sm font-medium tracking-wide text-gold">
            Browse Colours
          </h4>
          <p className="text-xs text-text-secondary mt-1">
            Choose a colour to preview in your room.
          </p>
        </div>

        {/* This scrolls horizontally INSIDE the colour picker only */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-full">
          {PAINT_FAMILIES.map((family, index) => (
            <button
              key={family.name}
              type="button"
              onClick={() => setActiveFamily(index)}
              className={`
                flex-shrink-0 px-3.5 py-2 rounded-full border text-xs font-medium
                transition-all duration-200 whitespace-nowrap
                ${
                  activeFamily === index
                    ? 'border-gold bg-gold text-background'
                    : 'border-border bg-background text-text-secondary hover:border-gold/60 hover:text-text-primary'
                }
              `}
            >
              {family.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 min-w-0">
        {currentFamily.colours.map((colour) => {
          const isSelected =
            selectedHex?.toLowerCase() === colour.hex.toLowerCase();

          return (
            <button
              key={colour.hex}
              type="button"
              onClick={() => onSelect(colour)}
              aria-label={`Select ${colour.name}`}
              title={`${colour.name} ${colour.hex}`}
              className="group flex flex-col items-center gap-1.5 min-w-0"
            >
              <span
                className={`
                  relative block w-full aspect-square rounded-xl border
                  transition-all duration-200
                  ${
                    isSelected
                      ? 'border-gold ring-2 ring-gold ring-offset-2 ring-offset-surface scale-[1.03]'
                      : 'border-border/70 group-hover:border-gold/60 group-hover:scale-[1.02]'
                  }
                `}
                style={{ backgroundColor: colour.hex }}
              >
                {isSelected && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="w-5 h-5 rounded-full border-2 border-white/90 shadow-lg"
                      style={{ backgroundColor: colour.hex }}
                    />
                  </span>
                )}
              </span>

              <span
                className={`
                  text-[10px] leading-tight text-center line-clamp-2 max-w-full
                  ${
                    isSelected
                      ? 'text-gold font-semibold'
                      : 'text-text-secondary group-hover:text-text-primary'
                  }
                `}
              >
                {colour.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.PAINT);
  const [roomImage, setRoomImage] = useState<File | null>(null);
  const [originalRoom, setOriginalRoom] = useState<{ base64: string; mimeType: string } | null>(null);

  // Wallpaper state
  const [styleImage, setStyleImage] = useState<File | null>(null);

  // Paint state
  const [paintNameQuery, setPaintNameQuery] = useState<string>('');
  const [paintSampleImage, setPaintSampleImage] = useState<File | null>(null);
  const [paintSampleHex, setPaintSampleHex] = useState<string | null>(null);

  // Panelling state
  const [panellingStyle, setPanellingStyle] = useState<PanellingStyle>(PanellingStyle.TONGUE_AND_GROOVE);
  const [panellingHeight, setPanellingHeight] = useState<PanellingHeight>(PanellingHeight.HALF_WALL);
  const [panellingColorQuery, setPanellingColorQuery] = useState<string>('Off-white');

  const [result, setResult] = useState<{ type: 'image' | 'text' | 'search'; data: any; sources?: GroundingChunk[] } | null>(null);
  const [lastUnalteredResult, setLastUnalteredResult] = useState<{ base64: string; mimeType: string } | null>(null);
  const [history, setHistory] = useState<{ base64: string; mimeType: string }[]>([]);
  const [future, setFuture] = useState<{ base64: string; mimeType: string }[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Preparing your design...');
  const [error, setError] = useState<string | null>(null);

  const [designIdeas, setDesignIdeas] = useState<{ideas: string[], sources?: GroundingChunk[]} | null>(null);
  const [selectedIdeas, setSelectedIdeas] = useState<string[]>([]);

  // Modal State
  const [activeModal, setActiveModal] = useState<'about' | 'privacy' | 'terms' | 'contact' | null>(null);

  // Usage tracking
  const [usageCount, setUsageCount] = useState(0);
  const [showLimitModal, setShowLimitModal] = useState(false);

  useEffect(() => {
    const data = getUsageData();
    setUsageCount(data.count);
  }, []);

  const resultRef = useRef<HTMLDivElement>(null);

  const remainingGenerations = WEEKLY_LIMIT - usageCount;

  const contextSummary = useMemo(() => {
    switch (activeTab) {
      case Tab.PAINT:
        return paintNameQuery || paintSampleHex || 'Sample Upload';

      case Tab.WALLPAPER:
        return styleImage ? 'Custom Upload' : null;

      case Tab.PANELLING:
        return `${panellingStyle} (${panellingHeight}) in ${panellingColorQuery}`;

      case Tab.DESIGN_IDEAS:
        return selectedIdeas.length > 0 ? selectedIdeas.join(', ') : 'Generated Ideas';

      default:
        return null;
    }
  }, [
    activeTab,
    paintNameQuery,
    paintSampleHex,
    styleImage,
    panellingStyle,
    panellingHeight,
    panellingColorQuery,
    selectedIdeas
  ]);

  const handleRoomImageSelect = async (file: File | null) => {
    setRoomImage(file);
    setResult(null);
    setLastUnalteredResult(null);
    setHistory([]);
    setFuture([]);
    setDesignIdeas(null);
    setSelectedIdeas([]);
    setError(null);

    if (file) {
      setIsLoading(true);
      setLoadingMessage('Loading room image...');

      try {
        const base64 = await fileToBase64(file);
        setOriginalRoom({ base64, mimeType: file.type });
      } catch (e) {
        setError('Could not read the selected image file. Please try another file.');
        setOriginalRoom(null);
      } finally {
        setIsLoading(false);
      }
    } else {
      setOriginalRoom(null);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);

    if (result?.type !== 'image') {
      setResult(null);
      setLastUnalteredResult(null);
      setHistory([]);
      setFuture([]);
    }

    setError(null);
    setStyleImage(null);
    setPaintNameQuery('');
    setPaintSampleImage(null);
    setPaintSampleHex(null);
    setPanellingStyle(PanellingStyle.TONGUE_AND_GROOVE);
    setPanellingHeight(PanellingHeight.HALF_WALL);
    setPanellingColorQuery('Off-white');
  };

  const handlePaintSampleSelect = async (file: File | null) => {
    setPaintSampleImage(file);

    if (file) {
      try {
        const hex = await getHexFromFile(file);

        setPaintSampleHex(hex);
        setPaintNameQuery('');
      } catch (e) {
        console.error("Failed to extract color from sample", e);
        setError("Could not extract color from the image sample.");
        setPaintSampleHex(null);
      }
    } else {
      setPaintSampleHex(null);
    }
  };

  const handlePaletteColourSelect = (colour: PaintColour) => {
    setPaintNameQuery(colour.name);
    setPaintSampleHex(colour.hex);
    setPaintSampleImage(null);
    setError(null);
  };

  const incrementUsage = () => {
    const data = getUsageData();
    const newData = { ...data, count: data.count + 1 };

    saveUsageData(newData);
    setUsageCount(newData.count);
  };

  const handleSubmit = useCallback(async () => {
    const currentUsage = getUsageData();

    if (currentUsage.count >= WEEKLY_LIMIT) {
      setShowLimitModal(true);
      return;
    }

    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      resultRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);

    const imageSource = originalRoom;

    setResult(null);

    try {
      if (!imageSource) {
        throw new Error('Please upload a room image.');
      }

      let generatedImage: { base64: string; mimeType: string };

      if (activeTab === Tab.WALLPAPER) {
        if (!styleImage) {
          throw new Error('Please upload or paste a wallpaper sample.');
        }

        setLoadingMessage('Preparing wallpaper...');

        const styleBase64 = await fileToBase64(styleImage);
        const wallpaperSwatch = {
          base64: styleBase64,
          mimeType: styleImage.type
        };

        setLoadingMessage('Analysing wallpaper pattern...');

        const croppedWallpaper = await extractPatternFromImage(
          wallpaperSwatch.base64,
          wallpaperSwatch.mimeType
        );

        setLoadingMessage('Applying wallpaper to room...');

        generatedImage = await applyStyle(
          imageSource.base64,
          imageSource.mimeType,
          croppedWallpaper.base64,
          croppedWallpaper.mimeType
        );

      } else if (activeTab === Tab.PAINT) {
        if (!paintNameQuery && !paintSampleHex) {
          throw new Error('Please choose a paint colour, enter a colour, or upload a sample.');
        }

        if (paintNameQuery.trim()) {
          logPaintSearch(paintNameQuery);
        }

        setLoadingMessage('Analysing paint color...');

        generatedImage = await applyPaintColor(
          imageSource.base64,
          imageSource.mimeType,
          paintNameQuery,
          paintSampleHex
        );

      } else if (activeTab === Tab.PANELLING) {
        if (!panellingStyle || !panellingHeight || !panellingColorQuery) {
          throw new Error('Please select panelling style, height, and color.');
        }

        setLoadingMessage('Designing panelling...');

        generatedImage = await applyPanelling(
          imageSource.base64,
          imageSource.mimeType,
          panellingStyle,
          panellingHeight,
          panellingColorQuery
        );

      } else {
        throw new Error("Invalid tab selection.");
      }

      setLoadingMessage('Adding final touches...');

      setLastUnalteredResult(generatedImage);
      setHistory([]);
      setFuture([]);

      incrementUsage();

      const watermarkedImage = await addWatermark(
        generatedImage.base64,
        'Blank Canvas AI'
      );

      setResult({
        type: 'image',
        data: watermarkedImage
      });

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('Preparing your design...');
    }
  }, [
    activeTab,
    originalRoom,
    styleImage,
    paintNameQuery,
    paintSampleHex,
    panellingStyle,
    panellingHeight,
    panellingColorQuery,
  ]);

  const handleEditSubmit = useCallback(async (prompt: string) => {
    if (!lastUnalteredResult || !prompt) {
      setError('An image must be present to edit.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const currentImage = { ...lastUnalteredResult };

      const generatedImage = await editText(
        lastUnalteredResult.base64,
        lastUnalteredResult.mimeType,
        prompt
      );

      setHistory(prev => [...prev, currentImage]);
      setFuture([]);
      setLastUnalteredResult(generatedImage);

      const watermarkedImage = await addWatermark(
        generatedImage.base64,
        'Blank Canvas AI'
      );

      setResult({
        type: 'image',
        data: watermarkedImage
      });

    } catch (err: any) {
      setError(
        err.message ||
        'An unexpected error occurred during edit.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [lastUnalteredResult]);

  const handleUndo = useCallback(async () => {
    if (
      history.length === 0 ||
      isLoading ||
      !lastUnalteredResult
    ) {
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Reverting last change...');

    try {
      const newHistory = [...history];
      const previousImage = newHistory.pop()!;
      const currentImage = { ...lastUnalteredResult };

      setFuture(prev => [currentImage, ...prev]);
      setHistory(newHistory);
      setLastUnalteredResult(previousImage);

      const watermarkedImage = await addWatermark(
        previousImage.base64,
        'Blank Canvas AI'
      );

      setResult({
        type: 'image',
        data: watermarkedImage
      });

    } catch (err: any) {
      setError('Could not undo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [history, lastUnalteredResult, isLoading]);

  const handleRedo = useCallback(async () => {
    if (
      future.length === 0 ||
      isLoading ||
      !lastUnalteredResult
    ) {
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Redoing last change...');

    try {
      const newFuture = [...future];
      const nextImage = newFuture.shift()!;
      const currentImage = { ...lastUnalteredResult };

      setHistory(prev => [...prev, currentImage]);
      setFuture(newFuture);
      setLastUnalteredResult(nextImage);

      const watermarkedImage = await addWatermark(
        nextImage.base64,
        'Blank Canvas AI'
      );

      setResult({
        type: 'image',
        data: watermarkedImage
      });

    } catch (err: any) {
      setError('Could not redo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [future, lastUnalteredResult, isLoading]);

  const handleGetDesignIdeas = useCallback(async () => {
    const imageSource = lastUnalteredResult || originalRoom;

    if (!imageSource) {
      setError("Please upload a room image first.");
      return;
    }

    setError(null);
    setIsLoading(true);
    setLoadingMessage('Generating design ideas...');
    setDesignIdeas(null);
    setSelectedIdeas([]);

    try {
      const response = await getDesignIdeasFromImage(
        imageSource.base64,
        imageSource.mimeType
      );

      const parsedIdeas = response.text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.startsWith('* ') || line.startsWith('- '))
        .map(line => line.replace(/^[\*\-]\s*/, ''))
        .filter(Boolean);

      if (parsedIdeas.length === 0) {
        throw new Error("The AI didn't return any design ideas. Try again.");
      }

      setDesignIdeas({
        ideas: parsedIdeas,
        sources: response.sources
      });

    } catch (err: any) {
      setError(
        err.message ||
        'An unexpected error occurred while getting design ideas.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [originalRoom, lastUnalteredResult]);

  const handleIdeaSelectionChange = (idea: string) => {
    setSelectedIdeas(prevSelectedIdeas => {
      if (prevSelectedIdeas.includes(idea)) {
        return prevSelectedIdeas.filter(i => i !== idea);
      }

      return [...prevSelectedIdeas, idea];
    });
  };

  const handleImplementIdeas = useCallback(async () => {
    const imageSource = lastUnalteredResult || originalRoom;

    if (!imageSource || selectedIdeas.length === 0) {
      return;
    }

    setError(null);
    setIsLoading(true);
    setLoadingMessage('Implementing design ideas...');

    try {
      const currentImage = lastUnalteredResult
        ? { ...lastUnalteredResult }
        : null;

      const combinedIdeaPrompt =
        `Implement the following design ideas: ${
          selectedIdeas.map(idea => `\n- ${idea}`).join('')
        }`;

      const generatedImage = await implementDesignIdeas(
        imageSource.base64,
        imageSource.mimeType,
        combinedIdeaPrompt
      );

      if (currentImage) {
        setHistory(prev => [...prev, currentImage]);
        setFuture([]);
      }

      setLastUnalteredResult(generatedImage);
      incrementUsage();

      const watermarkedImage = await addWatermark(
        generatedImage.base64,
        'Blank Canvas AI'
      );

      setResult({
        type: 'image',
        data: watermarkedImage
      });

      setDesignIdeas(null);
      setSelectedIdeas([]);

    } catch (err: any) {
      setError(
        err.message ||
        'An unexpected error occurred while implementing ideas.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [originalRoom, lastUnalteredResult, selectedIdeas]);

  const isSubmitDisabled = useMemo(() => {
    if (isLoading || !originalRoom) {
      return true;
    }

    if (activeTab === Tab.WALLPAPER) {
      return !styleImage;
    }

    if (activeTab === Tab.PAINT) {
      return !paintNameQuery.trim() && !paintSampleHex;
    }

    if (activeTab === Tab.PANELLING) {
      return (
        !panellingStyle ||
        !panellingHeight ||
        !panellingColorQuery.trim()
      );
    }

    return false;
  }, [
    isLoading,
    activeTab,
    originalRoom,
    styleImage,
    paintNameQuery,
    paintSampleHex,
    panellingStyle,
    panellingHeight,
    panellingColorQuery
  ]);

  const FormLabel: React.FC<{
    children: React.ReactNode;
    className?: string;
  }> = ({
    children,
    className
  }) => (
    <label
      className={`block text-2xl font-serif text-gold mb-2 ${className || ''}`}
    >
      {children}
    </label>
  );

  const renderControls = () => {
    const commonRoomUploader = (
      <div className="flex flex-col gap-1 min-w-0 max-w-full">
        <ImageUploader
          id="room-image"
          label={<FormLabel>1. Your Room</FormLabel>}
          onImageSelect={handleRoomImageSelect}
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
              />
            </svg>
          }
          imageFile={roomImage}
        />

        {roomImage && (
          <button
            type="button"
            onClick={() => handleRoomImageSelect(null)}
            className="self-center mt-2 px-4 py-2 text-xs font-bold text-text-secondary hover:text-gold border border-border hover:border-gold/50 rounded-full transition-all duration-200 flex items-center gap-2 bg-background/50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357-2H15"
              />
            </svg>
            New Photo
          </button>
        )}
      </div>
    );

    switch (activeTab) {
      case Tab.WALLPAPER:
        return (
          <div className="space-y-6 min-w-0 max-w-full">
            {commonRoomUploader}

            <div className="min-w-0 max-w-full">
              <FormLabel>2. Choose Wallpaper Style</FormLabel>

              <div className="flex flex-col gap-1 min-w-0">
                <ImageUploader
                  id="style-image"
                  label=""
                  onImageSelect={(file) => setStyleImage(file)}
                  imageFile={styleImage}
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                      />
                    </svg>
                  }
                  promptText="Upload or paste wallpaper"
                />

                {styleImage && (
                  <button
                    type="button"
                    onClick={() => setStyleImage(null)}
                    className="self-center mt-2 px-4 py-2 text-xs font-bold text-text-secondary hover:text-gold border border-border hover:border-gold/50 rounded-full transition-all duration-200 flex items-center gap-2 bg-background/50"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357-2H15"
                      />
                    </svg>
                    New Wallpaper
                  </button>
                )}
              </div>

              <p className="text-xs text-center text-text-secondary font-medium mt-2 px-2">
                Find wallpaper online, screenshot or{' '}
                <span className="font-bold text-gold/80">
                  Copy Image
                </span>
                , then paste in the box above. The AI will crop the pattern for you.
              </p>
            </div>
          </div>
        );

      case Tab.PAINT:
        return (
          <div className="space-y-6 min-w-0 max-w-full">
            {commonRoomUploader}

            <div className="space-y-7 min-w-0 max-w-full">

              <div>
                <FormLabel>2. Upload Paint Colour Sample</FormLabel>

                <ImageUploader
                  id="paint-sample"
                  label=""
                  onImageSelect={handlePaintSampleSelect}
                  icon={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"
                      />
                    </svg>
                  }
                  imageFile={paintSampleImage}
                  promptText="Upload swatch, photo, or screenshot"
                />

                {paintSampleHex && (
                  <div className="mt-3 flex items-center justify-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg border border-border shadow-sm"
                      style={{ backgroundColor: paintSampleHex }}
                    />

                    <div>
                      <p className="text-xs text-text-secondary">
                        Colour detected
                      </p>
                      <p className="text-xs font-mono text-gold">
                        {paintSampleHex}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center min-w-0">
                <div className="flex-grow border-t border-border min-w-0" />
                <span className="flex-shrink-0 mx-4 text-xs text-text-secondary">
                  OR
                </span>
                <div className="flex-grow border-t border-border min-w-0" />
              </div>

              <div className="min-w-0 max-w-full">
                <FormLabel>3. Browse Colours</FormLabel>

                <PaintColourPicker
                  selectedHex={paintSampleHex}
                  onSelect={handlePaletteColourSelect}
                />

                {paintSampleHex && paintNameQuery && (
                  <div className="mt-5 p-4 rounded-xl border border-gold/40 bg-background/50 min-w-0 max-w-full">
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className="w-14 h-14 rounded-lg border border-gold/60 shadow-lg flex-shrink-0"
                        style={{ backgroundColor: paintSampleHex }}
                      />

                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-widest text-text-secondary">
                          Selected Colour
                        </p>
                        <p className="font-serif text-lg text-gold truncate">
                          {paintNameQuery}
                        </p>
                        <p className="text-xs font-mono text-text-secondary">
                          {paintSampleHex}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center min-w-0">
                <div className="flex-grow border-t border-border min-w-0" />
                <span className="flex-shrink-0 mx-4 text-xs text-text-secondary">
                  OR
                </span>
                <div className="flex-grow border-t border-border min-w-0" />
              </div>

              <div className="min-w-0 max-w-full">
                <FormLabel>4. Enter Paint Colour</FormLabel>

                <input
                  type="text"
                  value={paintNameQuery}
                  onChange={(e) => {
                    const value = e.target.value;

                    setPaintNameQuery(value);

                    if (value) {
                      setPaintSampleHex(null);
                      setPaintSampleImage(null);
                    }
                  }}
                  placeholder="e.g. Hague Blue or dark green"
                  className="w-full max-w-full min-w-0 p-3 bg-background border border-border rounded-lg focus:ring-gold focus:border-gold transition text-text-primary placeholder:text-text-secondary/60"
                />

                <p className="text-xs text-text-secondary mt-2">
                  Enter a specific paint name for an exact match, or simply describe the colour you want.
                </p>
              </div>

            </div>
          </div>
        );

      case Tab.PANELLING:
        return (
          <div className="space-y-6 min-w-0 max-w-full">
            {commonRoomUploader}

            <div className="min-w-0 max-w-full">
              <FormLabel>2. Design Your Panelling</FormLabel>

              <div className="space-y-4 min-w-0">
                <div>
                  <h4 className="block text-sm font-medium text-gold mb-2">
                    Style
                  </h4>

                  <div className="grid grid-cols-3 gap-2 min-w-0">
                    {Object.values(PanellingStyle).map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setPanellingStyle(style)}
                        className={`min-w-0 px-3 py-3 h-28 flex flex-col items-center justify-center gap-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          panellingStyle === style
                            ? 'bg-gold text-background'
                            : 'bg-surface text-text-primary hover:bg-border'
                        }`}
                      >
                        {panellingIcons[style]}
                        <span className="leading-tight text-center">
                          {style}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="block text-sm font-medium text-gold mb-2">
                    Height
                  </h4>

                  <div className="grid grid-cols-3 gap-2 min-w-0">
                    {Object.values(PanellingHeight).map((height) => (
                      <button
                        key={height}
                        type="button"
                        onClick={() => setPanellingHeight(height)}
                        className={`min-w-0 px-3 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                          panellingHeight === height
                            ? 'bg-gold text-background'
                            : 'bg-surface text-text-primary hover:bg-border'
                        }`}
                      >
                        {height}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="min-w-0">
                  <h4 className="block text-sm font-medium text-gold mb-2">
                    Colour
                  </h4>

                  <input
                    type="text"
                    value={panellingColorQuery}
                    onChange={(e) =>
                      setPanellingColorQuery(e.target.value)
                    }
                    placeholder="e.g. Off-white, dark charcoal grey"
                    className="w-full max-w-full min-w-0 p-2 bg-background border border-border rounded-lg focus:ring-gold focus:border-gold transition"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case Tab.DESIGN_IDEAS:
        return (
          <div className="space-y-6 min-w-0 max-w-full">
            {commonRoomUploader}

            {originalRoom ? (
              <div className="space-y-4 min-w-0 max-w-full">
                <h3 className="text-2xl font-bold font-serif text-gold">
                  Design Enhancement
                </h3>

                <p className="text-sm text-text-secondary">
                  AI will scan your room and suggest some interior design ideas.
                </p>

                {!designIdeas ? (
                  <button
                    type="button"
                    onClick={handleGetDesignIdeas}
                    disabled={isLoading}
                    className="w-full max-w-full px-4 py-3 font-bold rounded-full text-lg bg-gradient-to-br from-gold-dark to-gold text-background"
                  >
                    Get Design Ideas
                  </button>
                ) : (
                  <div className="space-y-4 min-w-0">
                    <div className="space-y-2 mt-2 min-w-0">
                      {designIdeas.ideas.map((idea, index) => (
                        <label
                          key={index}
                          className="flex items-start min-w-0 p-3 bg-surface/50 rounded-lg cursor-pointer hover:bg-border/50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedIdeas.includes(idea)}
                            onChange={() =>
                              handleIdeaSelectionChange(idea)
                            }
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-gold focus:ring-gold flex-shrink-0"
                          />

                          <span className="ml-3 min-w-0 text-sm text-text-primary">
                            {idea}
                          </span>
                        </label>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={handleImplementIdeas}
                      disabled={
                        isLoading ||
                        selectedIdeas.length === 0
                      }
                      className="w-full max-w-full px-4 py-3 font-bold rounded-full text-lg bg-cta-blue text-white"
                    >
                      Implement Selected Ideas
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center p-4 bg-surface rounded-lg min-w-0">
                <p className="font-semibold font-serif text-gold text-lg">
                  Upload a Room Image
                </p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen w-full max-w-full min-w-0 overflow-x-hidden bg-background text-text-primary font-sans flex flex-col relative">

      {showSplash ? (
        <SplashScreen onFinish={() => setShowSplash(false)} />
      ) : (
        <>
          <Header />

          {/* Usage Notice Banner */}
          <div className="w-full max-w-full min-w-0 bg-surface border-b border-border/50 px-4 py-3 overflow-x-hidden">
            <p className="text-center text-sm text-text-secondary">
              Free plan:{' '}
              <span className="text-gold font-semibold">
                {Math.max(0, remainingGenerations)} of {WEEKLY_LIMIT} designs remaining
              </span>{' '}
              this week. Resets every 7 days.
            </p>
          </div>

          <main className="flex-grow w-full max-w-full min-w-0 overflow-x-hidden container mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-12">

            <div className="mb-8 min-w-0 max-w-full">
              <TabSelector
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full w-full max-w-full min-w-0">

              <div className="lg:col-span-1 min-w-0 w-full max-w-full bg-surface p-6 rounded-xl border border-border/50">

                {renderControls()}

                <div className="mt-8 min-w-0 max-w-full">
                  {activeTab !== Tab.DESIGN_IDEAS && (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitDisabled}
                      className="w-full max-w-full px-4 py-3 font-bold rounded-full text-lg bg-gradient-to-br from-gold-dark to-gold text-background shadow-lg hover:brightness-110 disabled:bg-gold/40"
                    >
                      Generate Image
                    </button>
                  )}

                  {error && (
                    <p className="mt-4 text-sm text-red-400 bg-red-900/50 p-3 rounded-md text-center break-words">
                      {error}
                    </p>
                  )}
                </div>

              </div>

              <div
                ref={resultRef}
                className="lg:col-span-2 min-w-0 w-full max-w-full min-h-[60vh] relative bg-surface border border-border/50 rounded-xl overflow-hidden"
              >
                {isLoading && (
                  <Loader message={loadingMessage} />
                )}

                <ResultDisplay
                  result={result}
                  onEditSubmit={handleEditSubmit}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  canUndo={history.length > 0}
                  canRedo={future.length > 0}
                  isLoading={isLoading}
                  activeTab={activeTab}
                  contextSummary={contextSummary}
                />
              </div>

            </div>
          </main>

          <BottomBanner isVisible={SHOW_ADS} />

          <Footer
            onOpenModal={(type) => setActiveModal(type)}
          />

          {/* Limit Reached Modal */}
          <Modal
            isOpen={showLimitModal}
            onClose={() => setShowLimitModal(false)}
            title="Weekly Limit Reached"
          >
            <p>
              You've used all <strong>{WEEKLY_LIMIT} free designs</strong> for this week.
              Your allowance resets every 7 days.
            </p>

            <p className="pt-2 text-sm text-text-secondary">
              Come back next week for more free designs, or stay tuned — we'll be introducing an unlimited plan soon!
            </p>
          </Modal>

          {/* About */}
          <Modal
            isOpen={activeModal === 'about'}
            onClose={() => setActiveModal(null)}
            title="About Blank Canvas AI"
          >
            <p>
              Blank Canvas AI helps users explore paint colours, wallpaper,
              panelling and interior design ideas using AI-generated visual inspiration.
              The app is designed to support creative decision-making and early-stage exploration.
            </p>

            <p className="font-semibold text-gold pt-2 italic">
              AI-generated results are for inspiration only and may not represent
              exact real-world colours or finishes. Always verify with physical samples
              before purchase or installation.
            </p>
          </Modal>

          {/* Privacy */}
          <Modal
            isOpen={activeModal === 'privacy'}
            onClose={() => setActiveModal(null)}
            title="Privacy Policy"
          >
            <p>Blank Canvas AI respects your privacy.</p>

            <p>
              We may use Google AdSense to display advertisements.
              Google and its partners may use cookies or similar technologies
              to serve ads based on visits to this and other websites.
            </p>

            <p>
              We may collect anonymous usage data (such as feature interactions
              and search activity) to help improve the app experience.
              No personally identifiable information is collected or stored.
            </p>

            <p>
              Third-party vendors, including Google, may place and read cookies
              on users' browsers or use web beacons or IP addresses to collect
              information as a result of ad serving.
            </p>

            <p>
              Users can learn more about how Google uses data here:{' '}
              <a
                href="https://policies.google.com/technologies/partner-sites"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold underline"
              >
                Google Partner Site Policies
              </a>
            </p>

            <p className="pt-2 text-sm italic opacity-70">
              By using this app, you consent to this Privacy Policy.
            </p>
          </Modal>

          {/* Terms */}
          <Modal
            isOpen={activeModal === 'terms'}
            onClose={() => setActiveModal(null)}
            title="Terms of Use"
          >
            <p>
              Blank Canvas AI is provided for informational and inspirational purposes only.
            </p>

            <p>
              AI-generated content should not be considered professional advice.
              Users are responsible for verifying all information, colours, and materials
              before making purchasing or design decisions.
            </p>

            <p>
              We make no guarantees regarding accuracy, availability, or suitability
              of the generated content. Use of the app is at your own discretion and risk.
            </p>
          </Modal>

          {/* Contact */}
          <Modal
            isOpen={activeModal === 'contact'}
            onClose={() => setActiveModal(null)}
            title="Contact Us"
          >
            <p>
              For questions, feedback, or support, please contact:
            </p>

            <p className="text-xl font-bold text-gold py-4 break-words">
              Chateautroiscloches@gmail.com
            </p>
          </Modal>
        </>
      )}
    </div>
  );
};

export default App;
