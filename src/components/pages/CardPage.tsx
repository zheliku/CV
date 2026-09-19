'use client';

import { motion } from 'framer-motion';
import ResearchCard from '@/components/research/ResearchCard';
import SectionHeading from '@/components/ui/SectionHeading';
import Tag from '@/components/ui/Tag';
import ActionLinks from '@/components/ui/ActionLinks';
import AwardsList from '@/components/pages/AwardsList';
import { ExternalEntityText } from '@/components/ui/ExternalEntityLink';
import type { CardItem, CardPageConfig } from '@/types/page';
import { facultyEntityKeys, organizationEntityKeys } from '@/lib/externalEntities';

function ItemMetadata({ item }: { item: CardItem }) {
    const values = [item.role, item.advisor, item.location].filter(Boolean);
    if (!values.length) return null;
    return (
        <p className="timeline-metadata">
            <ExternalEntityText entities={facultyEntityKeys}>{values.join(' · ')}</ExternalEntityText>
        </p>
    );
}

function TimelineItem({ item, datePosition = 'aside' }: { item: CardItem; datePosition?: CardPageConfig['date_position'] }) {
    const headerDate = datePosition === 'header';

    return (
        <article className={`timeline-item${headerDate ? ' timeline-item--header-date' : ''}`}>
            {!headerDate && item.date && <div className="timeline-date">{item.date}</div>}
            <div className="timeline-body">
                <div className="timeline-heading-row">
                    <div className="timeline-heading-main">
                        {item.eyebrow && <span className="eyebrow">{item.eyebrow}</span>}
                        <h3 className="timeline-title">
                            <ExternalEntityText entities={organizationEntityKeys}>{item.title}</ExternalEntityText>
                        </h3>
                    </div>
                    {headerDate && item.date && <div className="timeline-date">{item.date}</div>}
                    {item.status && <span className="status-label">{item.status}</span>}
                </div>
                {item.subtitle && <p className="timeline-subtitle">{item.subtitle}</p>}
                <ItemMetadata item={item} />
                {item.content && <p className="timeline-summary">{item.content}</p>}
                {item.bullets && item.bullets.length > 0 && (
                    <ul className="timeline-bullets">
                        {item.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                    </ul>
                )}
                {item.tags && item.tags.length > 0 && (
                    <div className="tag-row">{item.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</div>
                )}
                {item.methods && item.methods.length > 0 && (
                    <div className="tag-row">{item.methods.map((method) => <Tag key={method} variant="method">{method}</Tag>)}</div>
                )}
                <ActionLinks actions={item.actions} />
            </div>
        </article>
    );
}

function CompactItem({ item, variant }: { item: CardItem; variant: CardPageConfig['variant'] }) {
    const cluster = variant === 'clusters';
    return (
        <article className={cluster ? 'cluster-item' : 'compact-item'}>
            <div className="compact-heading-row">
                <div>
                    {item.eyebrow && <span className="eyebrow">{item.eyebrow}</span>}
                    <h3 className="compact-title">
                        <ExternalEntityText entities={organizationEntityKeys}>{item.title}</ExternalEntityText>
                    </h3>
                </div>
                {item.date && <span className="compact-date">{item.date}</span>}
            </div>
            {item.subtitle && <p className="compact-subtitle">{item.subtitle}</p>}
            <ItemMetadata item={item} />
            {item.content && <p className="compact-summary">{item.content}</p>}
            {item.bullets && item.bullets.length > 0 && (
                <ul className="compact-bullets">{item.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
            )}
            {item.tags && item.tags.length > 0 && (
                <div className="tag-row">{item.tags.map((tag) => <Tag key={tag} variant={cluster ? 'method' : 'research'}>{tag}</Tag>)}</div>
            )}
            <ActionLinks actions={item.actions} />
        </article>
    );
}

export default function CardPage({
    config,
    embedded = false,
    showHeading = true,
}: {
    config: CardPageConfig;
    embedded?: boolean;
    showHeading?: boolean;
}) {
    const variant = config.variant || 'compact';

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.05 }}
            transition={{ duration: 0.45 }}
        >
            {showHeading && (
                <SectionHeading title={config.title} description={config.description} embedded={embedded} />
            )}

            {variant === 'research' && (
                <div className="research-list">
                    {config.items.map((item, index) => <ResearchCard key={`${item.title}-${index}`} item={item} />)}
                </div>
            )}

            {variant === 'timeline' && (
                <div className="timeline-list">
                    {config.items.map((item, index) => (
                        <TimelineItem
                            key={`${item.title}-${item.date}-${index}`}
                            item={item}
                            datePosition={config.date_position}
                        />
                    ))}
                </div>
            )}

            {variant === 'awards' && (
                <AwardsList items={config.items} />
            )}

            {(variant === 'compact' || variant === 'clusters') && (
                <div className={variant === 'clusters' ? 'cluster-grid' : 'compact-grid'}>
                    {config.items.map((item, index) => <CompactItem key={`${item.title}-${item.date || ''}-${index}`} item={item} variant={variant} />)}
                </div>
            )}
        </motion.div>
    );
}
