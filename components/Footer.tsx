import React from 'react';

interface FooterProps {
  onOpenModal: (type: 'about' | 'privacy' | 'terms' | 'contact') => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenModal }) => {
  return (
    <footer className="w-full py-8 mt-4 border-t border-border/10">
      <div className="container mx-auto px-4 flex flex-col items-center gap-4">
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <button 
            onClick={() => onOpenModal('about')}
            className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-text-secondary/60 hover:text-gold transition-colors"
          >
            About
          </button>
          <span className="text-text-secondary/20 hidden sm:inline">•</span>
          <button 
            onClick={() => onOpenModal('privacy')}
            className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-text-secondary/60 hover:text-gold transition-colors"
          >
            Privacy
          </button>
          <span className="text-text-secondary/20 hidden sm:inline">•</span>
          <button 
            onClick={() => onOpenModal('terms')}
            className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-text-secondary/60 hover:text-gold transition-colors"
          >
            Terms
          </button>
          <span className="text-text-secondary/20 hidden sm:inline">•</span>
          <button 
            onClick={() => onOpenModal('contact')}
            className="text-[10px] sm:text-xs font-medium uppercase tracking-widest text-text-secondary/60 hover:text-gold transition-colors"
          >
            Contact
          </button>
        </nav>
        <p className="text-[10px] text-text-secondary/30 uppercase tracking-tighter">
          © {new Date().getFullYear()} Chateau Trois Cloches
        </p>
      </div>
    </footer>
  );
};

export default Footer;