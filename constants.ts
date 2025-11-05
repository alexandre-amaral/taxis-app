
import { ContentSource } from './types';

export const CATEGORIES = [
  'Technology',
  'News',
  'Brazilian News',
  'Politics',
  'Finance',
  'Science',
];

export interface CategoryWithSubcategories {
  name: string;
  subcategories: string[];
}

export const CATEGORIES_WITH_SUBCATEGORIES: CategoryWithSubcategories[] = [
  {
    name: 'Technology',
    subcategories: [
      'AI & Machine Learning',
      'Cybersecurity',
      'Software Development',
      'Hardware & Gadgets',
      'Startups & Innovation',
      'Cloud & Infrastructure'
    ]
  },
  {
    name: 'News',
    subcategories: [
      'World News',
      'Local News',
      'Breaking News',
      'Investigative Journalism',
      'Human Interest',
      'Environment & Climate'
    ]
  },
  {
    name: 'Brazilian News',
    subcategories: [
      'National News',
      'Politics & Government',
      'Economy & Business',
      'Crime & Public Safety',
      'Culture & Entertainment',
      'Sports'
    ]
  },
  {
    name: 'Politics',
    subcategories: [
      'Domestic Policy',
      'International Relations',
      'Elections & Campaigns',
      'Legislation',
      'Geopolitics',
      'Political Analysis',
      'Foreign Affairs',
      'Brazilian Politics'
    ]
  },
  {
    name: 'Finance',
    subcategories: [
      'Stock Market',
      'Cryptocurrency',
      'Economics',
      'Personal Finance',
      'Corporate News',
      'Real Estate'
    ]
  },
  {
    name: 'Science',
    subcategories: [
      'Space & Astronomy',
      'Biology & Medicine',
      'Physics & Chemistry',
      'Research & Studies',
      'Climate Science',
      'Innovation & Discoveries'
    ]
  }
];

