import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';

/**
 * MediaTypeContext - Global state for current media type
 * Manages which media type the user is currently browsing
 */

const MediaTypeContext = createContext();

export const MediaTypeProvider = ({ children }) => {
  const [mediaType, setMediaType] = useState('anime'); // Default to anime

  // Get the home route name for current media type
  const getHomeRoute = useCallback(() => {
    const routeMap = {
      anime: 'HomeAnime',
      movies: 'HomeMovies',
      games: 'HomeGames',
      comics: 'HomeComics',
      manga: 'HomeManga',
    };
    return routeMap[mediaType] || 'HomeAnime';
  }, [mediaType]);

  // Memoize context value so consumers only re-render when mediaType actually changes
  const contextValue = useMemo(
    () => ({ mediaType, setMediaType, getHomeRoute }),
    [mediaType, getHomeRoute]
  );

  return (
    <MediaTypeContext.Provider value={contextValue}>
      {children}
    </MediaTypeContext.Provider>
  );
};

export const useMediaType = () => {
  const context = useContext(MediaTypeContext);
  if (!context) {
    throw new Error('useMediaType must be used within MediaTypeProvider');
  }
  return context;
};
