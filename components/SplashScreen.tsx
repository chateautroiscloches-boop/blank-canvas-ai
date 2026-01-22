import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Start fading out slightly before the full duration ends for a smooth transition
    // Fade out starts at 2.5 seconds
    const fadeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    // Unmount the component exactly at 3 seconds
    const removeTimer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onFinish]);

  return (
    <div 
        className={`fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
        <div className="flex flex-col items-center gap-4">
             {/* Header Section */}
            <div className="text-center mb-6">
                <h1 className="text-[2.5rem] font-bold font-prata text-gold drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] leading-none mb-3">
                  Blank Canvas <span className="text-[0.5em]">AI</span>
                </h1>
                <p className="font-serif italic text-text-secondary text-lg tracking-wide">
                    From Blank Space, to Inspired Place
                </p>
            </div>
        </div>
    </div>
  );
};

export default SplashScreen;