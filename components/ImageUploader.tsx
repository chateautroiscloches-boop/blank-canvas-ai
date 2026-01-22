
import React, { useState, useRef, useEffect, useCallback } from 'react';
import CameraCapture from './CameraCapture';

interface ImageUploaderProps {
  id: string;
  label: React.ReactNode;
  onImageSelect: (file: File | null) => void;
  icon: React.ReactElement;
  imageFile?: File | null;
  promptText?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ id, label, onImageSelect, icon, imageFile = null, promptText }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraSupported, setIsCameraSupported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    if (imageFile) {
        objectUrl = URL.createObjectURL(imageFile);
        setPreview(objectUrl);
    } else {
        setPreview(null);
    }
    return () => {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  useEffect(() => {
    if (navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      setIsCameraSupported(true);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    onImageSelect(file || null);
    if (isCameraOpen) {
      setIsCameraOpen(false);
    }
  };

  const handleUploadClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      fileInputRef.current?.click();
  }

  const openCamera = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCameraOpen || !isCameraSupported) return;
    onImageSelect(null);
    setPreview(null);
    setIsCameraOpen(true);
  };
  
  const handleCameraCapture = (file: File) => {
    onImageSelect(file);
    setIsCameraOpen(false);
  };

  useEffect(() => {
    const uploaderElement = uploaderRef.current;
    if (!uploaderElement) return;

    const handlePaste = (event: ClipboardEvent) => {
      event.preventDefault();
      const items = event.clipboardData?.items;
      if (!items) return;

      for (const item of Array.from(items)) {
        if (item.type.indexOf('image') !== -1) {
          const blob = item.getAsFile();
          if (blob) {
            const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type });
            onImageSelect(file);
            if (isCameraOpen) setIsCameraOpen(false);
          }
          break;
        }
      }
    };
    uploaderElement.addEventListener('paste', handlePaste);
    return () => uploaderElement.removeEventListener('paste', handlePaste);
  }, [onImageSelect, isCameraOpen]);

  const renderContent = () => {
    if (isCameraOpen) {
      return (
        <CameraCapture 
            onCapture={handleCameraCapture} 
            onClose={() => setIsCameraOpen(false)}
        />
      );
    }
    
    if (preview) {
      return (
        <img src={preview} alt="Preview" className="h-full w-full object-contain rounded-lg" />
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-6 w-full h-full text-center gap-4">
        <div className="text-gold/80">
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "h-12 w-12" })}
        </div>
        
        {promptText && <p className="text-text-primary font-medium">{promptText}</p>}

        <div className="flex flex-col gap-3 w-full max-w-[260px] z-10">
            <button 
                type="button"
                onClick={handleUploadClick}
                className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-surface border border-border rounded-xl text-text-primary hover:border-gold hover:text-gold transition-all duration-200 shadow-sm group/btn"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover/btn:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="font-semibold">Upload from Device</span>
            </button>

            {isCameraSupported ? (
                <>
                    <div className="text-center font-semibold text-text-primary">OR</div>
                    <button 
                        type="button"
                        onClick={openCamera}
                        className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-gold text-background rounded-xl hover:brightness-110 transition-all duration-200 shadow-md font-bold"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Take a Picture</span>
                    </button>
                </>
            ) : (
                <div className="text-xs text-text-secondary py-2 bg-surface/50 rounded-lg">
                    Camera unavailable on this device
                </div>
            )}
        </div>
        
        <p className="text-xs text-text-secondary/60">or paste image (Ctrl+V)</p>
      </div>
    );
  };

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gold mb-2">{label}</label>}
      <div
        ref={uploaderRef}
        className={`group relative flex justify-center items-center w-full aspect-[3/4] bg-background border-2 border-dashed border-border rounded-lg transition-all duration-300 overflow-hidden ${!preview && 'hover:border-gold/30'}`}
      >
        <input
          id={id}
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {renderContent()}
      </div>
    </div>
  );
};

export default ImageUploader;
