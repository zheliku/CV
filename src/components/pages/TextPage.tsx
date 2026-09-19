'use client';

import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import SectionHeading from '@/components/ui/SectionHeading';
import type { TextPageConfig } from '@/types/page';
import {
    ExternalEntityChildren,
    ExternalEntityMarkdownLink,
} from '@/components/ui/ExternalEntityLink';

interface TextPageProps {
    config: TextPageConfig;
    content: string;
    embedded?: boolean;
}

export default function TextPage({ config, content, embedded = false }: TextPageProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className={embedded ? '' : 'cv-page'}
        >
            <SectionHeading title={config.title} description={config.description} embedded={embedded} />
            <div className="prose-cv">
                <ReactMarkdown
                    components={{
                        h1: ({ children }) => <h2><ExternalEntityChildren>{children}</ExternalEntityChildren></h2>,
                        h2: ({ children }) => <h2><ExternalEntityChildren>{children}</ExternalEntityChildren></h2>,
                        h3: ({ children }) => <h3><ExternalEntityChildren>{children}</ExternalEntityChildren></h3>,
                        p: ({ children }) => <p><ExternalEntityChildren>{children}</ExternalEntityChildren></p>,
                        ul: ({ children }) => <ul>{children}</ul>,
                        ol: ({ children }) => <ol>{children}</ol>,
                        li: ({ children }) => <li><ExternalEntityChildren>{children}</ExternalEntityChildren></li>,
                        a: ExternalEntityMarkdownLink,
                        blockquote: ({ children }) => <blockquote>{children}</blockquote>,
                        strong: ({ children }) => (
                            <strong><ExternalEntityChildren>{children}</ExternalEntityChildren></strong>
                        ),
                        em: ({ children }) => <em><ExternalEntityChildren>{children}</ExternalEntityChildren></em>,
                    }}
                >
                    {content}
                </ReactMarkdown>
            </div>
        </motion.div>
    );
}
