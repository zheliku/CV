import { Publication, PublicationType, ResearchArea } from '@/types/publication';
import { getConfig } from './config';
import { getRuntimeI18nConfig } from './i18n/config';
import { parseBibTeXInline } from './bibtexInline';

// Map BibTeX entry types to our publication types
const typeMapping: Record<string, PublicationType> = {
  article: 'journal',
  inproceedings: 'conference',
  conference: 'conference',
  incollection: 'book-chapter',
  book: 'book',
  phdthesis: 'thesis',
  mastersthesis: 'thesis',
  techreport: 'technical-report',
  unpublished: 'preprint',
  misc: 'preprint',
};

// Convert month names to numbers
const monthMapping: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, september: 9, sept: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

interface BibTeXEntry {
  entryType: string;
  citationKey: string;
  entryTags: Record<string, string>;
}

// Non-publication BibTeX directives we should skip over.
const IGNORED_ENTRY_TYPES = new Set(['comment', 'preamble', 'string']);

function skipWhitespace(value: string, index: number): number {
  while (index < value.length && /\s/.test(value[index])) {
    index += 1;
  }
  return index;
}

// Read a single field value starting right after the `=` sign.
// Supports braced {...}, quoted "..." and bare tokens (e.g. `month = mar`).
function readFieldValue(value: string, start: number): { text: string; index: number } {
  const char = value[start];

  if (char === '{' || char === '"') {
    const isBrace = char === '{';
    const closing = isBrace ? '}' : '"';
    let depth = 0;
    let index = start;

    for (; index < value.length; index += 1) {
      const current = value[index];
      if (isBrace && current === '{') depth += 1;
      else if (current === '}' && isBrace) {
        depth -= 1;
        if (depth === 0) break;
      } else if (!isBrace && current === closing) {
        break;
      }
    }

    return { text: value.slice(start + 1, index), index: index + 1 };
  }

  let index = start;
  while (index < value.length && value[index] !== ',' && value[index] !== '}') {
    index += 1;
  }
  return { text: value.slice(start, index).trim(), index };
}

// Parse the `field = value` pairs of a single entry, stopping at its closing `}`.
function readEntryFields(value: string, start: number): { tags: Record<string, string>; index: number } {
  const tags: Record<string, string> = {};
  let index = start;

  while (index < value.length) {
    index = skipWhitespace(value, index);

    let name = '';
    while (index < value.length && /[A-Za-z0-9_-]/.test(value[index])) {
      name += value[index];
      index += 1;
    }

    index = skipWhitespace(value, index);

    if (value[index] !== '=') {
      if (value[index] === '}') return { tags, index: index + 1 };
      index += 1;
      continue;
    }

    index = skipWhitespace(value, index + 1);
    const field = readFieldValue(value, index);
    index = skipWhitespace(value, field.index);

    if (name) {
      tags[name.toLowerCase()] = field.text;
    }

    if (value[index] === '}') return { tags, index: index + 1 };
    if (value[index] === ',') index += 1;
  }

  return { tags, index };
}

// Minimal, dependency-free BibTeX parser producing the same shape as the
// previous third-party parser: `{ entryType, citationKey, entryTags }[]`.
function parseBibTeXEntries(content: string): BibTeXEntry[] {
  const entries: BibTeXEntry[] = [];
  let index = 0;

  while (index < content.length) {
    const at = content.indexOf('@', index);
    if (at === -1) break;

    let cursor = skipWhitespace(content, at + 1);

    let entryType = '';
    while (cursor < content.length && /[A-Za-z]/.test(content[cursor])) {
      entryType += content[cursor];
      cursor += 1;
    }

    if (!entryType) {
      index = at + 1;
      continue;
    }

    cursor = skipWhitespace(content, cursor);

    if (content[cursor] !== '{') {
      index = at + 1;
      continue;
    }
    cursor += 1;

    // The citation key is the leading bare token before the first `,` or `}`.
    const keyStart = cursor;
    while (cursor < content.length && content[cursor] !== ',' && content[cursor] !== '}') {
      cursor += 1;
    }
    const citationKey = content.slice(keyStart, cursor).trim();

    if (content[cursor] === ',') cursor += 1;

    const body = readEntryFields(content, cursor);

    if (IGNORED_ENTRY_TYPES.has(entryType.toLowerCase())) {
      index = body.index;
      continue;
    }

    entries.push({ entryType, citationKey, entryTags: body.tags });

    index = body.index;
  }

  return entries;
}

