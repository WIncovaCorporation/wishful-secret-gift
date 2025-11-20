import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';

interface ContextualTooltipProps {
  content: React.ReactNode;
  show: boolean;
  onClose: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
  autoCloseDelay?: number;
}

export const ContextualTooltip = ({
  content,
  show,
  onClose,
  position = 'bottom',
  autoCloseDelay = 5000,
}: ContextualTooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      // Small delay for animation
      const showTimer = setTimeout(() => setIsVisible(true), 100);
      
      // Auto-close after delay
      const closeTimer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(closeTimer);
      };
    } else {
      setIsVisible(false);
    }
  }, [show, autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for fade-out animation
  };

  if (!show) return null;

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  return (
    <>
      {/* Backdrop to capture clicks */}
      <div
        className="fixed inset-0 z-40"
        onClick={handleClose}
        aria-hidden="true"
      />
      
      {/* Tooltip */}
      <div
        className={`absolute z-50 ${positionClasses[position]} transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ maxWidth: '300px', minWidth: '250px' }}
      >
        <Card className="bg-gray-900 text-white border-gray-700 shadow-lg p-4">
          <div className="flex justify-between items-start gap-2 mb-2">
            <div className="flex-1">{content}</div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-800"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
        
        {/* Arrow */}
        <div
          className={`absolute ${
            position === 'bottom'
              ? 'bottom-full left-4 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-900'
              : position === 'top'
              ? 'top-full left-4 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-gray-900'
              : position === 'right'
              ? 'right-full top-4 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-gray-900'
              : 'left-full top-4 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-gray-900'
          }`}
        />
      </div>
    </>
  );
};
