'use client';

import { useState } from 'react';
import Image from 'next/image';
import { withBasePath } from '@/lib/basePath';
import { Code2, ExternalLink, FileText } from 'lucide-react';
import FormattedBibTeXText from './FormattedBibTeXText';
import Tag from '@/components/ui/Tag';
import { useLocaleStore } from '@/lib/stores/localeStore';
import { useMessages } from '@/lib/i18n/useMessages';
import type { Publication } from '@/types/publication';

// 论文类别标签的中文→英文映射（bib 的 category 为中文，单一数据源；英文站按此表本地化）。
const CATEGORY_EN: Record<string, string> = {
    'CCF-A 会议': 'CCF-A Conference',
    'CCF-B 会议': 'CCF-B Conference',
    'CCF-C 会议': 'CCF-C Conference',
    'CCF-A 期刊': 'CCF-A Journal',
    'CCF-B 期刊': 'CCF-B Journal',
    'CCF-C 期刊': 'CCF-C Journal',
    '中科院1区': 'CAS Q1',
    '中科院2区': 'CAS Q2',
    '中科院3区': 'CAS Q3',
    '中科院4区': 'CAS Q4',
    'EI 会议': 'EI Conference',
    'EI 期刊': 'EI Journal',
    'SCI 期刊': 'SCI Journal',
    'SCI 检索': 'SCI-indexed',
    '国际专著章节': 'International Book Chapter',
    '国内核心期刊': 'Domestic Core Journal',
};

export default function PublicationCard({ publication }: { publication: Publication }) {
    const locale = useLocaleStore((state) => state.locale);
    const messages = useMessages();
    const isChinese = locale.startsWith('zh');
    const [showAbstract, setShowAbstract] = useState(false);
    const [showBibtex, setShowBibtex] = useState(false);
    const [copied, setCopied] = useState(false);

    const isPatent = publication.type === 'patent';
    const venue = publication.venue || publication.journal || publication.conference;
    const cover = publication.preview ? `/papers/${publication.preview}` : null;
    const categories = (publication.category || '')
        .split(/[,，、;；]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => (isChinese ? s : CATEGORY_EN[s] || s));
    const keywords = publication.keywords ?? [];

    const copyBibtex = async () => {
        try {
            await navigator.clipboard.writeText(publication.bibtex || '');
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            // Clipboard may be unavailable (insecure context); ignore silently.
        }
    };

    return (
        <article className="publication-card">
            <div className="publication-visual">
                {cover ? (
                    <Image
                        src={withBasePath(cover)}
                        alt={publication.title}
                        width={640}
                        height={400}
                        className="publication-cover"
                        unoptimized
                    />
                ) : (
                    <div
                        className="publication-teaser"
                        role="img"
                        aria-label={isChinese ? '论文预览图待添加' : 'Paper teaser pending'}
                    >
                        <span className="publication-teaser-code">{isPatent ? 'PAT' : 'PUB'}</span>
                        <span className="publication-teaser-line" />
                        <span className="publication-teaser-year">{publication.year}</span>
                    </div>
                )}

                <div className="action-links">
                    {publication.pdfUrl && (
                        <a href={publication.pdfUrl} target="_blank" rel="noopener noreferrer" className="action-link">
                            <FileText aria-hidden="true" size={15} strokeWidth={1.8} />
                            <span>PDF</span>
                        </a>
                    )}
                    {publication.doi && (
                        <a href={`https://doi.org/${publication.doi}`} target="_blank" rel="noopener noreferrer" className="action-link">
                            <ExternalLink aria-hidden="true" size={15} strokeWidth={1.8} />
                            <span>DOI</span>
                        </a>
                    )}
                    {publication.code && (
                        <a href={publication.code} target="_blank" rel="noopener noreferrer" className="action-link">
                            <Code2 aria-hidden="true" size={15} strokeWidth={1.8} />
                            <span>{messages.publications.code}</span>
                        </a>
                    )}
                    {publication.abstract && (
                        <button type="button" className="action-link" aria-expanded={showAbstract} onClick={() => setShowAbstract((v) => !v)}>
                            <FileText aria-hidden="true" size={15} strokeWidth={1.8} />
                            <span>{messages.publications.abstract}</span>
                        </button>
                    )}
                    {publication.bibtex && (
                        <button type="button" className="action-link" aria-expanded={showBibtex} onClick={() => setShowBibtex((v) => !v)}>
                            <FileText aria-hidden="true" size={15} strokeWidth={1.8} />
                            <span>{messages.publications.bibtex}</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="publication-content">
                <h3 className="publication-title">
                    {publication.url ? (
                        <a href={publication.url} target="_blank" rel="noopener noreferrer" className="research-title-link">
                            <FormattedBibTeXText nodes={publication.titleNodes} fallback={publication.title} />
                            <ExternalLink className="research-title-link-icon" aria-hidden="true" size={14} strokeWidth={1.8} />
                            <span className="sr-only"> (opens in a new tab)</span>
                        </a>
                    ) : (
                        <FormattedBibTeXText nodes={publication.titleNodes} fallback={publication.title} />
                    )}
                </h3>
                <p className="publication-authors">
                    {publication.authors.map((author, index) => (
                        <span key={`${author.name}-${index}`}>
                            <span className={author.isHighlighted ? 'publication-author-highlight' : undefined}>
                                {author.name}
                                {author.isCorresponding && <sup className="ml-0">†</sup>}
                            </span>
                            {index < publication.authors.length - 1 && ', '}
                        </span>
                    ))}
                </p>
                {venue && <p className="publication-venue">{venue}</p>}
                {publication.description && <p className="publication-description">{publication.description}</p>}

                {(keywords.length > 0 || categories.length > 0) && (
                    <div className="publication-meta-row">
                        {keywords.length > 0 && (
                            <div className="tag-row">
                                {keywords.slice(0, 4).map((keyword) => <Tag key={keyword}>{keyword}</Tag>)}
                            </div>
                        )}
                        {categories.length > 0 && (
                            <div className="publication-badges">
                                {categories.map((cat) => <span key={cat} className="status-label">{cat}</span>)}
                            </div>
                        )}
                    </div>
                )}

                {showAbstract && publication.abstract && (
                    <p className="research-summary">{publication.abstract}</p>
                )}

                {showBibtex && publication.bibtex && (
                    <div className="method-row">
                        <button type="button" className="action-link" onClick={copyBibtex} style={{ marginBottom: '0.5rem' }}>
                            <span>{copied ? (isChinese ? '已复制' : 'Copied!') : messages.common.copyToClipboard}</span>
                        </button>
                        <pre className="publication-bibtex">{publication.bibtex}</pre>
                    </div>
                )}
            </div>
        </article>
    );
}
