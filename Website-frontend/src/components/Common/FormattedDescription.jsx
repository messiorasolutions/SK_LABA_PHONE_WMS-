import React from 'react';

/**
 * Parses inline formatting:
 * - **bold** or <b>bold</b>
 * - *italic* or _italic_ or <i>italic</i>
 */
function renderInline(text, isDark = true) {
  if (!text) return null;
  const regex = /(\*\*.*?\*\*|<b>.*?<\/b>|<u>.*?<\/u>|\*.*?\*|_.*?_|<i>.*?<\/i>)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={i} className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('<b>') && part.endsWith('</b>') && part.length >= 7) {
      return (
        <strong key={i} className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
          {part.slice(3, -4)}
        </strong>
      );
    }
    if (part.startsWith('<u>') && part.endsWith('</u>') && part.length >= 7) {
      return (
        <span key={i} className="underline underline-offset-2">
          {part.slice(3, -4)}
        </span>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={i} className={`italic ${isDark ? 'text-white/90' : 'text-slate-800 dark:text-white/90'}`}>
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('_') && part.endsWith('_') && part.length >= 2) {
      return (
        <em key={i} className={`italic ${isDark ? 'text-white/90' : 'text-slate-800 dark:text-white/90'}`}>
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('<i>') && part.endsWith('</i>') && part.length >= 7) {
      return (
        <em key={i} className={`italic ${isDark ? 'text-white/90' : 'text-slate-800 dark:text-white/90'}`}>
          {part.slice(3, -4)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/**
 * FormattedDescription
 * Renders bold, italic, bullet points, numbered lists, and line breaks exactly as composed in admin dashboard.
 */
export default function FormattedDescription({ content, description, className = '', isDark = true }) {
  const text = content ?? description;
  if (!text) return null;

  const lines = String(text).split('\n');

  return (
    <div className={`space-y-1.5 leading-relaxed break-words ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Bullet line (starts with •, -, *, +)
        const bulletMatch = line.match(/^\s*[•\-\*\+]\s*(.+)$/);
        if (bulletMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className={`select-none leading-relaxed shrink-0 ${isDark ? 'text-white/70' : 'text-blue-500'}`}>•</span>
              <div className="flex-1 leading-relaxed">{renderInline(bulletMatch[1], isDark)}</div>
            </div>
          );
        }

        // Numbered list item (starts with 1., 2., etc.)
        const numMatch = line.match(/^\s*(\d+)[\.\)]\s*(.+)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className={`font-mono text-[11px] select-none leading-relaxed shrink-0 ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
                {numMatch[1]}.
              </span>
              <div className="flex-1 leading-relaxed">{renderInline(numMatch[2], isDark)}</div>
            </div>
          );
        }

        // Normal paragraph line
        return (
          <p key={idx} className="leading-relaxed">
            {renderInline(line, isDark)}
          </p>
        );
      })}
    </div>
  );
}

