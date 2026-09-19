import { Code2, ExternalLink, FileText, Presentation, SquarePlay } from 'lucide-react';
import type { ActionLink } from '@/types/page';

const iconByType = {
    paper: FileText,
    pdf: FileText,
    project: ExternalLink,
    demo: SquarePlay,
    code: Code2,
    slides: Presentation,
    poster: Presentation,
    cv: FileText,
};

export default function ActionLinks({ actions }: { actions?: ActionLink[] }) {
    if (!actions?.length) return null;

    return (
        <div className="action-links" aria-label="Project links">
            {actions.map((action) => {
                const Icon = iconByType[action.type || 'project'];
                const external = /^https?:\/\//.test(action.href);
                const opensInNewTab = external || action.type === 'pdf';

                return (
                    <a
                        key={`${action.label}-${action.href}`}
                        href={action.href}
                        target={opensInNewTab ? '_blank' : undefined}
                        rel={opensInNewTab ? 'noopener noreferrer' : undefined}
                        className="action-link"
                        aria-label={`${action.label}${opensInNewTab ? ' (opens in a new tab)' : ''}`}
                    >
                        <Icon aria-hidden="true" size={15} strokeWidth={1.8} />
                        <span>{action.label}</span>
                    </a>
                );
            })}
        </div>
    );
}
