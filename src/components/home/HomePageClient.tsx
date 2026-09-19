'use client';

import Profile from '@/components/home/Profile';
import About from '@/components/home/About';
import News, { NewsItem } from '@/components/home/News';
import PublicationsList from '@/components/publications/PublicationsList';
import TextPage from '@/components/pages/TextPage';
import CardPage from '@/components/pages/CardPage';
import type { SiteConfig } from '@/lib/config';
import type { Publication } from '@/types/publication';
import type { CardPageConfig, PublicationPageConfig, TextPageConfig } from '@/types/page';
import { useLocaleStore } from '@/lib/stores/localeStore';

interface SectionConfig {
  id: string;
  type: 'markdown' | 'publications' | 'list';
  title?: string;
  source?: string;
  filter?: string;
  limit?: number;
  content?: string;
  publications?: Publication[];
  items?: NewsItem[];
}

type PageData =
  | { type: 'about'; id: string; sections: SectionConfig[] }
  | { type: 'publication'; id: string; config: PublicationPageConfig; publications: Publication[] }
  | { type: 'text'; id: string; config: TextPageConfig; content: string }
  | { type: 'card'; id: string; config: CardPageConfig; continuationConfig?: CardPageConfig };

export interface HomePageLocaleData {
  author: SiteConfig['author'];
  social: SiteConfig['social'];
  features: SiteConfig['features'];
  enableOnePageMode?: boolean;
  researchInterests?: string[];
  pagesToShow: PageData[];
}

interface HomePageClientProps {
  dataByLocale: Record<string, HomePageLocaleData>;
  defaultLocale: string;
}

export default function HomePageClient({ dataByLocale, defaultLocale }: HomePageClientProps) {
  const locale = useLocaleStore((state) => state.locale);
  const fallback = dataByLocale[defaultLocale] || Object.values(dataByLocale)[0];
  const data = dataByLocale[locale] || fallback;

  if (!data) return null;

  const aboutPage = data.pagesToShow.find((page): page is Extract<PageData, { type: 'about' }> => page.type === 'about');
  const biography = aboutPage?.sections.find((section) => section.type === 'markdown');
  const news = aboutPage?.sections.find((section) => section.type === 'list');
  const contentPages = data.pagesToShow.filter((page) => page.type !== 'about');

  return (
    <div className="homepage-shell">
      <section id="about" className="hero-section scroll-mt-24">
        <div className="hero-grid">
          <Profile
            author={data.author}
            social={data.social}
            features={data.features}
          />
          {biography && (
            <About
              content={biography.content || ''}
              title={biography.title}
              researchInterests={data.researchInterests}
            />
          )}
        </div>
        {news && <News items={news.items || []} title={news.title} />}
      </section>

      <div className="site-sections">
        {contentPages.map((page) => (
          <section key={page.id} id={page.id} className="site-section scroll-mt-24">
            {page.type === 'publication' && (
              <PublicationsList config={page.config} publications={page.publications} embedded />
            )}
            {page.type === 'text' && <TextPage config={page.config} content={page.content} embedded />}
            {page.type === 'card' && (page.continuationConfig ? (
              <div className="research-section-content">
                <CardPage config={page.config} embedded />
                <CardPage config={page.continuationConfig} embedded />
              </div>
            ) : (
              <CardPage config={page.config} embedded />
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
