export interface CategoryVisual {
  id: string;
  name: string;
  gradient: string;
  description: string;
}

export const CATEGORY_VISUALS: CategoryVisual[] = [
  {
    id: "action",
    name: "Action",
    gradient: "from-[#0089a3] via-[#029ab8] to-[#00b2d6]",
    description:
      "Welcome to the edge of your seat, because it's time to dive into the action. From classic westerns and war films to modern action hero adventures, it's all right here on Kino+.",
  },
  {
    id: "animation",
    name: "Animation",
    gradient: "from-[#2ea024] via-[#3cb730] to-[#51ce45]",
    description:
      "Step into imaginative worlds filled with vibrant adventures. From award-winning anime to heartwarming family animations, it's all right here on Kino+.",
  },
  {
    id: "comedy",
    name: "Comedy",
    gradient: "from-[#6b1cb0] via-[#7d22cc] to-[#9935f0]",
    description:
      "Get ready to laugh out loud with the best comedies. From hilarious stand-ups and rom-coms to timeless sitcom classics, it's all right here on Kino+.",
  },
  {
    id: "crime",
    name: "Crime",
    gradient: "from-[#252834] via-[#2f3342] to-[#3a3f52]",
    description:
      "Step into the criminal underworld with gritty detective mysteries, high-stakes heists, and true crime thrillers, right here on Kino+.",
  },
  {
    id: "documentary",
    name: "Documentary",
    gradient: "from-[#d46200] via-[#e87100] to-[#ff8c1a]",
    description:
      "Uncover real stories, deep history, fascinating nature, and untold truths from across the globe, right here on Kino+.",
  },
  {
    id: "drama",
    name: "Drama",
    gradient: "from-[#5a483e] via-[#6e584c] to-[#826a5c]",
    description:
      "Deep, moving, and thought-provoking storytelling with unforgettable performances from cinema's finest, right here on Kino+.",
  },
  {
    id: "en-espanol",
    name: "En Español",
    gradient: "from-[#694871] via-[#7d5687] to-[#91669c]",
    description:
      "Disfruta de las mejores películas, series y producciones en español. Cine aclamado, telenovelas y entretenimiento sin límites en Kino+.",
  },
  {
    id: "horror",
    name: "Horror",
    gradient: "from-[#9c1818] via-[#b81d1d] to-[#d62424]",
    description:
      "Turn off the lights if you dare. From supernatural thrillers and psychological chills to classic slashers, it's all right here on Kino+.",
  },
  {
    id: "music",
    name: "Music",
    gradient: "from-[#058a52] via-[#09a362] to-[#12bf75]",
    description:
      "Turn up the volume with electric live concerts, iconic musical bios, rockumentaries, and musical theatre, right here on Kino+.",
  },
  {
    id: "romance",
    name: "Romance",
    gradient: "from-[#b81878] via-[#d41c8b] to-[#ed28a0]",
    description:
      "Feel the passion and heart with unforgettable love stories, timeless romantic classics, and modern swoon-worthy cinema, right here on Kino+.",
  },
  {
    id: "scifi",
    name: "Sci-Fi",
    gradient: "from-[#1c3db8] via-[#244ed6] to-[#3663f0]",
    description:
      "Journey beyond the stars and explore dystopian futures, cybernetic worlds, and mind-bending space odysseys, right here on Kino+.",
  },
  {
    id: "thriller",
    name: "Thriller",
    gradient: "from-[#16181b] via-[#212328] to-[#2c2f36]",
    description:
      "Keep your pulse racing with heart-stopping suspense, psychological twists, and edge-of-your-seat conspiracies, right here on Kino+.",
  },
  {
    id: "western",
    name: "Western",
    gradient: "from-[#d98500] via-[#e89b00] to-[#f5b300]",
    description:
      "Saddle up for dusty frontier showdowns, outlaw legends, and classic gunslinger epics from the Wild West, right here on Kino+.",
  },
  {
    id: "descriptive-audio",
    name: "Descriptive Audio",
    gradient: "from-[#34363a] via-[#414449] to-[#4e5259]",
    description:
      "Accessible cinema featuring descriptive audio narration for visually impaired film lovers, celebrating great cinema on Kino+.",
  },
];

export function getCategoryVisual(nameOrId: string): CategoryVisual {
  const normalized = (nameOrId || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const found = CATEGORY_VISUALS.find(
    (c) =>
      c.id.replace(/[^a-z0-9]/g, "") === normalized ||
      c.name.toLowerCase().replace(/[^a-z0-9]/g, "") === normalized,
  );

  if (found) return found;

  return {
    id: normalized || "category",
    name: nameOrId || "Category",
    gradient: "from-[#252834] via-[#2f3342] to-[#3a3f52]",
    description: `Discover the best ${nameOrId} movies and binge-worthy TV series streaming on Kino+.`,
  };
}
