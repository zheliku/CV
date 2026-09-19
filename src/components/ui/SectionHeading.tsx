interface SectionHeadingProps {
    title: string;
    description?: string;
    embedded?: boolean;
}

export default function SectionHeading({ title, description, embedded = false }: SectionHeadingProps) {
    const Heading = embedded ? 'h2' : 'h1';

    return (
        <header className="section-heading">
            <Heading className={embedded ? 'section-title' : 'page-title'}>{title}</Heading>
            {description && <p className="section-description">{description}</p>}
        </header>
    );
}
