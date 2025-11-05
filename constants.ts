
import { ContentSource } from './types';

export const CATEGORIES = [
  'Technology',
  'News',
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
  // News - Brazil
  {
    id: 'g1',
    name: 'G1',
    url: 'https://g1.globo.com/rss/g1/',
    type: 'rss',
    category: 'News',
  },
  {
    id: 'uol-noticias',
    name: 'UOL Notícias',
    url: 'https://rss.uol.com.br/feed/noticias.xml',
    type: 'rss',
    category: 'News',
  },
  {
    id: 'folha',
    name: 'Folha de S.Paulo',
    url: 'https://www1.folha.uol.com.br/rss/emcimadahora.xml',
    type: 'rss',
    category: 'News',
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
  // Finance - Brazil
  {
    id: 'infomoney',
    name: 'InfoMoney',
    url: 'https://www.infomoney.com.br/feed/',
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
  // AI & Machine Learning
  {
    id: 'venturebeat-ai',
    name: 'VentureBeat AI',
    url: 'https://venturebeat.com/category/ai/feed/',
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
];
