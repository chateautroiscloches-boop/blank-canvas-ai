import React, { useState } from 'react';

interface EditBarProps {
  onEditSubmit: (prompt: string) => Promise<void>;
  isLoading: boolean;
}

const EditBar: React.FC<EditBarProps> = ({ onEditSubmit, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onEditSubmit(prompt).then(() => {
      setPrompt(''); // Clear prompt after submission is handled
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex-shrink-0 mt-4 p-3 bg-surface/50 backdrop-blur-sm rounded-lg border border-border/50">
      <div className="flex flex-col gap-2 w-full">
        <label htmlFor="edit-prompt" className="font-serif text-gold text-lg">✨ Magic AI Edit</label>
        <div className="flex items-start gap-2">
            <textarea
              id="edit-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want to change, add, or remove. Be as specific as you can for best results. For example, 'Add a large houseplant in the corner' or 'Change the sofa to a blue velvet one'."
              className="w-full p-2 bg-background border border-border rounded-lg focus:ring-gold focus:border-gold transition text-sm flex-grow h-20 resize-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="px-4 py-2 font-bold rounded-full text-base h-20 bg-gradient-to-br from-gold-dark to-gold text-background shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),0_2px_4px_rgba(0,0,0,0.4)] hover:brightness-110 transition-all duration-300 disabled:bg-none disabled:bg-gold/40 disabled:shadow-none disabled:brightness-100 disabled:text-text-secondary disabled:cursor-not-allowed"
            >
              {isLoading ? (
                 <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
              ) : (
                 'Apply'
              )}
            </button>
        </div>
      </div>
    </form>
  );
};

export default EditBar;