'use client';

import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface StickyScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  minWidth?: string;
}

export function StickyScrollContainer({ children, className = '', minWidth = '1000px' }: StickyScrollContainerProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const dummyRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [containerRect, setContainerRect] = useState({ left: 0, width: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [isScrollable, setIsScrollable] = useState(false);
  
  // Track which element is currently scrolling to prevent "ping-pong" loops
  const isSyncingRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!contentRef.current) return;

    const updateMetrics = () => {
      if (!contentRef.current) return;
      const table = contentRef.current.querySelector('table');
      const scrollWidth = table ? table.scrollWidth : contentRef.current.scrollWidth;
      const rect = contentRef.current.getBoundingClientRect();
      
      setContentWidth(scrollWidth);
      setContainerRect({ left: rect.left, width: rect.width });
      setIsScrollable(scrollWidth > rect.width + 1);
    };

    const resizeObserver = new ResizeObserver(updateMetrics);
    resizeObserver.observe(contentRef.current);
    const table = contentRef.current.querySelector('table');
    if (table) resizeObserver.observe(table);

    window.addEventListener('resize', updateMetrics);
    // Use an interval for position tracking to avoid scroll-event heavy lifting
    const interval = setInterval(updateMetrics, 500);

    updateMetrics();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateMetrics);
      clearInterval(interval);
    };
  }, [isMounted]);

  // Sync Dummy -> Content
  const onDummyScroll = () => {
    if (isSyncingRef.current) return;
    if (dummyRef.current && contentRef.current) {
      isSyncingRef.current = true;
      contentRef.current.scrollLeft = dummyRef.current.scrollLeft;
      // Use requestAnimationFrame to reset sync flag
      requestAnimationFrame(() => { isSyncingRef.current = false; });
    }
  };

  // Sync Content -> Dummy
  const onContentScroll = () => {
    if (isSyncingRef.current) return;
    if (dummyRef.current && contentRef.current) {
      isSyncingRef.current = true;
      dummyRef.current.scrollLeft = contentRef.current.scrollLeft;
      requestAnimationFrame(() => { isSyncingRef.current = false; });
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={contentRef}
        onScroll={onContentScroll}
        className="overflow-x-auto premium-scrollbar admin-table-container"
      >
        <div style={{ minWidth }}>
          {children}
        </div>
      </div>

      {/* Mirror Scrollbar - Portaled to Body with Optimized Viewport Tracking */}
      {isMounted && isScrollable && createPortal(
        <div 
          className="fixed bottom-0 z-[999999] overflow-x-auto overflow-y-hidden premium-scrollbar h-4 pointer-events-auto bg-brand-blue-900 border-t border-brand-blue-700 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]"
          ref={dummyRef}
          onScroll={onDummyScroll}
          style={{ 
            left: containerRect.left, 
            width: containerRect.width 
          }}
        >
          <div style={{ width: contentWidth, height: '1px' }} />
        </div>,
        document.body
      )}
    </div>
  );
}
