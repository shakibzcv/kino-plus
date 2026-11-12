export const LIVE_CATEGORIES = [
  'All Channels',
  'Featured',
  'Movies',
  'News',
  'Sports',
  'Entertainment',
  'Animation & Kids',
  'Music',
  'Documentary',
  'Comedy',
  'Daytime TV & Games',
  'Bingeworthy',
  'True Crime',
  'Reality',
  'Classics',
  'Adrenaline & Sci-Fi',
] as const;

export type LiveCategory = typeof LIVE_CATEGORIES[number];

export const DEFAULT_DISPLAYED_LIMIT = 48;
export const CHANNELS_PER_PAGE = 60;
export const LOAD_MORE_INCREMENT = 36;
