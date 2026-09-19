'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ExternalEntityText } from '@/components/ui/ExternalEntityLink';
import { organizationEntityKeys } from '@/lib/externalEntities';
import { useLocaleStore } from '@/lib/stores/localeStore';
import type { CardItem } from '@/types/page';

function yearOf(date?: string): string {
    if (!date) return '—';
    const match = date.match(/\d{4}/);
    return match ? match[0] : date.trim() || '—';
}

interface AwardGroup {
    label: string;
    items: CardItem[];
}

// Collapse consecutive items that share a label into one group, so the label is
// shown once and same-label items merge (no separator between them).
function groupByConsecutive(items: CardItem[], labelFor: (item: CardItem) => string): AwardGroup[] {
    const groups: AwardGroup[] = [];
    for (const item of items) {
        const label = labelFor(item);
        const last = groups[groups.length - 1];
        if (last && last.label === label) {
            last.items.push(item);
        } else {
            groups.push({ label, items: [item] });
        }
    }
    return groups;
}

function AwardRow({ item, showDate, last }: { item: CardItem; showDate: string; last: boolean }) {
    return (
        <li className="award-item">
            {showDate ? (
                <span className="award-date">{showDate}</span>
            ) : (
                <span className="award-date-spacer" aria-hidden="true" />
            )}
            <div className={`award-body${last ? ' is-last' : ''}`}>
                <p className="award-title">
                    <ExternalEntityText entities={organizationEntityKeys}>{item.title}</ExternalEntityText>
                </p>
                {(item.subtitle || item.content) && (
                    <p className="award-detail">{[item.subtitle, item.content].filter(Boolean).join(' · ')}</p>
                )}
            </div>
        </li>
    );
}

function AwardGroupList({ groups }: { groups: AwardGroup[] }) {
    return (
        <>
            {groups.map((group, groupIndex) => (
                <ul className="award-month-group" key={`${group.label}-${groupIndex}`}>
                    {group.items.map((item, itemIndex) => (
                        <AwardRow
                            key={`${item.title}-${itemIndex}`}
                            item={item}
                            showDate={itemIndex === 0 ? group.label : ''}
                            last={itemIndex === group.items.length - 1}
                        />
                    ))}
                </ul>
            ))}
        </>
    );
}

export default function AwardsList({ items }: { items: CardItem[] }) {
    const locale = useLocaleStore((state) => state.locale);
    const isChinese = locale.startsWith('zh');
    const [expanded, setExpanded] = useState(false);
    const listId = useId();
    const toggleRef = useRef<HTMLButtonElement>(null);

    const monthLabel = (date?: string): string => {
        if (!date) return '';
        const parts = date.split('/');
        if (parts.length >= 2) {
            const mm = parseInt(parts[1], 10);
            if (!Number.isNaN(mm)) {
                return isChinese ? `${mm}月` : String(mm).padStart(2, '0');
            }
        }
        return '';
    };

    const featuredItems = useMemo(() => {
        const featured = items.filter((item) => item.featured);
        return featured.length > 0 ? featured : items;
    }, [items]);

    const featuredGroups = useMemo(
        () => groupByConsecutive(featuredItems, (item) => item.date || ''),
        [featuredItems]
    );

    const yearGroups = useMemo(() => {
        const years = new Map<string, CardItem[]>();
        for (const item of items) {
            const year = yearOf(item.date);
            years.set(year, [...(years.get(year) || []), item]);
        }
        return Array.from(years, ([year, list]) => ({ year, list }));
    }, [items]);

    const handleToggle = () => {
        if (expanded) {
            setExpanded(false);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    toggleRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                });
            });
            return;
        }

        setExpanded(true);
    };

    const toggleLabel = expanded
        ? (isChinese ? '收起' : 'Show Less')
        : (isChinese ? `查看全部奖项与项目（${items.length}）` : `View All Awards & Grants (${items.length})`);

    return (
        <div className="awards-disclosure">
            <div key={expanded ? 'expanded' : 'collapsed'} id={listId} className="awards-disclosure-content">
                {expanded ? (
                    <div className="award-groups">
                        {yearGroups.map((group) => {
                            const headingId = `${listId}-${group.year}`;
                            return (
                                <section className="award-year-group" aria-labelledby={headingId} key={group.year}>
                                    <h3 className="award-year-heading" id={headingId}>
                                        <span>{group.year}</span>
                                    </h3>
                                    <AwardGroupList
                                        groups={groupByConsecutive(group.list, (item) => monthLabel(item.date))}
                                    />
                                </section>
                            );
                        })}
                    </div>
                ) : (
                    <AwardGroupList groups={featuredGroups} />
                )}
            </div>

            <button
                ref={toggleRef}
                type="button"
                className="awards-toggle"
                aria-expanded={expanded}
                aria-controls={listId}
                onClick={handleToggle}
            >
                <span>{toggleLabel}</span>
                {expanded ? <ChevronUp aria-hidden="true" size={15} /> : <ChevronDown aria-hidden="true" size={15} />}
            </button>
        </div>
    );
}
