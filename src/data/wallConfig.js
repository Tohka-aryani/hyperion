/**
 * RSS feeds for The Wall + source analysis (bias, factual reporting, credibility).
 * Bias/factual values used for the Source Analysis panel when user clicks the label.
 */

export const RSS_FEEDS = [
  { url: 'https://feeds.bbci.co.uk/news/rss.xml', sourceKey: 'BBC News' },
  { url: 'https://rss.cnn.com/rss/cnn_topstories.rss', sourceKey: 'CNN' },
  { url: 'https://www.reuters.com/world/rss', sourceKey: 'Reuters' },
  { url: 'https://feeds.apnews.com/rss/topnews', sourceKey: 'Associated Press News' },
  { url: 'https://www.theguardian.com/world/rss', sourceKey: 'The Guardian' },
  { url: 'https://feeds.npr.org/1001/rss', sourceKey: 'NPR' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', sourceKey: 'Al Jazeera' },
  { url: 'https://www.malaymail.com/rss', sourceKey: 'Malay Mail' },
  { url: 'https://www.thestar.com.my/rss/feeds/world.xml', sourceKey: 'The Star' },
  { url: 'https://www.bernama.com/en/rss.php', sourceKey: 'Bernama' },
  { url: 'https://www.freemalaysiatoday.com/feed/', sourceKey: 'Free Malaysia Today' },
  { url: 'https://www.nst.com.my/rss', sourceKey: 'New Straits Times' },
]

/** Political bias options (for Source Analysis bar) */
export const BIAS_LABELS = ['LEFT', 'LEFT CENTER', 'CENTER', 'RIGHT CENTER', 'RIGHT']

/** Factual reporting options */
export const FACTUAL_LABELS = ['VERY LOW', 'LOW', 'MIXED', 'MOSTLY', 'HIGH', 'VERY HIGH']

/**
 * Source analysis: political bias, factual reporting, credibility.
 * Based on widely cited ratings (AllSides, Ad Fontes, MBFC). Used when user clicks bias label.
 */
export const SOURCE_ANALYSIS = {
  'BBC News': { bias: 'LEFT CENTER', factual: 'HIGH', credibility: 'HIGH CREDIBILITY' },
  'CNN': { bias: 'LEFT', factual: 'MIXED', credibility: 'MEDIUM CREDIBILITY' },
  'Reuters': { bias: 'CENTER', factual: 'HIGH', credibility: 'HIGH CREDIBILITY' },
  'Associated Press News': { bias: 'LEFT CENTER', factual: 'HIGH', credibility: 'HIGH CREDIBILITY' },
  'AP News': { bias: 'LEFT CENTER', factual: 'HIGH', credibility: 'HIGH CREDIBILITY' },
  'The Guardian': { bias: 'LEFT', factual: 'HIGH', credibility: 'HIGH CREDIBILITY' },
  'NPR': { bias: 'LEFT CENTER', factual: 'HIGH', credibility: 'HIGH CREDIBILITY' },
  'Al Jazeera': { bias: 'LEFT CENTER', factual: 'MOSTLY', credibility: 'MEDIUM CREDIBILITY' },
  'Malay Mail': { bias: 'CENTER', factual: 'HIGH', credibility: 'HIGH CREDIBILITY' },
  'The Star': { bias: 'CENTER', factual: 'HIGH', credibility: 'HIGH CREDIBILITY' },
  'Bernama': { bias: 'CENTER', factual: 'HIGH', credibility: 'HIGH CREDIBILITY' },
  'Free Malaysia Today': { bias: 'LEFT CENTER', factual: 'MOSTLY', credibility: 'MEDIUM CREDIBILITY' },
  'New Straits Times': { bias: 'CENTER', factual: 'HIGH', credibility: 'HIGH CREDIBILITY' },
}

/** Default when source not in SOURCE_ANALYSIS */
const DEFAULT_ANALYSIS = { bias: 'CENTER', factual: 'MIXED', credibility: 'MEDIUM CREDIBILITY' }

export function getSourceAnalysis(sourceName) {
  if (!sourceName || typeof sourceName !== 'string') return DEFAULT_ANALYSIS
  const key = sourceName.trim()
  return SOURCE_ANALYSIS[key] || DEFAULT_ANALYSIS
}
