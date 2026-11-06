import React from 'react';

/**
 * Parses inline formatting:
 * - **bold** or <b>bold</b>
 * - *italic* or _italic_ or <i>italic</i>
 * - <u>underlined</u>
 */
function renderInline(text) {
  if (!text) return null;
  const regex = /(\*\*.*?\*\*|<b>.*?<\/b>|\*.*?\*|_.*?_|<i>.*?<\/i>|<u>.*?<\/u>)/g;
  const parts = text.split(regex);

  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={i} className="font-semibold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('<b>') && part.endsWith('</b>') && part.length >= 7) {
      return (
        <strong key={i} className="font-semibold text-slate-900 dark:text-white">
          {part.slice(3, -4)}
        </strong>
      );
    }
    if (part.startsWith('<u>') && part.endsWith('</u>') && part.length >= 7) {
      return (
        <u key={i} className="underline text-slate-900 dark:text-white decoration-slate-400">
          {part.slice(3, -4)}
        </u>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={i} className="italic text-slate-800 dark:text-slate-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('_') && part.endsWith('_') && part.length >= 2) {
      return (
        <em key={i} className="italic text-slate-800 dark:text-slate-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('<i>') && part.endsWith('</i>') && part.length >= 7) {
      return (
        <em key={i} className="italic text-slate-800 dark:text-slate-200">
          {part.slice(3, -4)}
        </em>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/**
 * FormattedDescription
 * Renders bold, italic, underline, bullet points, numbered lists, and line breaks exactly as composed in admin dashboard.
 */
export default function FormattedDescription({ content, description, className = '' }) {
  const text = content ?? description;
  if (!text) return null;

  const lines = String(text).split('\n');

  return (
    <div className={`space-y-1 text-xs text-slate-700 dark:text-slate-300 leading-relaxed ${className}`}>
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
              <span className="text-blue-500 font-bold select-none leading-relaxed shrink-0">•</span>
              <div className="flex-1 leading-relaxed">{renderInline(bulletMatch[1])}</div>
            </div>
          );
        }

        // Numbered list item (starts with 1., 2., etc.)
        const numMatch = line.match(/^\s*(\d+)[\.\)]\s*(.+)$/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-1">
              <span className="text-slate-400 font-mono text-[11px] select-none leading-relaxed shrink-0">
                {numMatch[1]}.
              </span>
              <div className="flex-1 leading-relaxed">{renderInline(numMatch[2])}</div>
            </div>
          );
        }

        // Normal paragraph line
        return (
          <p key={idx} className="leading-relaxed">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

