import React, { useEffect, useRef, useState } from 'react';

interface CountUpNumberProps {
  value: number;
  durationMs?: number;
  className?: string;
}

export const CountUpNumber: React.FC<CountUpNumberProps> = ({ value, durationMs = 1200, className }) => {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);
  const valueRef = useRef(value);

  useEffect(() => {
    fromRef.current = display;
    valueRef.current = value;
    startRef.current = null;

    const step = (ts: number) => {
      if (startRef.current == null) startRef.current = ts;
      const progress = Math.min(1, (ts - startRef.current) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const next = Math.round(fromRef.current + (valueRef.current - fromRef.current) * eased);
      setDisplay(next);
      if (progress < 1) requestAnimationFrame(step);
    };
    const raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className={["tabular-nums", className || 'font-semibold text-base sm:text-lg text-gray-800'].filter(Boolean).join(' ')}>
      {display.toLocaleString()}
    </span>
  );
};
