import {
  fetchFromTMDB,
  mapTmdbResults,
  enrichMoviesWithLogos,
  formatImageUrl,
} from './client';
import { CategoryItem, FormattedMovie } from './types';

export const CATEGORY_DEFINITIONS: CategoryItem[] = [
  {
    id: 'action',
    name: 'Action',
    emoji: '💥',
    bg: '#1a1f2e',
    gradient: 'from-[#0089a3] via-[#029ab8] to-[#00b2d6]',
    description: "Welcome to the edge of your seat, because it's time to dive into the action.",
    movieGenreId: 28,
    tvGenreId: 10759,
  },
  {
    id: 'animation',
    name: 'Animation',
    emoji: '🎨',
    bg: '#1a281e',
    gradient: 'from-[#2ea024] via-[#3cb730] to-[#51ce45]',
    description: 'Step into imaginative worlds filled with vibrant adventures.',
    movieGenreId: 16,
    tvGenreId: 16,
  },
  {
    id: 'comedy',
    name: 'Comedy',
    emoji: '😂',
    bg: '#1a2e1a',
    gradient: 'from-[#6b1cb0] via-[#7d22cc] to-[#9935f0]',
    description: 'Get ready to laugh out loud with the best comedies.',
    movieGenreId: 35,
    tvGenreId: 35,
  },
  {
    id: 'crime',
    name: 'Crime',
    emoji: '🕵️',
    bg: '#201c18',
    gradient: 'from-[#252834] via-[#2f3342] to-[#3a3f52]',
    description: 'Step into the criminal underworld with gritty detective mysteries and true crime thrillers.',
    movieGenreId: 80,
    tvGenreId: 80,
  },
  {
    id: 'documentary',
    name: 'Documentary',
    emoji: '🎥',
    bg: '#1e2218',
    gradient: 'from-[#d46200] via-[#e87100] to-[#ff8c1a]',
    description: 'Uncover real stories, deep history, fascinating nature, and untold truths.',
    movieGenreId: 99,
    tvGenreId: 99,
  },
  {
    id: 'drama',
    name: 'Drama',
    emoji: '🎭',
    bg: '#1e1a2e',
    gradient: 'from-[#5a483e] via-[#6e584c] to-[#826a5c]',
    description: 'Deep, moving, and thought-provoking storytelling with unforgettable performances.',
    movieGenreId: 18,
    tvGenreId: 18,
  },
  {
    id: 'en-espanol',
    name: 'En Español',
    emoji: '🇪🇸',
    bg: '#251b2e',
    gradient: 'from-[#694871] via-[#7d5687] to-[#91669c]',
    description: 'Disfruta de las mejores películas, series y producciones en español.',
  },
  {
    id: 'horror',
    name: 'Horror',
    emoji: '👻',
    bg: '#2e1a1a',
    gradient: 'from-[#9c1818] via-[#b81d1d] to-[#d62424]',
    description: 'Turn off the lights if you dare. Supernatural thrillers and psychological chills.',
    movieGenreId: 27,
    tvGenreId: 9648,
  },
  {
    id: 'music',
    name: 'Music',
    emoji: '🎵',
    bg: '#182820',
    gradient: 'from-[#058a52] via-[#09a362] to-[#12bf75]',
    description: 'Turn up the volume with electric live concerts and iconic musical bios.',
    movieGenreId: 10402,
  },
  {
    id: 'romance',
    name: 'Romance',
    emoji: '❤️',
    bg: '#2e1a28',
    gradient: 'from-[#b81878] via-[#d41c8b] to-[#ed28a0]',
    description: 'Feel the passion and heart with unforgettable love stories and modern romance.',
    movieGenreId: 10749,
    tvGenreId: 18,
  },
  {
    id: 'scifi',
    name: 'Sci-Fi',
    emoji: '🚀',
    bg: '#1a2428',
    gradient: 'from-[#1c3db8] via-[#244ed6] to-[#3663f0]',
    description: 'Journey beyond the stars and explore dystopian futures and cybernetic worlds.',
    movieGenreId: 878,
    tvGenreId: 10765,
  },
  {
    id: 'thriller',
    name: 'Thriller',
    emoji: '🔪',
    bg: '#28201a',
    gradient: 'from-[#16181b] via-[#212328] to-[#2c2f36]',
    description: 'Keep your pulse racing with heart-stopping suspense and edge-of-your-seat conspiracies.',
    movieGenreId: 53,
    tvGenreId: 9648,
  },
  {
    id: 'western',
    name: 'Western',
    emoji: '🤠',
    bg: '#282218',
    gradient: 'from-[#d98500] via-[#e89b00] to-[#f5b300]',
    description: 'Saddle up for dusty frontier showdowns, outlaw legends, and classic gunslinger epics.',
    movieGenreId: 37,
    tvGenreId: 37,
  },
  {
    id: 'descriptive-audio',
    name: 'Descriptive Audio',
    emoji: '🎙️',
    bg: '#202228',
    gradient: 'from-[#34363a] via-[#414449] to-[#4e5259]',
    description: 'Accessible cinema featuring descriptive audio narration for visually impaired film lovers.',
  },
  {
    id: 'family',
    name: 'Family',
    emoji: '👨‍👩‍👦',
    bg: '#1f2420',
    gradient: 'from-[#1f7a60] via-[#269475] to-[#33b892]',
    description: 'Wholesome entertainment, magical journeys, and stories loved by all ages.',
    movieGenreId: 10751,
    tvGenreId: 10751,
  },
  {
    id: 'fantasy',
    name: 'Fantasy',
    emoji: '🧙',
    bg: '#1c1a2e',
    gradient: 'from-[#5c2494] via-[#712bb5] to-[#8d36e3]',
    description: 'Step into mythical realms of sorcery, epic quests, and legendary beasts.',
    movieGenreId: 14,
    tvGenreId: 10765,
  },
  {
    id: 'mystery',
    name: 'Mystery',
    emoji: '🔍',
    bg: '#201c24',
    gradient: 'from-[#3b3a4a] via-[#49485c] to-[#595870]',
    description: 'Unravel perplexing puzzles, enigmatic secrets, and unexpected revelations.',
    movieGenreId: 9648,
    tvGenreId: 9648,
  },
  {
    id: 'reality',
    name: 'Reality',
    emoji: '📺',
    bg: '#222018',
    gradient: 'from-[#a66a1a] via-[#c27c1f] to-[#de8e23]',
    description: 'Unscripted drama, culinary competitions, luxury lifestyles, and real-life sagas.',
    tvGenreId: 10764,
  },
  {
    id: 'adventure',
    name: 'Adventure',
    emoji: '🗺️',
    bg: '#1a2420',
    gradient: 'from-[#1a6652] via-[#228067] to-[#2da182]',
    description: 'Expeditions into the unknown, treasure hunts, and perilous journeys.',
    movieGenreId: 12,
    tvGenreId: 10759,
  },
  {
    id: 'war',
    name: 'War',
    emoji: '⚔️',
    bg: '#261a1a',
    gradient: 'from-[#632a2a] via-[#7d3535] to-[#9e4343]',
    description: 'Harrowing battlefronts, historical conflicts, and brotherhood in the line of fire.',
    movieGenreId: 10752,
    tvGenreId: 10768,
  },
];

