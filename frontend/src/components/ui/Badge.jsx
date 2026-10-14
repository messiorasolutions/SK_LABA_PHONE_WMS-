import React from 'react';
import { COLORS } from '../../constants/colors';

export default function Badge({ children, variant = 'blue', icon: Icon, className = '' }) {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'red':
        return {
          backgroundColor: COLORS.secondaryLight,
          color: COLORS.secondary,
          borderColor: COLORS.secondaryBorder,
        };
      case 'green':
      case 'success':
        return {
          backgroundColor: COLORS.successLight,
          color: COLORS.success,
          borderColor: '#A7F3D0',
        };
      case 'amber':
      case 'warning':
        return {
          backgroundColor: COLORS.warningLight,
          color: COLORS.warning,
          borderColor: '#FDE68A',
        };
      case 'blue':
      case 'primary':
      default:
        return {
          backgroundColor: COLORS.primaryLight,
          color: COLORS.primary,
          borderColor: COLORS.primaryBorder,
        };
    }
  };

  const style = getBadgeStyle();

  return (
    <span
      style={{
        backgroundColor: style.backgroundColor,
        color: style.color,
        borderColor: style.borderColor,
      }}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${className}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}
