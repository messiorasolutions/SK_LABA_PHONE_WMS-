import React from 'react';
import { COLORS } from '../../constants/colors';

export default function Button({
  children,
  variant = 'primary', // primary (blue), secondary (red), outline, ghost, danger
  size = 'md', // sm, md, lg
  loading = false,
  icon: Icon,
  disabled,
  className = '',
  ...props
}) {
  const getStyles = () => {
    switch (variant) {
      case 'secondary':
      case 'red':
        return {
          backgroundColor: COLORS.secondary,
          color: COLORS.white,
          hoverBg: COLORS.secondaryDark,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'currentColor',
          borderColor: 'currentColor',
        };
      case 'danger':
        return {
          backgroundColor: COLORS.secondaryLight,
          color: COLORS.secondary,
          borderColor: COLORS.secondaryBorder,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: COLORS.muted,
        };
      case 'gradient':
        return {
          background: 'linear-gradient(to right, #DC2626, #991B1B)',
          color: COLORS.white,
          borderColor: 'transparent',
        };
      case 'primary':
      default:
        return {
          backgroundColor: COLORS.primary,
          color: COLORS.white,
          borderColor: '#B91C1C',
        };
    }
  };


  const styleConfig = getStyles();

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-xs font-semibold',
    lg: 'px-5 py-2.5 text-sm font-bold',
  };


  return (
    <button
      disabled={disabled || loading}
      style={{
        background: styleConfig.background,
        backgroundColor: styleConfig.backgroundColor,
        color: styleConfig.color,
        borderColor: styleConfig.borderColor || 'transparent',
      }}
      className={`inline-flex items-center justify-center gap-2 border transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
        sizeClasses[size]
      } ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
