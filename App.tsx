import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Tab, GroundingChunk, PanellingStyle, PanellingHeight } from './types';
import { fileToBase64, addWatermark, imageUrlToBase64, getHexFromFile } from './utils/fileUtils';
import { applyStyle, editText, getDesignIdeasFromImage, implementDesignIdeas, extractPatternFromImage, applyPanelling, applyPaintColor } from './services/geminiService';
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
      case Tab.PAINT: return paintNameQuery || paintSampleHex || 'Sample Upload';
      case Tab.WALLPAPER: return styleImage ? 'Custom Upload' : null;
      case Tab.PANELLING: return `${panellingStyle} (${panellingHeight}) in ${panellingColorQuery}`;
      case Tab.DESIGN_IDEAS: return selectedIdeas.length > 0 ? selectedIdeas.join(', ') : 'Generated Ideas';
      default: return null;
    }
  }, [activeTab, paintNameQuery, paintSampleHex, styleImage, panellingStyle, panellingHeight, panellingColorQuery, selectedIdeas]);

  const handleRoomImageSelect = async (file: File | null) => {
    setRoomImage(file);
    setResult(null);
    setLastUnalteredResult(null);