export async function fetchCategoriesFromTMDB(): Promise<CategoryItem[]> {
  return CATEGORY_DEFINITIONS.map(({ id, name, emoji, bg, gradient, description, movieGenreId, tvGenreId }) => ({
    id,
    name,
    emoji: emoji || '🎬',
    bg: bg || '#1a1f2e',
    gradient: gradient || 'from-[#0089a3] via-[#029ab8] to-[#00b2d6]',
    description: description || `Browse popular ${name} movies and TV shows on Kino+.`,
    movieGenreId,
    tvGenreId,
  }));
}

export async function fetchMediaByCategory(
  categoryKey: string,
  mediaType: 'all' | 'movie' | 'tv' = 'all',
  page: number = 1
): Promise<{ items: FormattedMovie[]; totalPages: number; category: string; mediaType: string }> {
  const normalizedKey = categoryKey.toLowerCase().replace(/[^a-z0-9]/g, '');
  const foundDef = CATEGORY_DEFINITIONS.find(
    (c) =>
      c.id.replace(/[^a-z0-9]/g, '') === normalizedKey ||
      c.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedKey
  );

  const categoryName = foundDef ? foundDef.name : categoryKey;
  const movieGenreId = foundDef?.movieGenreId;
  const tvGenreId = foundDef?.tvGenreId;

  // Custom handling for 'En Español'
  if (normalizedKey === 'enespanol' || normalizedKey.includes('espanol')) {
    const data = await fetchFromTMDB('/discover/movie', {
      with_original_language: 'es',
      sort_by: 'popularity.desc',
      page,
    });
    return {
      items: await enrichMoviesWithLogos(mapTmdbResults(data.results)),
      totalPages: data.total_pages || 1,
      category: 'En Español',
      mediaType,
    };
  }

  // Custom handling for 'Descriptive Audio' (popular cinematic classics)
  if (normalizedKey === 'descriptiveaudio') {
    const data = await fetchFromTMDB('/discover/movie', {
      sort_by: 'vote_average.desc',
      'vote_count.gte': 3000,
      page,
    });
    return {
      items: await enrichMoviesWithLogos(mapTmdbResults(data.results)),
      totalPages: data.total_pages || 1,
      category: 'Descriptive Audio',
      mediaType,
    };
  }

  if (!foundDef) {
    const data = await fetchFromTMDB('/trending/all/week', { page });
    return {
      items: await enrichMoviesWithLogos(mapTmdbResults(data.results)),
      totalPages: data.total_pages || 1,
      category: categoryName,
      mediaType,
    };
  }

  let items: FormattedMovie[] = [];
  let totalPages = 1;

  if (mediaType === 'movie' && movieGenreId) {
    const data = await fetchFromTMDB('/discover/movie', {
      with_genres: movieGenreId,
      sort_by: 'popularity.desc',
      page,
    });
    items = mapTmdbResults(data.results);
    totalPages = data.total_pages || 1;
  } else if (mediaType === 'tv' && tvGenreId) {
    const data = await fetchFromTMDB('/discover/tv', {
      with_genres: tvGenreId,
      sort_by: 'popularity.desc',
      page,
    });
    items = (data.results || [])
      .filter((item: any) => item.poster_path)
      .map((item: any) => ({
        id: item.id,
        title: item.name || item.original_name || 'TV Series',
        overview: item.overview || '',
        poster: formatImageUrl(item.poster_path, 'w500'),
        backdrop: formatImageUrl(item.backdrop_path, 'w1280'),
        rating: Math.round((item.vote_average || 0) * 10) / 10,
        releaseDate: item.first_air_date || '',
        mediaType: 'tv',
        seasonCount: item.number_of_seasons || undefined,
      }));
    totalPages = data.total_pages || 1;
  } else {
    const promises: Promise<any>[] = [];
    if (movieGenreId) {
      promises.push(
        fetchFromTMDB('/discover/movie', {
          with_genres: movieGenreId,
          sort_by: 'popularity.desc',
          page,
        })
      );
    }
    if (tvGenreId) {
      promises.push(
        fetchFromTMDB('/discover/tv', {
          with_genres: tvGenreId,
          sort_by: 'popularity.desc',
          page,
        })
      );
    }

    const results = await Promise.all(promises);
    let movieResults: FormattedMovie[] = [];
    let tvResults: FormattedMovie[] = [];

    if (movieGenreId && results[0]) {
      movieResults = mapTmdbResults(results[0].results);
      totalPages = Math.max(totalPages, results[0].total_pages || 1);
    }
    const tvResultData = movieGenreId ? results[1] : results[0];
    if (tvGenreId && tvResultData) {
      tvResults = (tvResultData.results || [])
        .filter((item: any) => item.poster_path)
        .map((item: any) => ({
          id: item.id,
          title: item.name || item.original_name || 'TV Series',
          overview: item.overview || '',
          poster: formatImageUrl(item.poster_path, 'w500'),
          backdrop: formatImageUrl(item.backdrop_path, 'w1280'),
          rating: Math.round((item.vote_average || 0) * 10) / 10,
          releaseDate: item.first_air_date || '',
          mediaType: 'tv',
          seasonCount: item.number_of_seasons || undefined,
        }));
      totalPages = Math.max(totalPages, tvResultData.total_pages || 1);
    }

    const maxLen = Math.max(movieResults.length, tvResults.length);
    for (let i = 0; i < maxLen; i++) {
      if (movieResults[i]) items.push(movieResults[i]!);
      if (tvResults[i]) items.push(tvResults[i]!);
    }
  }

  return {
    items: await enrichMoviesWithLogos(items),
    totalPages,
    category: categoryName,
    mediaType,
  };
}
