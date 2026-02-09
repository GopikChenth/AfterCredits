import React, { createContext, useState, useContext } from 'react';

/**
 * MediaTypeContext - Global state for current media type
 * Manages which media type the user is currently browsing
 */

const MediaTypeContext = createContext();

export const MediaTypeProvider = ({ children }) => {
  const [mediaType, setMediaType] = useState('anime'); // Default to anime

  // Get the home route name for current media type
  const getHomeRoute = () => {
    const routeMap = {
      anime: 'HomeAnime',
      movies: 'HomeMovies',
      games: 'HomeGames',
      comics: 'HomeComics',
      manga: 'HomeManga',
    };
    return routeMap[mediaType] || 'HomeAnime';
  };

  return (
    <MediaTypeContext.Provider value={{ mediaType, setMediaType, getHomeRoute }}>
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
