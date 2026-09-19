import { Children, type AnchorHTMLAttributes, type ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import {
    externalEntities,
    getExternalEntityKeyByUrl,
    tokenizeExternalEntities,
    type ExternalEntityKey,
} from '@/lib/externalEntities';

interface ExternalEntityLinkProps {
    entity: ExternalEntityKey;
    children?: ReactNode;
    className?: string;
}

export default function ExternalEntityLink({
    entity,
    children,
    className,
}: ExternalEntityLinkProps) {
    const definition = externalEntities[entity];
    const classes = ['external-entity-link', className].filter(Boolean).join(' ');

    return (
        <a
            href={definition.url}
            target="_blank"
            rel="noopener noreferrer"
            className={classes}
        >
            {children || definition.en}
            <ArrowUpRight aria-hidden="true" className="external-entity-icon" />
            <span className="sr-only"> (opens in a new tab)</span>
        </a>
    );
}

interface ExternalEntityTextProps {
    children: string;
    entities?: readonly ExternalEntityKey[];
}

export function ExternalEntityText({ children, entities }: ExternalEntityTextProps) {
    const segments = tokenizeExternalEntities(children, entities);

    return (
        <>
            {segments.map((segment, index) => segment.entity ? (
                <ExternalEntityLink key={`${segment.entity}-${index}`} entity={segment.entity}>
                    {segment.text}
                </ExternalEntityLink>
            ) : (
                <span key={`text-${index}`}>{segment.text}</span>
            ))}
        </>
    );
}

interface ExternalEntityChildrenProps {
    children: ReactNode;
    entities?: readonly ExternalEntityKey[];
}

export function ExternalEntityChildren({ children, entities }: ExternalEntityChildrenProps) {
    return (
        <>
            {Children.map(children, (child) => typeof child === 'string' ? (
                <ExternalEntityText entities={entities}>{child}</ExternalEntityText>
            ) : child)}
        </>
    );
}

export function ExternalEntityMarkdownLink({
    href,
    children,
    ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
    const entity = getExternalEntityKeyByUrl(href);

    if (entity) {
        return <ExternalEntityLink entity={entity}>{children}</ExternalEntityLink>;
    }

    return (
        <a {...props} href={href} target="_blank" rel="noopener noreferrer">
            {children}
        </a>
    );
}
