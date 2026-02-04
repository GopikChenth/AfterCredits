/**
 * Movie API Service (Mock)
 * Placeholder service for Movie data until TMDB integration
 */

// Mock Data
const MOCK_MOVIES = [
  {
    id: 1,
    title: "Dune: Part Two",
    year: 2024,
    coverImage: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    description: "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
    score: 85,
  },
  {
    id: 2,
    title: "Oppenheimer",
    year: 2023,
    coverImage: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    description: "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
    score: 81,
  },
  {
    id: 3,
    title: "The Batman",
    year: 2022,
    coverImage: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50x9T2Ov8lW.jpg",
    description: "In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family while facing a serial killer known as the Riddler.",
    score: 77,
  },
  {
    id: 4,
    title: "Spider-Man: Across the Spider-Verse",
    year: 2023,
    coverImage: "https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg",
    description: "After reuniting with Gwen Stacy, Brooklyn's full-time, friendly neighborhood Spider-Man is catapulted across the Multiverse.",
    score: 84,
  },
  {
    id: 5,
    title: "Interstellar",
    year: 2014,
    coverImage: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    description: "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.",
    score: 86,
  },
  {
    id: 6,
    title: "Inception",
    year: 2010,
    coverImage: "https://image.tmdb.org/t/p/w500/9gk7admal4zl248sKidtwi9x3Oq.jpg",
    description: "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life.",
    score: 83,
  },
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getTrendingMovies = async (page = 1, perPage = 20) => {
  await delay(800); // Simulate network latency
  return { media: MOCK_MOVIES };
};

export const getPopularMovies = async (page = 1, perPage = 20) => {
  await delay(800);
  return { media: [...MOCK_MOVIES].reverse() };
};

export const getNewMovies = async (page = 1, perPage = 20) => {
  await delay(800);
  return { media: MOCK_MOVIES.slice(0, 3) };
};

export const formatMovieData = (movie) => {
  return {
    id: movie.id,
    title: movie.title,
    year: movie.year,
    coverImage: movie.coverImage,
    description: movie.description,
    score: movie.score,
    type: 'MOVIE'
  };
};

export default {
  getTrendingMovies,
  getPopularMovies,
  getNewMovies,
  formatMovieData
};
