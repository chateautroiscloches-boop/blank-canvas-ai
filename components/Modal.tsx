import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/60 transition-all duration-300">
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-surface border border-border/40 rounded-2xl shadow-2xl p-6 sm:p-10 animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-serif text-gold font-bold">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-gold transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="text-text-primary/90 leading-relaxed text-sm sm:text-base space-y-4">
          {children}
        </div>
        <div className="mt-10 pt-6 border-t border-border/20 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-border/40 hover:bg-border/60 text-text-primary text-sm font-bold rounded-full transition-all"
          >
            Close
          </button>
        </div>
      </div>
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
};

export default Modal;