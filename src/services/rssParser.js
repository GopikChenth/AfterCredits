/**
 * Shared RSS parser for news feeds.
 * Normalizes output shape across anime/movie/game sources.
 */

const ENTITY_MAP = {
  amp: '&',
  apos: "'",
  gt: '>',
  hellip: '...',
  lt: '<',
  nbsp: ' ',
  quot: '"',
};

const decodeHtmlEntities = (value = '') =>
  value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    )
    .replace(/&([a-zA-Z]+);/g, (match, entity) => ENTITY_MAP[entity] ?? match);

const stripHtml = (value = '') => value.replace(/<[^>]*>/g, '');

const getTagValue = (itemContent, tagName) => {
  const cdata = new RegExp(
    `<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tagName}>`,
    'i'
  );
  const plain = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');

  return itemContent.match(cdata)?.[1] ?? itemContent.match(plain)?.[1] ?? '';
};

const getCategories = (itemContent) => {
  const categories = [];
  const cdataRegex = /<category[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/category>/gi;
  const plainRegex = /<category[^>]*>([\s\S]*?)<\/category>/gi;

  let match;
  while ((match = cdataRegex.exec(itemContent)) !== null) {
    const value = decodeHtmlEntities(stripHtml(match[1]).trim());
    if (value) categories.push(value);
  }

  while ((match = plainRegex.exec(itemContent)) !== null) {
    const value = decodeHtmlEntities(stripHtml(match[1]).trim());
    if (value && !categories.includes(value)) categories.push(value);
  }

  return categories;
};

const getImageUrl = (itemContent) => {
  const sources = [
    /<media:content[^>]+url=["']([^"'>]+)["']/i,
    /<media:thumbnail[^>]+url=["']([^"'>]+)["']/i,
    /<enclosure[^>]+url=["']([^"'>]+)["']/i,
  ];

  for (const regex of sources) {
    const match = itemContent.match(regex);
    if (match?.[1]) return match[1];
  }

  const encoded = getTagValue(itemContent, 'content:encoded');
  const imgMatch = encoded.match(/<img[^>]+src=["']([^"'>]+)["']/i);
  return imgMatch?.[1] ?? null;
};

const toPublishedDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
};

/**
 * Parse RSS XML into normalized article records.
 * @param {string} xmlText
 * @param {{ defaultAuthor?: string }} options
 */
export const parseRssItems = (xmlText, options = {}) => {
  const { defaultAuthor = 'News' } = options;

  if (!xmlText || typeof xmlText !== 'string') {
    return [];
  }

  try {
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    const articles = [];
    let match;

    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];

      const title = decodeHtmlEntities(stripHtml(getTagValue(itemContent, 'title')).trim());
      if (!title) continue;

      const link =
        decodeHtmlEntities(getTagValue(itemContent, 'link').trim()) ||
        decodeHtmlEntities(getTagValue(itemContent, 'guid').trim());

      const author =
        decodeHtmlEntities(stripHtml(getTagValue(itemContent, 'dc:creator')).trim()) ||
        decodeHtmlEntities(stripHtml(getTagValue(itemContent, 'author')).trim()) ||
        defaultAuthor;

      const description = decodeHtmlEntities(
        stripHtml(getTagValue(itemContent, 'description')).trim()
      );

      const publishedAt = toPublishedDate(getTagValue(itemContent, 'pubDate'));

      articles.push({
        id: link || `${title}-${publishedAt.getTime()}`,
        title,
        link,
        author,
        publishedAt,
        description,
        categories: getCategories(itemContent),
        image: getImageUrl(itemContent),
      });
    }

    return articles;
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
    return [];
  }
};

