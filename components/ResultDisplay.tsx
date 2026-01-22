import React from 'react';
import { Tab, GroundingChunk } from '../types';
import SourceLinks from './SourceLinks';
import ShareButton from './ShareButton';
import EditBar from './EditBar';
import SaveButton from './SaveButton';

interface Result {
  type: 'image' | 'text' | 'search';
  data: any;
  sources?: GroundingChunk[];
}

interface ResultDisplayProps {
  result: Result | null;
  onEditSubmit: (prompt: string) => Promise<void>;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isLoading: boolean;
  activeTab: Tab;
  contextSummary: string | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
  result, 
  onEditSubmit, 
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo, 
  isLoading, 
  activeTab, 
  contextSummary 
}) => {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-secondary text-center p-4">
        <p className="mt-4 text-3xl font-serif italic font-normal text-text-secondary/80">Your Vision Awaits</p>
        <p className="text-sm text-text-secondary/50 mt-2">Your transformed space will appear here.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col overflow-hidden p-4 rounded-md bg-surface/30 relative">
      {result.type === 'image' && (
        <>
          <div className="flex-grow relative overflow-hidden rounded-md group flex items-center justify-center bg-black/20">
            <img src={result.data} alt="Generated result" className="max-w-full max-h-full object-contain shadow-2xl" />
            
            {/* Buttons overlaying the image */}
            <div className="absolute bottom-4 right-4 flex items-center gap-3">
              <SaveButton imageUrl={result.data} activeTab={activeTab} contextSummary={contextSummary} />
              <ShareButton imageUrl={result.data} activeTab={activeTab} contextSummary={contextSummary} />
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
             <div className="flex justify-center gap-8 mt-2">
                {canUndo && (
                  <button
                    onClick={onUndo}
                    disabled={isLoading}
                    className="flex flex-col items-center gap-0.5 text-text-secondary hover:text-gold transition-colors duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="p-2 bg-surface rounded-full border border-border group-hover:border-gold transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">undo last change</span>
                  </button>
                )}

                {canRedo && (
                  <button
                    onClick={onRedo}
                    disabled={isLoading}
                    className="flex flex-col items-center gap-0.5 text-text-secondary hover:text-gold transition-colors duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="p-2 bg-surface rounded-full border border-border group-hover:border-gold transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">redo last change</span>
                  </button>
                )}
             </div>
            
            <EditBar onEditSubmit={onEditSubmit} isLoading={isLoading} />
          </div>
        </>
      )}
      {(result.type === 'text' || result.type === 'search') && (
        <div className="prose prose-invert max-w-none text-text-primary overflow-y-auto">
          <p>{result.data}</p>
          {result.type === 'search' && <SourceLinks sources={result.sources} />}
        </div>
      )}
    </div>
  );
};

export default ResultDisplay;