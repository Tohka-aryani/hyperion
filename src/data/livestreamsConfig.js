/**
 * Livestreams shown in the TV window (Monitor icon).
 * embedUrl: used in iframe (YouTube embed). Update video IDs if a channel's live stream changes.
 * watchUrl: optional; open in new tab if embed is unavailable.
 */
export const LIVESTREAMS = [
  {
    id: 'astro-awani',
    name: 'Astro Awani',
    embedUrl: 'https://www.youtube.com/embed/nBR9f8izSuE',
    watchUrl: 'https://www.youtube.com/c/astroawani/live',
  },
  {
    id: 'al-jazeera',
    name: 'Al Jazeera',
    embedUrl: 'https://www.youtube.com/embed/gCNeDWCI0vo',
    watchUrl: 'https://www.youtube.com/watch?v=gCNeDWCI0vo',
  },
  {
    id: 'rtm',
    name: 'RTM',
    embedUrl: 'https://www.youtube.com/embed/W0LDBjnHIoM',
    watchUrl: 'https://rtmklik.rtm.gov.my/live/tv1',
  },
  {
    id: 'abc',
    name: 'ABC',
    embedUrl: 'https://www.youtube.com/embed/-mvUkiILTqI',
    watchUrl: 'https://www.youtube.com/watch?v=-mvUkiILTqI',
  },
  {
    id: 'bloomberg',
    name: 'Bloomberg News',
    embedUrl: 'https://www.youtube.com/embed/f39oHo6vFLg',
    watchUrl: 'https://www.youtube.com/watch?v=f39oHo6vFLg',
  },
]
