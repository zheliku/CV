export type ExternalEntityType = 'university' | 'lab' | 'company' | 'faculty' | 'program';

interface ExternalEntity {
    en: string;
    zh?: string;
    short?: string;
    url: string;
    type: ExternalEntityType;
    aliases: readonly string[];
}

// Auto-linked entities. Seeded with your own institutions; add labs, advisors,
// or programs here and they will be linked automatically wherever their alias
// appears in bio / news / card text. Reference-site placeholder text that names
// other organizations is intentionally left unlinked (no matching alias).
export const externalEntities = {
    beijingNormalUniversity: {
        en: 'Beijing Normal University',
        zh: '北京师范大学',
        short: 'BNU',
        url: 'https://www.bnu.edu.cn/',
        type: 'university',
        aliases: [
            'Beijing Normal University',
            '北京师范大学',
            'BNU',
            'School of Artificial Intelligence, Beijing Normal University',
        ],
    },
} as const satisfies Record<string, ExternalEntity>;

export type ExternalEntityKey = keyof typeof externalEntities;

export const organizationEntityKeys: readonly ExternalEntityKey[] = ['beijingNormalUniversity'];

export const facultyEntityKeys: readonly ExternalEntityKey[] = [];

export const newsEntityKeys: readonly ExternalEntityKey[] = organizationEntityKeys;

export const allExternalEntityKeys: readonly ExternalEntityKey[] = [
    ...organizationEntityKeys,
    ...facultyEntityKeys,
];

export interface ExternalEntitySegment {
    text: string;
    entity?: ExternalEntityKey;
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getAliasEntries(keys: readonly ExternalEntityKey[]) {
    return keys
        .flatMap((key) => externalEntities[key].aliases.map((alias) => ({ alias, key })))
        .sort((a, b) => b.alias.length - a.alias.length);
}

export function tokenizeExternalEntities(
    text: string,
    keys: readonly ExternalEntityKey[] = allExternalEntityKeys
): ExternalEntitySegment[] {
    const aliases = getAliasEntries(keys);
    if (!text || aliases.length === 0) return [{ text }];

    const entityByAlias = new Map<string, ExternalEntityKey>(
        aliases.map(({ alias, key }): [string, ExternalEntityKey] => [alias, key])
    );
    const matcher = new RegExp(aliases.map(({ alias }) => escapeRegExp(alias)).join('|'), 'g');
    const segments: ExternalEntitySegment[] = [];
    let cursor = 0;

    for (const match of text.matchAll(matcher)) {
        const index = match.index ?? 0;
        if (index > cursor) segments.push({ text: text.slice(cursor, index) });
        segments.push({ text: match[0], entity: entityByAlias.get(match[0]) });
        cursor = index + match[0].length;
    }

    if (cursor < text.length) segments.push({ text: text.slice(cursor) });
    return segments.length > 0 ? segments : [{ text }];
}

export function getExternalEntityKeyByUrl(url?: string): ExternalEntityKey | undefined {
    if (!url) return undefined;
    return allExternalEntityKeys.find((key) => externalEntities[key].url === url);
}
