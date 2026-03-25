import React from "react";
import { useMediaType } from "../context/MediaTypeContext";

// Import all home page variants
import HomeAnime from "./home_anime";
import GameHome from "./home_game";
import HomeMovies from "./home_movies";
import HomeComics from "./home_comics";
import HomeManga from "./home_manga";

/**
 * HomeScreen — Dynamic wrapper that renders the correct home page
 * based on the current mediaType from context.
 *
 * This is the single "Home" tab in MainTabs. When the user changes
 * media type via the sidebar, this component re-renders and swaps in
 * the matching home page. All other tabs (Discover, Post, Podium)
 * stay unaffected.
 */
const HOME_COMPONENTS = {
  anime: HomeAnime,
  games: GameHome,
  movies: HomeMovies,
  comics: HomeComics,
  manga: HomeManga,
};

const HomeScreen = (props) => {
  const { mediaType } = useMediaType();
  const Component = HOME_COMPONENTS[mediaType] || HomeAnime;
  return <Component {...props} />;
};

export default HomeScreen;