export function parseBibTeX(bibtexContent: string, locale?: string): Publication[] {
  const highlightNames = getHighlightNames(locale);
  const entries = parseBibTeXEntries(bibtexContent);

  return entries.map((entry: { entryType: string; citationKey: string; entryTags: Record<string, string> }, index: number) => {
    const tags = entry.entryTags;

    // Parse authors
    const authors = parseAuthors(tags.author || '', highlightNames);

    // Parse year and month
    const year = parseInt(tags.year) || new Date().getFullYear();
    const monthStr = tags.month?.toLowerCase() || '';
    const month = monthMapping[monthStr] || (parseInt(monthStr) || undefined);

    // Determine type
    const type = typeMapping[entry.entryType.toLowerCase()] || 'journal';

    // Parse tags/keywords
    const keywords = tags.keywords?.split(',').map((k: string) => k.trim()) || [];

    // Parse selected field (convert string to boolean)
    const selected = tags.selected === 'true' || tags.selected === 'yes';

    // Parse preview field (remove braces if present)
    const preview = tags.preview?.replace(/[{}]/g, '');
    const title = parseBibTeXInline(tags.title || 'Untitled');

    // Create publication object
    const publication: Publication = {
      id: entry.citationKey || tags.id || `pub-${Date.now()}-${index}`,
      title: title.plainText || 'Untitled',
      titleNodes: title.nodes,
      authors,
      year,
      month: monthMapping[tags.month?.toLowerCase()] ? String(month) : tags.month,
      type,
      status: 'published',
      tags: keywords,
      keywords,
      researchArea: detectResearchArea(tags.title, keywords),

      // Optional fields
      journal: cleanBibTeXString(tags.journal),
      conference: cleanBibTeXString(tags.booktitle),
      volume: tags.volume,
      issue: tags.number,
      pages: tags.pages,
      doi: tags.doi,
      url: tags.url,
      code: tags.code,
      abstract: cleanBibTeXString(tags.abstract),
      description: cleanBibTeXString(tags.description || tags.note),
      selected,
      preview,
      category: cleanBibTeXString(tags.category || tags.badge),

      // Store original BibTeX (excluding custom fields)
      bibtex: reconstructBibTeX(entry, ['selected', 'preview', 'description', 'keywords', 'code', 'category', 'badge']),
    };

    // Clean up undefined fields
    Object.keys(publication).forEach(key => {
      if (publication[key as keyof Publication] === undefined) {
        delete publication[key as keyof Publication];
      }
    });

    return publication;
  }).sort((a: Publication, b: Publication) => {
    // Sort by year (descending), then by month if available
    if (b.year !== a.year) return b.year - a.year;

    // For month comparison, treat missing months as January (1) to ensure they appear last within the year
    const monthA = typeof a.month === 'string' ?
      (monthMapping[a.month.toLowerCase()] || parseInt(a.month) || 1) :
      (a.month || 1);
    const monthB = typeof b.month === 'string' ?
      (monthMapping[b.month.toLowerCase()] || parseInt(b.month) || 1) :
      (b.month || 1);

    // Sort by month descending (December to January)
    return monthB - monthA;
  });
}

function getHighlightNames(locale?: string): string[] {
  const names = new Set<string>();
  const baseConfig = getConfig();
  const runtimeI18n = getRuntimeI18nConfig(baseConfig.i18n);

  const addName = (name?: string) => {
    const cleaned = cleanBibTeXString(name).trim();
    if (cleaned) {
      names.add(cleaned);
    }
  };

  addName(baseConfig.author.name);

  if (runtimeI18n.enabled) {
    runtimeI18n.locales.forEach((localeCode) => {
      const localizedConfig = getConfig(localeCode);
      addName(localizedConfig.author.name);
    });
  }

  if (locale) {
    const currentLocaleConfig = getConfig(locale);
    addName(currentLocaleConfig.author.name);
  }

  return Array.from(names);
}

