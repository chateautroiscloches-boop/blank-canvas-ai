
import React from 'react';
import { Tab } from '../types';

interface TabSelectorProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TabSelector: React.FC<TabSelectorProps> = ({ activeTab, onTabChange }) => {
  const tabs = Object.values(Tab);

  return (
    <div className="flex w-full border-b border-border/20">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onTabChange(tab)}
          className={`flex-1 py-3 px-1 text-center text-sm sm:text-lg font-bold border-b-2 transition-all duration-200 focus:outline-none whitespace-normal leading-tight flex items-center justify-center ${
            activeTab === tab
              ? 'border-gold text-gold'
              : 'border-transparent text-white hover:text-gray-200 hover:border-border'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
};

export default TabSelector;
