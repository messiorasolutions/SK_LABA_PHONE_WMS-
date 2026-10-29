import React from 'react';

/**
 * Modern Clean Status Indicator (Frameless / No Box Background)
 * Replaces boxy AI-style colored rectangles with clean, minimalist dot indicators.
 */
export default function Badge({
  children,
  variant = 'neutral',
  icon: Icon,
  dot = true,
  className = '',
}) {
  const getDotColor = () => {
    switch (variant) {
      case 'success':
      case 'green':
        return 'bg-emerald-500';
      case 'amber':
      case 'warning':
        return 'bg-amber-500';
      case 'red':
      case 'danger':
        return 'bg-rose-500';
      case 'blue':
      case 'info':
        return 'bg-blue-500';
      case 'neutral':
      case 'slate':
      case 'gray':
      default:
        return 'bg-slate-400';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success':
      case 'green':
        return 'text-slate-800 dark:text-slate-200';
      case 'amber':
      case 'warning':
        return 'text-slate-700 dark:text-slate-300';
      case 'red':
      case 'danger':
        return 'text-slate-700 dark:text-slate-300';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const formattedText =
    typeof children === 'string'
      ? children.charAt(0).toUpperCase() + children.slice(1).toLowerCase()
      : children;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium ${getTextColor()} ${className}`}
    >
      {Icon ? (
        <Icon className="w-3.5 h-3.5 shrink-0 opacity-70" />
      ) : dot ? (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDotColor()}`} />
      ) : null}
      <span>{formattedText}</span>
    </span>
  );
}
