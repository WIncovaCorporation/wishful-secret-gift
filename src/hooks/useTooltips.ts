import { useState, useEffect } from 'react';

interface TooltipsSeen {
  create_exchange?: boolean;
  invite?: boolean;
  wishlist?: boolean;
  dashboard?: boolean;
}

const TOOLTIPS_STORAGE_KEY = 'tooltips_seen';

export const useTooltips = () => {
  const [tooltipsSeen, setTooltipsSeen] = useState<TooltipsSeen>(() => {
    try {
      const stored = localStorage.getItem(TOOLTIPS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const shouldShowTooltip = (key: keyof TooltipsSeen): boolean => {
    return !tooltipsSeen[key];
  };

  const markTooltipAsSeen = (key: keyof TooltipsSeen) => {
    const updated = { ...tooltipsSeen, [key]: true };
    setTooltipsSeen(updated);
    try {
      localStorage.setItem(TOOLTIPS_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save tooltip state:', error);
    }
  };

  return {
    shouldShowTooltip,
    markTooltipAsSeen,
  };
};
