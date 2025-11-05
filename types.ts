export interface ContentSource {
  id: string;
  name: string;
  url: string;
  type: 'rss';
  category: string;
  subcategory?: string;
}

export interface SubcategoryInterest {
  weight: number; // 1-5
}

export interface CategoryInterest {
  weight: number; // 1-5
  subcategories: { [subcategory: string]: SubcategoryInterest };
}

export interface UserPreferences {
  interests: { [category: string]: number }; // category -> weight (1-5) - DEPRECATED, kept for backwards compatibility
  categoryInterests: { [category: string]: CategoryInterest }; // new hierarchical structure
  sources: string[]; // array of ContentSource ids
  keywords: string[];
}

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  preferences: UserPreferences | null;
}

export interface Article {
  id: string;
  title: string;
  link: string;
  source: string;
  category: string;
  contentSnippet: string;
  isoDate: string;
  aiAnalysis?: AIAnalysis;
}

export interface AIAnalysis {
  summary: string;
  generalRelevance: number;
  personalRelevance: number;
  factCheck: {
    summary: string;
    findings: { claim: string; verdict: string; source: string }[];
  };
  perspectives: { viewpoint: string; summary: string }[];
}

export enum AuthState {
  LOADING,
  SIGNED_OUT,
  ONBOARDING,
  SIGNED_IN,
}