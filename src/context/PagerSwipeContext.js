import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Allows child components (e.g. CategoryPill) to temporarily disable
 * the tab pager's swipe gesture while they handle their own horizontal swipes.
 */
const PagerSwipeContext = createContext({
  swipeEnabled: true,
  disableSwipe: () => {},
  enableSwipe: () => {},
});

export function PagerSwipeProvider({ children }) {
  const [swipeEnabled, setSwipeEnabled] = useState(true);

  const disableSwipe = useCallback(() => setSwipeEnabled(false), []);
  const enableSwipe  = useCallback(() => setSwipeEnabled(true), []);

  return (
    <PagerSwipeContext.Provider value={{ swipeEnabled, disableSwipe, enableSwipe }}>
      {children}
    </PagerSwipeContext.Provider>
  );
}

export function usePagerSwipe() {
  return useContext(PagerSwipeContext);
}
