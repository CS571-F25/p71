import React from 'react';
import { BsArrowUp, BsArrowDown, BsDash } from 'react-icons/bs';

export default function TrendIndicator({ value, period }) {
  if (value === null || value === undefined) return <span className="text-muted">-</span>;

  const isPositive = value > 0;
  const isNeutral = value === 0;
  const absoluteValue = Math.abs(value).toFixed(2);
  
  // IMPROVEMENT: Use 'text-white' mixed with color classes for better contrast in dark mode
  let colorClass = 'text-secondary';
  let Icon = BsDash;
  let label = "Neutral trend";

  if (isPositive) {
    colorClass = 'text-success'; // Ensure this green is bright enough (e.g., #22c55e)
    Icon = BsArrowUp;
    label = "Trending up";
  } else if (!isNeutral) {
    colorClass = 'text-danger'; // Ensure this red is bright enough (e.g., #ef4444)
    Icon = BsArrowDown;
    label = "Trending down";
  }

  return (
    <span 
      className={`${colorClass} d-inline-flex align-items-center gap-1 fw-medium`}
      aria-label={`${label}: ${absoluteValue}%`} // Accessibility Fix
      title={`${label}: ${absoluteValue}%`}
    >
      <Icon size={16} strokeWidth={0.5} /> 
      {absoluteValue}%
      {period && <span className="text-white-50 ms-1 small">({period})</span>}
    </span>
  );
}