function normalizePersonNameForMatch(name: string): string {
  return name.toLowerCase().replace(/[\s.,'’`"()\-_/]/g, '');
}

function buildNameVariants(name: string): Set<string> {
  const variants = new Set<string>();
  const cleaned = cleanBibTeXString(name).toLowerCase().trim();

  if (!cleaned) {
    return variants;
  }

  variants.add(cleaned);

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 2) {
    variants.add(`${parts[1]} ${parts[0]}`);
  }

  return variants;
}

function parseAuthors(authorsStr: string, highlightNames: string[]): Array<{ name: string; isHighlighted?: boolean; isCorresponding?: boolean; isCoAuthor?: boolean }> {
  if (!authorsStr) return [];

  const highlightTextCandidates = new Set<string>();
  const highlightNormalizedCandidates = new Set<string>();

  highlightNames.forEach((name) => {
    const variants = buildNameVariants(name);
    variants.forEach((variant) => {
      highlightTextCandidates.add(variant);
      highlightNormalizedCandidates.add(normalizePersonNameForMatch(variant));
    });
  });

  const highlightTextList = Array.from(highlightTextCandidates);
  const highlightNormalizedList = Array.from(highlightNormalizedCandidates);

  // Split by "and" and clean up
  return authorsStr
    .split(/\sand\s/)
    .map(author => {
      // Clean up the author name
      let name = author.trim();

      // Check for corresponding author marker
      const isCorresponding = name.includes('*');

      // Check for co-author marker (#)
      const isCoAuthor = name.includes('#');

      // Remove special markers from name
      name = name.replace(/[*#]/g, '');

      // Handle "Last, First" format
      if (name.includes(',')) {
        const parts = name.split(',').map(p => p.trim());
        name = `${parts[1]} ${parts[0]}`;
      }

      name = cleanBibTeXString(name);

      // Check if this is the site owner (to highlight)
      const lowerName = name.toLowerCase();
      const normalizedName = normalizePersonNameForMatch(lowerName);
      const isHighlighted =
        highlightTextList.some((candidate) => lowerName.includes(candidate)) ||
        highlightNormalizedList.some((candidate) => normalizedName.includes(candidate));

      return {
        name,
        isHighlighted,
        isCorresponding,
        isCoAuthor,
      };
    })
    .filter(author => author.name);
}

function cleanBibTeXString(str?: string): string {
  if (!str) return '';

  return parseBibTeXInline(str).plainText;
}

function detectResearchArea(title: string, keywords: string[]): ResearchArea {
  const text = (title + ' ' + keywords.join(' ')).toLowerCase();

  if (text.includes('healthcare') || text.includes('medical') || text.includes('health')) {
    return 'ai-healthcare';
  }
  if (text.includes('signal') || text.includes('processing')) {
    return 'signal-processing';
  }
  if (text.includes('reliability') || text.includes('fault') || text.includes('diagnosis')) {
    return 'reliability-engineering';
  }
  if (text.includes('quantum')) {
    return 'quantum-computing';
  }
  if (text.includes('neural') || text.includes('spiking')) {
    return 'neural-networks';
  }
  if (text.includes('transformer') || text.includes('attention')) {
    return 'transformer-architectures';
  }

  return 'machine-learning';
}

function reconstructBibTeX(entry: { entryType: string; citationKey: string; entryTags: Record<string, string> }, excludeFields: string[] = []): string {
  const { entryType, citationKey, entryTags } = entry;

  let bibtex = `@${entryType}{${citationKey},\n`;

  Object.entries(entryTags).forEach(([key, value]) => {
    // Skip excluded fields
    if (!excludeFields.includes(key.toLowerCase())) {
      let cleanValue = value;

      // Clean author field by removing # and * symbols
      if (key.toLowerCase() === 'author') {
        cleanValue = value.replace(/[#*]/g, '');
      }

      bibtex += `  ${key} = {${cleanValue}},\n`;
    }
  });

  // Remove trailing comma and newline
  bibtex = bibtex.slice(0, -2) + '\n';
  bibtex += '}';

  return bibtex;
} 
