import React, { useState, useEffect, useCallback } from 'react';

/**
 * BehaviorMonitor - Detects inactivity and exit intent to trigger AI engagement.
 */
const BehaviorMonitor = ({ onTrigger }) => {
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [hasTriggered, setHasTriggered] = useState(false);

  const resetTimer = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  useEffect(() => {
    // Inactivity Detection (90 seconds)
    const interval = setInterval(() => {
      if (hasTriggered) return;
      
      const now = Date.now();
      const diff = (now - lastActivity) / 1000;

      if (diff > 90) { // 90 seconds of total silence
        onTrigger({ type: 'abandonment', reason: 'inactivity' });
        setHasTriggered(true);
      }
    }, 1000);

    // Activity Listeners
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('scroll', resetTimer);
    window.addEventListener('click', resetTimer);

    // Exit Intent Detection
    const handleMouseOut = (e) => {
      if (hasTriggered) return;
      // If mouse leaves the top of the viewport
      if (e.clientY <= 0) {
        onTrigger({ type: 'abandonment', reason: 'exit_intent' });
        setHasTriggered(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseOut);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      window.removeEventListener('click', resetTimer);
      document.removeEventListener('mouseleave', handleMouseOut);
    };
  }, [lastActivity, hasTriggered, onTrigger, resetTimer]);

  return null; // This is a headless logic component
};

export default BehaviorMonitor;
