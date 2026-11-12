// Shared static poster data for the auth page waterfall animation.
// Used by AuthPage across apps.
export interface LandingPosterItem {
  id: number;
  title: string;
  poster: string;
  rating: number;
  year: string;
}

export const LANDING_POSTERS: LandingPosterItem[] = [
  { id: 1198654, title: "Bad Apples", poster: "/posters/poster-1.jpg", rating: 6.9, year: "2026" },
  { id: 1380417, title: "By Any Means", poster: "/posters/poster-2.jpg", rating: 7.2, year: "2026" },
  { id: 1400940, title: "Clayface", poster: "/posters/poster-3.jpg", rating: 8.1, year: "2026" },
  { id: 1288069, title: "Tenzing", poster: "/posters/poster-4.jpg", rating: 8.3, year: "2026" },
  { id: 1058424, title: "Hope", poster: "/posters/poster-5.jpg", rating: 6.9, year: "2026" },
  { id: 1561726, title: "Masterplan", poster: "/posters/poster-6.jpg", rating: 7.1, year: "2026" },
  { id: 1153576, title: "Street Fighter", poster: "/posters/poster-7.jpg", rating: 6.3, year: "2026" },
  { id: 1433583, title: "The Weight", poster: "/posters/poster-8.jpg", rating: 6.9, year: "2026" },
  { id: 969681, title: "Spider-Man: Brand New Day", poster: "/posters/poster-9.jpg", rating: 8.5, year: "2026" },
  { id: 1765072, title: "You Can See Everything", poster: "/posters/poster-10.jpg", rating: 8.9, year: "2026" },
  { id: 1514026, title: "Buddy", poster: "/posters/poster-11.jpg", rating: 7.1, year: "2026" },
  { id: 1423191, title: "Resident Evil", poster: "/posters/poster-12.jpg", rating: 7.3, year: "2026" },
  { id: 1339713, title: "Obsession", poster: "/posters/poster-13.jpg", rating: 8.2, year: "2026" },
  { id: 791523, title: "Wildwood", poster: "/posters/poster-14.jpg", rating: 9.3, year: "2026" },
  { id: 1368337, title: "The Odyssey", poster: "/posters/poster-15.jpg", rating: 8, year: "2026" },
  { id: 1302904, title: "Practical Magic 2", poster: "/posters/poster-16.jpg", rating: 7, year: "2026" },
  { id: 1255833, title: "Whalefall", poster: "/posters/poster-17.jpg", rating: 6.6, year: "2026" },
  { id: 1284186, title: "Sacrifice", poster: "/posters/poster-18.jpg", rating: 5, year: "2026" },
  { id: 1003596, title: "Avengers: Doomsday", poster: "/posters/poster-19.jpg", rating: 0, year: "2026" },
  { id: 1381078, title: "Love of Your Life", poster: "/posters/poster-20.jpg", rating: 6.8, year: "2026" },
];
