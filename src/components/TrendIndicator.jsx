import React from 'react';
import { BsArrowUp, BsArrowDown, BsDash } from 'react-icons/bs';

export default function TrendIndicator({ value, period }) {
  if (value === null || value === undefined) return <span className="text-muted">-</span>;

  const isPositive = value > 0;
  const isNeutral = value === 0;
  const absoluteValue = Math.abs(value).toFixed(2);
  let colorClass = 'text-muted';
  let Icon = BsDash;

  if (isPositive) {
    colorClass = 'text-success';
    Icon = BsArrowUp;
  } else if (!isNeutral) {
    colorClass = 'text-danger';
    Icon = BsArrowDown;
  }

  return (
    <span className={`${colorClass} d-inline-flex align-items-center gap-1 fw-medium`}>
      <Icon size={12} />
      {absoluteValue}%
      {period && <span className="text-muted ms-1 small">({period})</span>}
    </span>
  );
}