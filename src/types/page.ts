export interface BasePageConfig {
    type: 'about' | 'publication' | 'card' | 'text';
    title: string;
    description?: string;
}

export interface PublicationPageConfig extends BasePageConfig {
    type: 'publication';
    source: string;
}

export interface TextPageConfig extends BasePageConfig {
    type: 'text';
    source: string;
}

export interface ActionLink {
    label: string;
    href: string;
    type?: 'paper' | 'pdf' | 'project' | 'demo' | 'code' | 'slides' | 'poster' | 'cv';
}

export interface CardItem {
    title: string;
    eyebrow?: string;
    subtitle?: string;
    affiliation?: string;
    role?: string;
    advisor?: string;
    status?: string;
    date?: string;
    location?: string;
    content?: string;
    tags?: string[];
    methods?: string[];
    metrics?: string[];
    bullets?: string[];
    actions?: ActionLink[];
    link?: string;
    title_link?: string;
    image?: string;
    images?: string[];
    image_layout?: 'row' | 'column';
    teaser?: string;
    teaser_label?: string;
    featured?: boolean;
}

export interface CardPageConfig extends BasePageConfig {
    type: 'card';
    variant?: 'research' | 'timeline' | 'compact' | 'awards' | 'clusters';
    date_position?: 'aside' | 'header';
    items: CardItem[];
}
