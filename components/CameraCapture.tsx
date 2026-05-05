import React, { useState, useRef, useEffect, useCallback } from 'react';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const openCamera = async () => {
      setError(null);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("Camera not supported on this browser.");
        }
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 3840 },
            height: { ideal: 2160 }
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error("Camera access was denied or an error occurred.", err);
        setError("Could not access the camera. Please check your browser permissions and ensure access is allowed for this site.");
      }
    };

    openCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (video && video.srcObject && video.videoWidth > 0) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        // Apply zoom to canvas capture
        const scale = zoom;
        const scaledWidth = canvas.width / scale;
        const scaledHeight = canvas.height / scale;
        const offsetX = (canvas.width - scaledWidth) / 2;
        const offsetY = (canvas.height - scaledHeight) / 2;
        context.drawImage(
          video,
          offsetX, offsetY, scaledWidth, scaledHeight,
          0, 0, canvas.width, canvas.height
        );
        canvas.toBlob(blob => {
          if (blob) {
            const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
            onCapture(file);
          }
        }, 'image/jpeg', 0.95);
      }
    }
  }, [onCapture, zoom]);
  
  if (error) {
    return (
      <div className="text-center text-red-300 flex flex-col items-center justify-center p-4 w-full h-full bg-black">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
        <p className="text-sm font-semibold">Camera Error</p>
        <p className="text-xs mt-1">{error}</p>
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 p-2 bg-gray-900/50 rounded-full text-white hover:bg-gray-800/70"
          aria-label="Close camera"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-black relative overflow-hidden">
      {/* Video with digital zoom via CSS transform */}
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        className="w-full h-full object-contain transition-transform duration-100"
        style={{ transform: `scale(${zoom})` }}
      />
      
      <div className="absolute inset-0 flex flex-col justify-end items-center p-4 bg-black/30">
        
        {/* Zoom Slider */}
        <div className="w-full max-w-xs mb-4 px-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white text-xs">Wide</span>
            <span className="text-white text-xs font-bold">{zoom.toFixed(1)}x</span>
            <span className="text-white text-xs">Zoom</span>
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #d4a853 0%, #d4a853 ${((zoom - 1) / 2) * 100}%, #ffffff40 ${((zoom - 1) / 2) * 100}%, #ffffff40 100%)`
            }}
          />
          <div className="flex justify-between mt-2">
            <button
              type="button"
              onClick={() => setZoom(1)}
              className={`text-white text-xs rounded px-2 py-1 transition-all ${zoom === 1 ? 'bg-gold text-background font-bold' : 'bg-white/20 hover:bg-white/30'}`}
            >
              1x
            </button>
            <button
              type="button"
              onClick={() => setZoom(1.5)}
              className={`text-white text-xs rounded px-2 py-1 transition-all ${zoom === 1.5 ? 'bg-gold text-background font-bold' : 'bg-white/20 hover:bg-white/30'}`}
            >
              1.5x
            </button>
            <button
              type="button"
              onClick={() => setZoom(2)}
              className={`text-white text-xs rounded px-2 py-1 transition-all ${zoom === 2 ? 'bg-gold text-background font-bold' : 'bg-white/20 hover:bg-white/30'}`}
            >
              2x
            </button>
            <button
              type="button"
              onClick={() => setZoom(3)}
              className={`text-white text-xs rounded px-2 py-1 transition-all ${zoom === 3 ? 'bg-gold text-background font-bold' : 'bg-white/20 hover:bg-white/30'}`}
            >
              3x
            </button>
          </div>
        </div>

        {/* Capture Button */}
        <button
          type="button"
          onClick={handleCapture}
          className="p-3 bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white"
          aria-label="Capture photo"
        >
          <svg className="w-8 h-8 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.776 48.776 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
          </svg>
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 p-2 bg-gray-900/50 rounded-full text-white hover:bg-gray-800/70"
          aria-label="Close camera"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CameraCapture;
