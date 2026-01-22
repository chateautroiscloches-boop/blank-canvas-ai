
import React from 'react';

// The previous base64 string here was corrupted and caused a syntax error.
// It has been removed to restore application functionality.
// To add a logo in the future, ensure the base64 string is valid and properly quoted.
// const logoUrl = 'data:image/png;base64,...';

const Header: React.FC = () => {
  return (
    <header className="pt-6 pb-2 px-4 sm:px-6 lg:px-8 border-b border-border/20">
      <div className="container mx-auto flex flex-col items-center text-center gap-0">
        <h1 className="text-[1.8rem] font-bold font-prata text-gold drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] leading-none mb-1">
          Blank Canvas <span className="text-[0.5em]">AI</span>
        </h1>
        <div className="flex items-center justify-center gap-2 mt-0">
            <p className="text-xs text-gold/60">by Chateau Trois Cloches</p>
            <a
                href="https://instagram.com/chateautroiscloches"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chateau Trois Cloches on Instagram"
                className="text-gold/60 hover:text-gold transition-colors duration-200"
            >
                <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
                >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.011-3.584.069-4.85c.149-3.225 1.664 4.771 4.919 4.919C8.416 2.175 8.796 2.163 12 2.163zm0 1.441c-3.161 0-3.523.012-4.752.069-2.9.132-4.043 1.273-4.175 4.175-.057 1.229-.069 1.591-.069 4.752s.012 3.523.069 4.752c.132 2.902 1.273 4.043 4.175 4.175 1.229.057 1.591.069 4.752.069s3.523-.012 4.752-.069c2.9-.132 4.043 1.273 4.175-4.175.057-1.229.069-1.591.069-4.752s-.012-3.523-.069-4.752c-.132-2.902-1.273-4.043-4.175-4.175-1.229-.057-1.591-.069-4.752-.069z"></path>
                <path d="M12 6.848c-2.835 0-5.152 2.316-5.152 5.152s2.317 5.152 5.152 5.152 5.152-2.316 5.152-5.152-2.317-5.152-5.152-5.152zm0 8.481c-1.841 0-3.333-1.492-3.333-3.333s1.492-3.333 3.333-3.333 3.333 1.492 3.333 3.333-1.492 3.333-3.333 3.333z"></path>
                <path d="M16.949 6.305c-.777 0-1.408.631-1.408 1.408s.631 1.408 1.408 1.408c.777 0 1.408-.631 1.408-1.408s-.631-1.408-1.408-1.408z"></path>
                </svg>
            </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