export const CONTENT_SOURCES: ContentSource[] = [
  // Technology - International
  {
    id: 'hacker-news',
    name: 'Hacker News',
    url: 'https://hnrss.org/frontpage',
    type: 'rss',
    category: 'Technology',
  },
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    url: 'https://techcrunch.com/feed/',
    type: 'rss',
    category: 'Technology',
  },
  {
    id: 'the-verge',
    name: 'The Verge',
    url: 'https://www.theverge.com/rss/index.xml',
    type: 'rss',
    category: 'Technology',
  },
  {
    id: 'ars-technica',
    name: 'Ars Technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    type: 'rss',
    category: 'Technology',
  },
  // Technology - Brazil
  {
    id: 'olhar-digital',
    name: 'Olhar Digital',
    url: 'https://olhardigital.com.br/feed/',
    type: 'rss',
    category: 'Technology',
  },
  {
    id: 'tecmundo',
    name: 'TecMundo',
    url: 'https://www.tecmundo.com.br/feed',
    type: 'rss',
    category: 'Technology',
  },
  {
    id: 'canaltech',
    name: 'Canaltech',
    url: 'https://canaltech.com.br/rss/',
    type: 'rss',
    category: 'Technology',
  },
  // News - International
  {
    id: 'bbc-news',
    name: 'BBC News',
    url: 'http://feeds.bbci.co.uk/news/rss.xml',
    type: 'rss',
    category: 'News',
  },
  {
    id: 'reuters',
    name: 'Reuters',
    url: 'https://www.reutersagency.com/feed/',
    type: 'rss',
    category: 'News',
  },
  {
    id: 'associated-press',
    name: 'Associated Press',
    url: 'https://rsshub.app/apnews/topics/apf-topnews',
    type: 'rss',
    category: 'News',
  },
  {
    id: 'al-jazeera',
    name: 'Al Jazeera',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    type: 'rss',
    category: 'News',
  },
  {
    id: 'guardian',
    name: 'The Guardian',
    url: 'https://www.theguardian.com/world/rss',
    type: 'rss',
    category: 'News',
  },
  {
    id: 'cnn',
    name: 'CNN',
    url: 'http://rss.cnn.com/rss/edition.rss',
    type: 'rss',
    category: 'News',
  },
  {
    id: 'nyt',
    name: 'New York Times',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    type: 'rss',
    category: 'News',
  },
  {
    id: 'economist',
    name: 'The Economist',
    url: 'https://www.economist.com/the-world-this-week/rss.xml',
    type: 'rss',
    category: 'News',
  },
  {
    id: 'france24',
    name: 'France 24',
    url: 'https://www.france24.com/en/rss',
    type: 'rss',
    category: 'News',
  },
  {
    id: 'dw',
    name: 'Deutsche Welle',
    url: 'https://rss.dw.com/xml/rss-en-all',
    type: 'rss',
    category: 'News',
  },
  {
    id: 'npr',
    name: 'NPR News',
    url: 'https://feeds.npr.org/1001/rss.xml',
    type: 'rss',
    category: 'News',
  },
  // Politics - International
  {
    id: 'politico',
    name: 'Politico',
    url: 'https://www.politico.com/rss/politics08.xml',
    type: 'rss',
    category: 'Politics',
  },
  {
    id: 'the-hill',
    name: 'The Hill',
    url: 'https://thehill.com/feed/',
    type: 'rss',
    category: 'Politics',
  },
  {
    id: 'foreign-policy',
    name: 'Foreign Policy',
    url: 'https://foreignpolicy.com/feed/',
    type: 'rss',
    category: 'Politics',
  },
  {
    id: 'foreign-affairs',
    name: 'Foreign Affairs',
    url: 'https://www.foreignaffairs.com/rss.xml',
    type: 'rss',
    category: 'Politics',
  },
  {
    id: 'atlantic-politics',
    name: 'The Atlantic - Politics',
    url: 'https://www.theatlantic.com/feed/channel/politics/',
    type: 'rss',
    category: 'Politics',
  },
  // Brazilian News
  {
    id: 'g1',
    name: 'G1',
    url: 'https://g1.globo.com/rss/g1/',
    type: 'rss',
    category: 'Brazilian News',
  },
  {
    id: 'uol-noticias',
    name: 'UOL Notícias',
    url: 'https://rss.uol.com.br/feed/noticias.xml',
    type: 'rss',
    category: 'Brazilian News',
  },
  {
    id: 'folha',
    name: 'Folha de S.Paulo',
    url: 'https://www1.folha.uol.com.br/rss/emcimadahora.xml',
    type: 'rss',
    category: 'Brazilian News',
  },
  {
    id: 'estadao',
    name: 'Estadão',
    url: 'https://www.estadao.com.br/rss/ultimasnoticias.xml',
    type: 'rss',
    category: 'Brazilian News',
  },
  {
    id: 'veja',
    name: 'Veja',
    url: 'https://veja.abril.com.br/feed/',
    type: 'rss',
    category: 'Brazilian News',
  },
  {
    id: 'exame',
    name: 'Exame',
    url: 'https://exame.com/feed/',
    type: 'rss',
    category: 'Brazilian News',
  },
  {
    id: 'oglobo',
    name: 'O Globo',
    url: 'https://oglobo.globo.com/rss.xml',
    type: 'rss',
    category: 'Brazilian News',
  },
  // Finance - International
  {
    id: 'yahoo-finance',
    name: 'Yahoo Finance',
    url: 'https://finance.yahoo.com/news/rssindex',
    type: 'rss',
    category: 'Finance',
  },
  {
    id: 'coindesk',
    name: 'CoinDesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    type: 'rss',
    category: 'Finance',
  },
  {
    id: 'bloomberg',
    name: 'Bloomberg',
    url: 'https://feeds.bloomberg.com/markets/news.rss',
    type: 'rss',
    category: 'Finance',
  },
  {
    id: 'financial-times',
    name: 'Financial Times',
    url: 'https://www.ft.com/?format=rss',
    type: 'rss',
    category: 'Finance',
  },
  {
    id: 'wsj',
    name: 'Wall Street Journal',
    url: 'https://feeds.a.dj.com/rss/RSSWorldNews.xml',
    type: 'rss',
    category: 'Finance',
  },
  {
    id: 'marketwatch',
    name: 'MarketWatch',
    url: 'http://feeds.marketwatch.com/marketwatch/topstories/',
    type: 'rss',
    category: 'Finance',
  },
  {
    id: 'seeking-alpha',
    name: 'Seeking Alpha',
    url: 'https://seekingalpha.com/feed.xml',
    type: 'rss',
    category: 'Finance',
  },
  {
    id: 'cointelegraph',
    name: 'Cointelegraph',
    url: 'https://cointelegraph.com/rss',
    type: 'rss',
    category: 'Finance',
  },
  // Finance - Brazil
  {
    id: 'infomoney',
    name: 'InfoMoney',
    url: 'https://www.infomoney.com.br/feed/',
    type: 'rss',
    category: 'Finance',
  },
  {
    id: 'valor',
    name: 'Valor Econômico',
    url: 'https://valor.globo.com/rss/',
    type: 'rss',
    category: 'Finance',
  },
  // Science
  {
    id: 'mit-tech-review',
    name: 'MIT Technology Review',
    url: 'https://www.technologyreview.com/feed/',
    type: 'rss',
    category: 'Science',
  },
  {
    id: 'science-daily',
    name: 'ScienceDaily',
    url: 'https://www.sciencedaily.com/rss/all.xml',
    type: 'rss',
    category: 'Science',
  },
  {
    id: 'nature',
    name: 'Nature',
    url: 'https://www.nature.com/nature.rss',
    type: 'rss',
    category: 'Science',
  },
  {
    id: 'science-mag',
    name: 'Science Magazine',
    url: 'https://www.science.org/rss/news_current.xml',
    type: 'rss',
    category: 'Science',
  },
  {
    id: 'phys-org',
    name: 'Phys.org',
    url: 'https://phys.org/rss-feed/',
    type: 'rss',
    category: 'Science',
  },
  {
    id: 'new-scientist',
    name: 'New Scientist',
    url: 'https://www.newscientist.com/feed/home',
    type: 'rss',
    category: 'Science',
  },
  {
    id: 'space',
    name: 'Space.com',
    url: 'https://www.space.com/feeds/all',
    type: 'rss',
    category: 'Science',
  },
  // Technology - More Sources
  {
    id: 'venturebeat-ai',
    name: 'VentureBeat AI',
    url: 'https://venturebeat.com/category/ai/feed/',
    type: 'rss',
    category: 'Technology',
  },
  {
    id: 'wired',
    name: 'Wired',
    url: 'https://www.wired.com/feed/rss',
    type: 'rss',
    category: 'Technology',
  },
  {
    id: 'engadget',
    name: 'Engadget',
    url: 'https://www.engadget.com/rss.xml',
    type: 'rss',
    category: 'Technology',
  },
  {
    id: 'zdnet',
    name: 'ZDNet',
    url: 'https://www.zdnet.com/news/rss.xml',
    type: 'rss',
    category: 'Technology',
  },
  {
    id: 'techradar',
    name: 'TechRadar',
    url: 'https://www.techradar.com/rss',
    type: 'rss',
    category: 'Technology',
  },
  {
    id: 'mit-news',
    name: 'MIT News',
    url: 'https://news.mit.edu/rss/feed',
    type: 'rss',
    category: 'Technology',
  },
  {
    id: 'github-blog',
    name: 'GitHub Blog',
    url: 'https://github.blog/feed/',
    type: 'rss',
    category: 'Technology',
  },
  // Politics - Brazil
  {
    id: 'poder30',
    name: 'Poder360',
    url: 'https://www.poder360.com.br/feed/',
    type: 'rss',
    category: 'Politics',
  },
  {
    id: 'estadao-politica',
    name: 'Estadão - Política',
    url: 'https://politica.estadao.com.br/rss.xml',
    type: 'rss',
    category: 'Politics',
  },
  {
    id: 'nexo',
    name: 'Nexo Jornal',
    url: 'https://www.nexojornal.com.br/rss.xml',
    type: 'rss',
    category: 'Brazilian News',
  },
  {
    id: 'brasil-de-fato',
    name: 'Brasil de Fato',
    url: 'https://www.brasildefato.com.br/rss.xml',
    type: 'rss',
    category: 'Brazilian News',
  },
  {
    id: 'carta-capital',
    name: 'CartaCapital',
    url: 'https://www.cartacapital.com.br/feed/',
    type: 'rss',
    category: 'Brazilian News',
  },
];
