import { cn } from '@/lib/utils';

interface TagProps {
    children: React.ReactNode;
    variant?: 'research' | 'method';
}

export default function Tag({ children, variant = 'research' }: TagProps) {
    return (
        <span className={cn('tag', variant === 'method' ? 'tag-method' : 'tag-research')}>
            {children}
        </span>
    );
}
