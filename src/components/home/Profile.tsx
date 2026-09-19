'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { CalendarDays, Check, FileText, Github, GraduationCap, Heart, Mail, MapPin } from 'lucide-react';
import { ExternalEntityText } from '@/components/ui/ExternalEntityLink';
import type { SiteConfig } from '@/lib/config';
import { organizationEntityKeys } from '@/lib/externalEntities';
import { useLocaleStore } from '@/lib/stores/localeStore';
import { useMessages } from '@/lib/i18n/useMessages';

// Custom ORCID icon (lucide has no brand mark).
const OrcidIcon = ({ size = 17 }: { size?: number }) => (
    <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 0 1-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.025-5.325 5.025h-3.919V7.416zm1.444 1.303v7.444h2.297c3.272 0 4.022-2.484 4.022-3.722 0-2.016-1.284-3.722-4.097-3.722h-2.222z" />
    </svg>
);

const LIKE_KEY = 'jiale-website-user-liked';
const LIKE_EVENT = 'profile-liked-change';

// The "liked" flag lives in localStorage, so model it as an external store to
// stay in sync across tabs without a post-mount setState (hydration-safe).
function subscribeLiked(callback: () => void) {
    window.addEventListener('storage', callback);
    window.addEventListener(LIKE_EVENT, callback);
    return () => {
        window.removeEventListener('storage', callback);
        window.removeEventListener(LIKE_EVENT, callback);
    };
}

function getLikedSnapshot() {
    return localStorage.getItem(LIKE_KEY) === 'true';
}

function getLikedServerSnapshot() {
    return false;
}

async function copyText(text: string) {
    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // Fall through to the compatibility path below.
        }
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
        return document.execCommand('copy');
    } finally {
        textarea.remove();
    }
}

interface ProfileProps {
    author: SiteConfig['author'];
    social: SiteConfig['social'];
    features: SiteConfig['features'];
}

export default function Profile({ author, social, features }: ProfileProps) {
    const messages = useMessages();
    const locale = useLocaleStore((state) => state.locale);
    const isChinese = locale.startsWith('zh');
    const locationDetails = Array.isArray(social.location_details) ? social.location_details : [];

    const hasLiked = useSyncExternalStore(subscribeLiked, getLikedSnapshot, getLikedServerSnapshot);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
    const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
        };
    }, []);

    const handleEmailCopy = async () => {
        if (!social.email) return;

        const copied = await copyText(social.email);
        setCopyStatus(copied ? 'copied' : 'error');

        if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
        copyResetTimer.current = setTimeout(() => setCopyStatus('idle'), 1800);
    };

    const handleLike = () => {
        const nextLiked = !hasLiked;
        if (nextLiked) {
            localStorage.setItem(LIKE_KEY, 'true');
        } else {
            localStorage.removeItem(LIKE_KEY);
        }
        window.dispatchEvent(new Event(LIKE_EVENT));
    };

    const emailButtonText =
        copyStatus === 'copied'
            ? (isChinese ? '已复制' : 'Copied!')
            : copyStatus === 'error'
                ? (isChinese ? '复制失败' : 'Copy failed')
                : social.email;

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="profile-panel"
        >
            <div className="profile-portrait">
                <Image
                    src={author.avatar}
                    alt={`Portrait of ${author.name}`}
                    fill
                    className="object-cover object-[32%_center]"
                    sizes="(max-width: 767px) 78vw, 250px"
                    priority
                />
            </div>

            <div className="profile-identity">
                <h1>{author.name}</h1>
                <p className="profile-institution">
                    <ExternalEntityText entities={organizationEntityKeys}>{author.institution}</ExternalEntityText>
                </p>
            </div>

            <div className="profile-actions" aria-label={isChinese ? '联系方式与文件' : 'Contact and files'}>
                {social.email && (
                    <button
                        type="button"
                        className={`profile-email-copy${copyStatus === 'copied' ? ' is-copied' : ''}`}
                        onClick={handleEmailCopy}
                        aria-label={isChinese ? `复制邮箱地址：${social.email}` : `Copy email address: ${social.email}`}
                        title={isChinese ? '点击复制邮箱地址' : 'Click to copy email address'}
                    >
                        {copyStatus === 'copied' ? (
                            <Check aria-hidden="true" size={17} />
                        ) : (
                            <Mail aria-hidden="true" size={17} />
                        )}
                        <span aria-live="polite">{emailButtonText}</span>
                    </button>
                )}

                {social.github && (
                    <a href={social.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub (opens in a new tab)">
                        <Github aria-hidden="true" size={17} />
                        <span>GitHub</span>
                    </a>
                )}

                {social.google_scholar && (
                    <a href={social.google_scholar} target="_blank" rel="noopener noreferrer" aria-label="Google Scholar (opens in a new tab)">
                        <GraduationCap aria-hidden="true" size={17} />
                        <span>Scholar</span>
                    </a>
                )}

                {social.orcid && (
                    <a href={social.orcid} target="_blank" rel="noopener noreferrer" aria-label="ORCID (opens in a new tab)">
                        <OrcidIcon />
                        <span>ORCID</span>
                    </a>
                )}

                <Link href="/cv" aria-label={isChinese ? '查看简历' : 'View CV'}>
                    <FileText aria-hidden="true" size={17} />
                    <span>CV</span>
                </Link>
            </div>

            <div className="profile-details">
                {social.location && (
                    <p className="profile-location">
                        <MapPin aria-hidden="true" size={15} />
                        {social.location_url ? (
                            <a href={social.location_url} target="_blank" rel="noopener noreferrer">
                                {social.location}
                            </a>
                        ) : (
                            <span>{social.location}</span>
                        )}
                    </p>
                )}
                {locationDetails.map((detail) => (
                    <p className="profile-location" key={detail}>
                        <CalendarDays aria-hidden="true" size={15} />
                        <span>{detail}</span>
                    </p>
                ))}
            </div>

            {features.enable_likes && (
                <div className="profile-actions" style={{ marginTop: '1rem' }}>
                    <button
                        type="button"
                        className="profile-email-copy"
                        onClick={handleLike}
                        style={{ minWidth: 0, color: hasLiked ? 'var(--error)' : undefined, borderColor: hasLiked ? 'var(--error)' : undefined }}
                        aria-pressed={hasLiked}
                    >
                        <Heart aria-hidden="true" size={17} fill={hasLiked ? 'currentColor' : 'none'} />
                        <span>{hasLiked ? messages.profile.liked : messages.profile.like}</span>
                    </button>
                </div>
            )}
        </motion.div>
    );
}
