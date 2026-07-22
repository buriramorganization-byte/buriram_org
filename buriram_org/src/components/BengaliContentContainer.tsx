import React from "react";

interface BengaliContentContainerProps {
  children: React.ReactNode;
  className?: string;
  isBengali?: boolean;
}

/**
 * Dedicated wrapper component enforcing "Hind Siliguri" font family 
 * for all dynamic Bengali content (rules, descriptions, alerts, headings, paragraphs, lists)
 */
export default function BengaliContentContainer({
  children,
  className = "",
  isBengali = true,
}: BengaliContentContainerProps) {
  return (
    <div
      lang={isBengali ? "bn" : "en"}
      className={`bengali-rules-container ${className}`}
      style={{ fontFamily: "'Hind Siliguri', 'Comfortaa', sans-serif" }}
    >
      {children}
    </div>
  );
}
