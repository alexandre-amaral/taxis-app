import React, { useState, useEffect } from 'react';
import { Article, UserPreferences } from '../../types';
import { fetchFeeds, analyzeArticleContent, generateTopicDashboardFromWeb, generatePresidentialBriefing, summarizeUrl } from '../../services/geminiService';
import { ArticleCard, ArticleCardSkeleton } from './ArticleCard';
import ArticleDetailModal from './ArticleDetailModal';
import UrlSummaryModal from './UrlSummaryModal';
import { CONTENT_SOURCES } from '../../constants';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface FeedProps {
  userPreferences: UserPreferences;
}

type ViewMode = 'feed' | 'summary' | 'topic';

const Feed: React.FC<FeedProps> = ({ userPreferences }) => {
  const FEED_CACHE_KEY = 'taxis_feed_cache';
  const SUMMARY_CACHE_KEY = 'taxis_daily_summary_cache';
  const FEED_CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes
  const SUMMARY_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  const [allArticles, setAllArticles] = useState<Article[]>([]); // All fetched articles
  const [displayedArticles, setDisplayedArticles] = useState<Article[]>([]); // Currently displayed
  const [articlesPerPage] = useState(15);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('feed');
  const [autoAnalyzing, setAutoAnalyzing] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'personal' | 'general'>('date');
  const [dailySummaryData, setDailySummaryData] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [topicDashboard, setTopicDashboard] = useState<string>('');
  const [topicData, setTopicData] = useState<any>(null);
  const [isLoadingTopic, setIsLoadingTopic] = useState(false);
  const [isFullyLoaded, setIsFullyLoaded] = useState(false);
  const [allFetchedArticles, setAllFetchedArticles] = useState<Article[]>([]); // All fetched (not analyzed yet)
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [urlSummary, setUrlSummary] = useState<any>(null);
  const [isLoadingUrlSummary, setIsLoadingUrlSummary] = useState(false);

  // Load feed from cache
  const loadFeedFromCache = () => {
    try {
      const cached = localStorage.getItem(FEED_CACHE_KEY);
      console.log('[Cache] Attempting to load feed cache...', cached ? 'Found' : 'Not found');

      if (cached) {
        const data = JSON.parse(cached);
        const now = Date.now();
        const age = now - data.timestamp;
        console.log('[Cache] Feed cache age:', Math.floor(age / 1000 / 60), 'minutes');

        // Check if cache is still valid
        if (data.timestamp && age < FEED_CACHE_EXPIRY) {
          console.log(`[Cache] Using cached feed with ${data.analyzed?.length} analyzed and ${data.all?.length} total articles`);
          setAllArticles(data.analyzed || []);
          setAllFetchedArticles(data.all || []); // The crucial fix
          setDisplayedArticles((data.analyzed || []).slice(0, articlesPerPage));
          setLastFetchTime(data.timestamp);
          setCurrentPage(1);
          setIsLoading(false);
          setIsInitialLoad(false);
          setIsFullyLoaded(true); // Cache is fully loaded
          return true;
        } else {
          console.log('[Cache] Feed cache expired');
        }
      }
    } catch (error) {
      console.error('[Cache] Error loading feed from cache:', error);
    }
    return false;
  };

  // Save feed to cache
  const saveFeedToCache = (analyzed: Article[], all: Article[], timestamp: number) => {
    try {
      const data = { analyzed, all, timestamp };
      localStorage.setItem(FEED_CACHE_KEY, JSON.stringify(data));
      console.log(`[Cache] Saved ${analyzed.length} analyzed and ${all.length} total articles to feed cache`);
    } catch (error) {
      console.error('[Cache] Error saving feed to cache:', error);
    }
  };

  // Load daily summary from cache
  const loadSummaryFromCache = () => {
    try {
      const cached = localStorage.getItem(SUMMARY_CACHE_KEY);
      console.log('[Cache] Attempting to load summary cache...', cached ? 'Found' : 'Not found');

      if (cached) {
        const data = JSON.parse(cached);
        const now = Date.now();
        const age = now - data.timestamp;
        console.log('[Cache] Summary cache age:', Math.floor(age / 1000 / 60 / 60), 'hours');

        // Check if cache is still valid (less than 24 hours)
        if (data.timestamp && age < SUMMARY_CACHE_EXPIRY) {
          console.log('[Cache] Using cached daily summary');
          setDailySummaryData(data.summary);
          return true;
        } else {
          console.log('[Cache] Summary cache expired');
        }
      }
    } catch (error) {
      console.error('[Cache] Error loading summary from cache:', error);
    }
    return false;
  };

  // Save daily summary to cache
  const saveSummaryToCache = (summary: any) => {
    try {
      const data = { summary, timestamp: Date.now() };
      localStorage.setItem(SUMMARY_CACHE_KEY, JSON.stringify(data));
      console.log('[Cache] Saved daily summary to cache');
    } catch (error) {
      console.error('[Cache] Error saving summary to cache:', error);
    }
  };

  const loadFeed = async (forceRefresh = false) => {
    console.log('[Feed] 🚀 Loading feed, forceRefresh:', forceRefresh);
    setIsLoading(true);
    setIsFullyLoaded(false);

    // Get sources from user's selected sources AND all sources from selected categories
    const selectedSourceIds = new Set(userPreferences.sources);

    // Get all categories that user selected (from categoryInterests or legacy interests)
    const selectedCategories = new Set<string>();
    if (userPreferences.categoryInterests) {
      Object.keys(userPreferences.categoryInterests).forEach(cat => selectedCategories.add(cat));
    } else if (userPreferences.interests) {
      // Legacy support
      Object.keys(userPreferences.interests).forEach(cat => selectedCategories.add(cat));
    }

    console.log('[Feed] 📂 Selected categories:', Array.from(selectedCategories).join(', '));

    // Filter sources: include if (1) explicitly selected OR (2) belongs to selected category
    const sourcesToFetch = CONTENT_SOURCES.filter(s =>
      selectedSourceIds.has(s.id) || selectedCategories.has(s.category)
    );

    console.log('[Feed] 📡 Loading from', sourcesToFetch.length, 'sources across all selected categories');

    if (sourcesToFetch.length > 0) {
      const fetchedArticles = await fetchFeeds(sourcesToFetch);
      const timestamp = Date.now();

      console.log('[Feed] 📰 Fetched', fetchedArticles.length, 'unique articles');

      // Weighted selection of articles to analyze
      const articlesByCategory: { [key: string]: Article[] } = {};
      fetchedArticles.forEach(article => {
          if (!articlesByCategory[article.category]) {
              articlesByCategory[article.category] = [];
          }
          articlesByCategory[article.category].push(article);
      });

      const userCategoryWeights = userPreferences.categoryInterests || userPreferences.interests;
      const weightedCategories: string[] = [];
      for (const category in userCategoryWeights) {
          const weight = (userCategoryWeights[category] as any).weight || userCategoryWeights[category]; // Handle both preference structures
          for (let i = 0; i < weight; i++) {
              weightedCategories.push(category);
          }
      }

      // Shuffle the weighted categories to get a random order
      weightedCategories.sort(() => Math.random() - 0.5);

      const articlesToShow: Article[] = [];
      const seenArticleIds = new Set<string>();
      let articlesAdded = 0;
      let attempts = 0;

      while (articlesAdded < 10 && attempts < weightedCategories.length * 2 && weightedCategories.length > 0) {
          // Pick a category based on weighted random order
          const category = weightedCategories[attempts % weightedCategories.length];
          
          if (articlesByCategory[category] && articlesByCategory[category].length > 0) {
              const article = articlesByCategory[category].shift(); // Take the most recent from that category
              if (article && !seenArticleIds.has(article.id)) {
                  articlesToShow.push(article);
                  seenArticleIds.add(article.id);
                  articlesAdded++;
              }
          }
          attempts++;
      }

      // If we still don't have 10, fill up with the most recent ones from any category
      if (articlesAdded < 10) {
          for (const article of fetchedArticles) {
              if (articlesAdded >= 10) break;
              if (!seenArticleIds.has(article.id)) {
                  articlesToShow.push(article);
                  seenArticleIds.add(article.id);
                  articlesAdded++;
              }
          }
      }

      console.log(`[Feed] 🤖 Analyzing ${articlesToShow.length} articles for feed...`);
      setAutoAnalyzing(true);

      const analyzedArticles: Article[] = [];
      let successCount = 0;

      for (let i = 0; i < articlesToShow.length; i++) {
        const article = articlesToShow[i];
        try {
          console.log(`[Feed] [${i + 1}/${articlesToShow.length}] Analyzing: ${article.title.substring(0, 60)}...`);
          const analysis = await analyzeArticleContent(article, userPreferences);
          analyzedArticles.push({ ...article, aiAnalysis: analysis });
          successCount++;
          console.log(`[Feed] ✅ [${i + 1}/${articlesToShow.length}] Success - Personal: ${analysis.personalRelevance}, General: ${analysis.generalRelevance}`);
        } catch (error) {
          console.error(`[Feed] ❌ [${i + 1}/${articlesToShow.length}] Failed:`, error);
          // Skip articles that fail - don't add them to feed
        }
      }

      console.log(`[Feed] 📊 Analysis complete: ${successCount} articles ready to display`);

      // Only show successfully analyzed articles
      if (analyzedArticles.length > 0) {
        setAllFetchedArticles(fetchedArticles); // Store all fetched for Load More
        setAllArticles(analyzedArticles);
        setDisplayedArticles(analyzedArticles.slice(0, articlesPerPage));
        setCurrentPage(1);
        setLastFetchTime(timestamp);
        setIsInitialLoad(false);
        setAutoAnalyzing(false);

        // Save to cache with analyzed articles
        saveFeedToCache(analyzedArticles, fetchedArticles, timestamp);
        console.log('[Feed] 💾 Feed saved to cache');
        console.log(`[Feed] ✨ Feed fully loaded - ${successCount} analyzed, ${fetchedArticles.length - articlesToShow.length} remaining`);
        setIsFullyLoaded(true);
      } else {
        console.error('[Feed] ⚠️ No articles were successfully analyzed');
        setAllArticles([]);
        setDisplayedArticles([]);
        setIsFullyLoaded(true);
      }
    } else {
      setAllArticles([]);
      setDisplayedArticles([]);
      setIsFullyLoaded(true);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    console.log('[Feed] Component mounted, checking cache...');
    // Try to load from cache first
    const loadedFromCache = loadFeedFromCache();

    // If no valid cache, load fresh data
    if (!loadedFromCache) {
      console.log('[Feed] No valid cache, loading fresh feed');
      loadFeed();
    }

    // Set up auto-refresh every 30 minutes
    const autoRefreshInterval = setInterval(() => {
      console.log('[Feed] Auto-refresh triggered (30 min interval)');
      loadFeed(true);
    }, 30 * 60 * 1000); // 30 minutes

    // Cleanup interval on unmount
    return () => clearInterval(autoRefreshInterval);
  }, []);

  // Update displayed articles when sort, category, or keyword changes
  useEffect(() => {
    if (allArticles.length > 0 && isFullyLoaded) {
      const filtered = getFilteredArticles();
      const sorted = sortArticles(filtered, sortBy);
      setDisplayedArticles(sorted.slice(0, articlesPerPage));
      setCurrentPage(1); // Reset to first page when filters change
    }
  }, [sortBy, selectedCategory, allArticles, isFullyLoaded]);

  // Load daily summary when switching to summary tab
  useEffect(() => {
    if (viewMode === 'summary') {
      console.log('[Summary] Switching to summary view...');
      console.log('[Summary] dailySummaryData:', dailySummaryData ? 'exists' : 'null');
      console.log('[Summary] allArticles count:', allArticles.length);
      console.log('[Summary] analyzedArticles count:', allArticles.filter(a => a.aiAnalysis).length);

      if (!dailySummaryData && !isLoadingSummary) {
        console.log('[Summary] No summary data, attempting to load from cache...');
        const hasCached = loadSummaryFromCache();
        if (!hasCached) {
          console.log('[Summary] No cached summary available');

          // Auto-load if we have analyzed articles
          const analyzedCount = allArticles.filter(a => a.aiAnalysis).length;
          if (analyzedCount >= 1) { // Generate if there is at least one article
            console.log('[Briefing] 🚀 Auto-generating briefing from', analyzedCount, 'analyzed articles');
            generateDailyBriefing();
          } else {
            console.log('[Briefing] Not enough analyzed articles for auto-generation:', analyzedCount);
          }
        }
      }
    }
  }, [viewMode, allArticles]);

  const sortArticles = (articles: Article[], sortType: 'date' | 'personal' | 'general') => {
    switch (sortType) {
      case 'personal':
        return articles.sort((a, b) => {
          const relA = a.aiAnalysis?.personalRelevance || 0;
          const relB = b.aiAnalysis?.personalRelevance || 0;
          return relB - relA;
        });
      case 'general':
        return articles.sort((a, b) => {
          const relA = a.aiAnalysis?.generalRelevance || 0;
          const relB = b.aiAnalysis?.generalRelevance || 0;
          return relB - relA;
        });
      case 'date':
      default:
        return articles.sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime());
    }
  };

  const loadMoreArticles = async () => {
    console.log('[Feed] 📥 Loading more articles...');
    setIsLoadingMore(true);

    // Get next batch of unanalyzed articles
    const currentAnalyzedCount = allArticles.length;
    const nextBatch = allFetchedArticles.slice(currentAnalyzedCount, currentAnalyzedCount + 10);

    if (nextBatch.length === 0) {
      console.log('[Feed] ⚠️ No more articles to load');
      setIsLoadingMore(false);
      return;
    }

    console.log(`[Feed] 🤖 Analyzing ${nextBatch.length} more articles...`);

    const newAnalyzed: Article[] = [];
    for (let i = 0; i < nextBatch.length; i++) {
      const article = nextBatch[i];
      try {
        console.log(`[Feed] [${i + 1}/${nextBatch.length}] Analyzing: ${article.title.substring(0, 60)}...`);
        const analysis = await analyzeArticleContent(article, userPreferences);
        newAnalyzed.push({ ...article, aiAnalysis: analysis });
        console.log(`[Feed] ✅ [${i + 1}/${nextBatch.length}] Success`);
      } catch (error) {
        console.error(`[Feed] ❌ [${i + 1}/${nextBatch.length}] Failed:`, error);
      }
    }

    if (newAnalyzed.length > 0) {
      const updatedArticles = [...allArticles, ...newAnalyzed];
      setAllArticles(updatedArticles);

      // Apply filters and sorting
      const filtered = selectedCategory === 'all'
        ? updatedArticles
        : updatedArticles.filter(a => a.category === selectedCategory);

      const sorted = sortArticles(filtered, sortBy);
      setDisplayedArticles(sorted);

      // Update cache
      if (lastFetchTime) {
        saveFeedToCache(updatedArticles, allFetchedArticles, lastFetchTime);
      }

      console.log(`[Feed] ✨ Added ${newAnalyzed.length} more articles. Total: ${updatedArticles.length}`);
    }

    setIsLoadingMore(false);
  };

  // Get filtered articles based on category and keyword
  const getFilteredArticles = () => {
    let filtered = [...allArticles];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }

    return filtered;
  };

  // Get unique categories from all articles
  const getCategories = () => {
    const categories = new Set<string>();
    allArticles.forEach(a => categories.add(a.category));
    return Array.from(categories).sort();
  };

  // Get unique keywords from user preferences
  const getKeywords = () => {
    return userPreferences.keywords || [];
  };

  const handleAnalyze = async (articleId: string) => {
    setAnalyzingId(articleId);
    const articleToAnalyze = displayedArticles.find(a => a.id === articleId);

    if (articleToAnalyze) {
      try {
        console.log('[Analysis] Manual analysis for:', articleToAnalyze.title.substring(0, 50));
        const analysis = await analyzeArticleContent(articleToAnalyze, userPreferences);

        setAllArticles(prevArticles => {
          const updated = prevArticles.map(a =>
            a.id === articleId ? { ...a, aiAnalysis: analysis } : a
          );
          // Save updated articles to cache
          if (lastFetchTime) {
            saveFeedToCache(updated, allFetchedArticles, lastFetchTime);
          }
          return updated;
        });

        setDisplayedArticles(prevArticles =>
          prevArticles.map(a =>
            a.id === articleId ? { ...a, aiAnalysis: analysis } : a
          )
        );
      } catch (error) {
        console.error("[Analysis] Failed to analyze article", error);
      } finally {
        setAnalyzingId(null);
      }
    }
  };

  const handleViewDetails = (article: Article) => {
      setSelectedArticle(article);
  };
  
  const handleCloseModal = () => {
      setSelectedArticle(null);
  };

  const renderContent = () => {
    // Show loading ONLY if not fully loaded
    if (isLoading || !isFullyLoaded) {
      return (
          <div className="space-y-6">
              {/* Enhanced Loader */}
              <div className="flex flex-col items-center justify-center py-12">
                {/* Animated Icon */}
                <div className="relative mb-6">
                  {/* Outer pulse ring */}
                  <div
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{
                      backgroundColor: 'rgba(0, 255, 255, 0.2)',
                      animationDuration: '2s'
                    }}
                  />
                  {/* Main circle */}
                  <div
                    className="relative flex items-center justify-center w-20 h-20 rounded-full"
                    style={{
                      backgroundColor: 'rgba(0, 255, 255, 0.1)',
                      border: '3px solid #00ffff',
                      boxShadow: '0 0 20px rgba(0, 255, 255, 0.4), inset 0 0 20px rgba(0, 255, 255, 0.1)'
                    }}
                  >
                    {/* Rotating inner element */}
                    <div className="animate-spin">
                      <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Loading Text */}
                <h3 className="text-2xl font-bold mb-2" style={{ color: '#00ffff' }}>
                  {autoAnalyzing ? '🤖 AI Analysis in Progress' : '📡 Loading Your Feed'}
                </h3>
                <p className="text-gray-400 mb-4 text-center max-w-md">
                  {autoAnalyzing
                    ? 'Our AI is analyzing articles to provide personalized insights and fact-checking...'
                    : 'Fetching the latest news from your selected sources (last 48 hours)...'}
                </p>

                {/* Loading bar animation */}
                <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden" style={{ border: '1px solid rgba(0, 255, 255, 0.2)' }}>
                  <div
                    className="h-full rounded-full animate-pulse"
                    style={{
                      background: 'linear-gradient(90deg, rgba(0, 255, 255, 0.3) 0%, rgba(0, 255, 255, 0.8) 50%, rgba(0, 255, 255, 0.3) 100%)',
                      animation: 'slide 2s ease-in-out infinite',
                      boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
                    }}
                  />
                </div>
              </div>

              {/* Skeleton Cards */}
              {[...Array(5)].map((_, i) => <ArticleCardSkeleton key={i} />)}
          </div>
      );
    }

    if (displayedArticles.length === 0) {
      const filteredArticles = getFilteredArticles();
      if (filteredArticles.length === 0 && (selectedCategory !== 'all')) {
        return (
          <div className="text-center py-20">
              <h2 className="text-2xl font-semibold text-white">No Articles Found</h2>
              <p className="text-gray-400 mt-2">
                  No articles match your current filters.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                }}
                className="mt-4 px-4 py-2 rounded-lg"
                style={{
                  backgroundColor: 'rgba(0, 255, 255, 0.1)',
                  color: '#00ffff',
                  border: '1px solid rgba(0, 255, 255, 0.3)'
                }}
              >
                Clear Filters
              </button>
          </div>
        );
      }
      return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-semibold text-white">Your Feed is Empty</h2>
            <p className="text-gray-400 mt-2">
                You haven't selected any sources. Go to your preferences to add some!
            </p>
        </div>
      );
    }

    const filteredTotal = getFilteredArticles().length;

    return (
      <>
        {displayedArticles.map(article => (
          <ArticleCard
            key={article.id}
            article={article}
            onAnalyze={handleAnalyze}
            onViewDetails={handleViewDetails}
            isAnalyzing={analyzingId === article.id}
          />
        ))}
        {allArticles.length < allFetchedArticles.length ? (
          <div className="flex justify-center pt-6">
            <button
              onClick={loadMoreArticles}
              disabled={isLoadingMore}
              className="group relative px-8 py-4 rounded-lg font-semibold transition-all disabled:cursor-not-allowed overflow-hidden"
              style={{
                backgroundColor: isLoadingMore ? 'rgba(0, 255, 255, 0.05)' : 'rgba(0, 255, 255, 0.1)',
                color: isLoadingMore ? '#00ffff' : '#00ffff',
                border: '2px solid rgba(0, 255, 255, 0.3)',
                boxShadow: isLoadingMore ? '0 0 20px rgba(0, 255, 255, 0.2)' : '0 0 15px rgba(0, 255, 255, 0.15)'
              }}
            >
              {isLoadingMore ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>Analyzing articles with AI...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m0 0l-4-4m4 4l4-4" />
                  </svg>
                  <span>Load More ({allFetchedArticles.length - allArticles.length} remaining)</span>
                </div>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 pt-6">
            <div className="text-center">
              <p className="text-gray-500 text-sm mb-2">No more articles to load</p>
              <p className="text-gray-600 text-xs">All recent articles from your sources have been analyzed</p>
            </div>
            <button
              onClick={() => loadFeed(true)}
              disabled={isLoading}
              className="group relative px-8 py-4 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'rgba(0, 255, 255, 0.1)',
                color: '#00ffff',
                border: '2px solid rgba(0, 255, 255, 0.3)',
                boxShadow: '0 0 15px rgba(0, 255, 255, 0.15)'
              }}
            >
              {isLoading ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>Refreshing Feed...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh for New Articles</span>
                </div>
              )}
            </button>
          </div>
        )}
      </>
    );
  }

  const generateDailyBriefing = async () => {
    console.log('[Briefing] 🚀 Starting Presidential Daily Briefing generation...');
    const startTime = Date.now();
    setIsLoadingSummary(true);

    try {
        console.log(`[Briefing] 📡 Fetching news from RSS for briefing...`);
        // Get sources from user's selected sources AND all sources from selected categories
        const selectedSourceIds = new Set(userPreferences.sources);

        // Get all categories that user selected (from categoryInterests or legacy interests)
        const selectedCategories = new Set<string>();
        if (userPreferences.categoryInterests) {
          Object.keys(userPreferences.categoryInterests).forEach(cat => selectedCategories.add(cat));
        } else if (userPreferences.interests) {
          // Legacy support
          Object.keys(userPreferences.interests).forEach(cat => selectedCategories.add(cat));
        }

        // Filter sources: include if (1) explicitly selected OR (2) belongs to selected category
        const sourcesToFetch = CONTENT_SOURCES.filter(s =>
          selectedSourceIds.has(s.id) || selectedCategories.has(s.category)
        );
        const allFetchedArticles = await fetchFeeds(sourcesToFetch);
        console.log(`[Briefing] 📰 Fetched ${allFetchedArticles.length} unique articles`);

        // Sort by category priority and keywords
        const prioritizedArticles = allFetchedArticles.sort((a, b) => {
          const weightA = (userPreferences.categoryInterests || userPreferences.interests)[a.category] || 0;
          const weightB = (userPreferences.categoryInterests || userPreferences.interests)[b.category] || 0;
          const keywordMatchA = userPreferences.keywords.some(kw => a.title.toLowerCase().includes(kw.toLowerCase())) ? 5 : 0;
          const keywordMatchB = userPreferences.keywords.some(kw => b.title.toLowerCase().includes(kw.toLowerCase())) ? 5 : 0;
          return (weightB + keywordMatchB) - (weightA + keywordMatchA);
        });

        // Take top 20 most relevant articles for the briefing
        const articlesForBriefing = prioritizedArticles.slice(0, 20);
        console.log(`[Briefing] 🎯 Using top ${articlesForBriefing.length} articles for briefing generation.`);

        // Generate the single executive briefing
        const briefingData = await generatePresidentialBriefing(articlesForBriefing, userPreferences);

        const finalSummaryData = {
          ...briefingData,
          generatedAt: Date.now(),
        };

        setDailySummaryData(finalSummaryData);
        saveSummaryToCache(finalSummaryData);

        const elapsedTime = Math.round((Date.now() - startTime) / 1000);
        console.log(`[Briefing] ✨ Presidential Briefing complete in ${elapsedTime}s`);

    } catch (error) {
      console.error('[Briefing] 💥 Fatal error generating briefing:', error);
      // Optionally set an error state to show in the UI
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleSearch = async (term: string) => {
    const isUrl = term.match(/^(https?|ftp|file):\/\/.+$/);

    if (isUrl) {
      setIsLoadingUrlSummary(true);
      try {
        const summary = await summarizeUrl(term);
        setUrlSummary(summary);
      } catch (error) {
        console.error("Error summarizing URL:", error);
      } finally {
        setIsLoadingUrlSummary(false);
      }
    } else {
      // Handle topic search
      const topic = term;
      console.log(`[Topic] 🔍 Generating dashboard for topic: "${topic}" using web search`);

      // Clear previous data immediately
      setTopicData(null);
      setIsLoadingTopic(true);
      setViewMode('topic');
      setTopicDashboard(topic);

      try {
        // Use web search to generate comprehensive dashboard
        console.log('[Topic] 📡 Calling Gemini with Google Search...');
        const dashboardData = await generateTopicDashboardFromWeb(topic);

        console.log(`[Topic] ✅ Web dashboard generated successfully`);
        console.log('[Topic] Dashboard data:', {
          topic: dashboardData.topic,
          hasExecutiveSummary: !!dashboardData.executiveSummary,
          keyPointsCount: dashboardData.keyPoints?.length || 0,
          developmentsCount: dashboardData.recentDevelopments?.length || 0,
          perspectivesCount: dashboardData.perspectives?.length || 0,
          relevanceScore: dashboardData.relevanceScore
        });

        setTopicData(dashboardData);

        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Topic Dashboard Ready: ${topic} 🔍`, {
            body: `Dashboard generated from web search with latest information.`,
            icon: '/vite.svg'
          });
        }
      } catch (error) {
        console.error('[Topic] Error generating dashboard:', error);
        setTopicData({
          topic,
          executiveSummary: `Failed to generate dashboard for "${topic}". Please try again.`,
          keyPoints: [],
          recentDevelopments: [],
          perspectives: [],
          relevanceScore: 0,
          generatedAt: new Date().toISOString(),
          error: true
        });
      } finally {
        setIsLoadingTopic(false);
      }
    }
  };

  const analyzedArticles = allArticles.filter(a => a.aiAnalysis);

  const renderDailySummary = () => {
    // Show loading state while generating summary
    if (isLoadingSummary) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          {/* Animated Icon */}
          <div className="relative mb-6">
            {/* Outer pulse ring */}
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                backgroundColor: 'rgba(0, 255, 255, 0.2)',
                animationDuration: '2s'
              }}
            />
            {/* Main circle */}
            <div
              className="relative flex items-center justify-center w-24 h-24 rounded-full"
              style={{
                backgroundColor: 'rgba(0, 255, 255, 0.1)',
                border: '3px solid #00ffff',
                boxShadow: '0 0 30px rgba(0, 255, 255, 0.5), inset 0 0 30px rgba(0, 255, 255, 0.1)'
              }}
            >
              {/* Rotating inner element */}
              <div className="animate-spin">
                <svg className="w-12 h-12 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Loading Text */}
          <h2 className="text-3xl font-bold mb-3" style={{ color: '#00ffff' }}>
            📊 Generating Daily Briefing
          </h2>
          <p className="text-gray-400 text-center max-w-lg mb-6">
            Our AI is synthesizing intelligence from multiple sources into a comprehensive presidential-style report...
          </p>

          {/* Loading bar animation */}
          <div className="w-80 h-2 bg-gray-800 rounded-full overflow-hidden" style={{ border: '1px solid rgba(0, 255, 255, 0.2)' }}>
            <div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, rgba(0, 255, 255, 0.3) 0%, rgba(0, 255, 255, 0.8) 50%, rgba(0, 255, 255, 0.3) 100%)',
                animation: 'slide 2s ease-in-out infinite',
                boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
              }}
            />
          </div>

          {/* Process steps */}
          <div className="mt-8 space-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span>Fetching latest articles from RSS feeds...</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <span>Prioritizing by your preferences...</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <span>Generating executive summary...</span>
            </div>
          </div>
        </div>
      );
    }

    // If no summary data, show generate button
    if (!dailySummaryData || !dailySummaryData.executiveSummary) {
      return (
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold text-white">Daily Briefing</h2>
          <p className="text-gray-400 mt-2 mb-4">
            Generate a presidential-style daily briefing based on your preferences.
          </p>
          <button
            onClick={generateDailyBriefing}
            disabled={isLoadingSummary}
            className="px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 hover:scale-105"
            style={{
              backgroundColor: 'rgba(0, 255, 255, 0.15)',
              color: '#00ffff',
              border: '2px solid rgba(0, 255, 255, 0.4)',
              boxShadow: '0 0 20px rgba(0, 255, 255, 0.2)'
            }}
          >
            📊 Generate Daily Briefing
          </button>
        </div>
      );
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Render the presidential briefing
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="border-b border-cyan-500/20 pb-4">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-3xl font-bold font-display" style={{ color: '#00ffff' }}>{dailySummaryData.title}</h2>
                <span className="text-sm text-gray-400">{today}</span>
            </div>
            <p className="text-gray-400 text-sm">Presidential Daily Briefing</p>
        </div>

        {/* Executive Summary */}
        <div className="bg-gray-800/50 rounded-lg p-6 border border-cyan-500/20">
            <h3 className="text-xl font-bold mb-4 text-cyan-300">Executive Summary</h3>
            <div className="prose prose-invert max-w-none text-gray-300">
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>{dailySummaryData.executiveSummary}</ReactMarkdown>
            </div>
        </div>

        {/* Key Developments */}
        <div className="bg-gray-800/50 rounded-lg p-6 border border-green-500/20">
            <h3 className="text-xl font-bold mb-4 text-green-300">Key Developments</h3>
            <div className="space-y-4">
                {dailySummaryData.keyDevelopments.map((dev: any, idx: number) => (
                    <div key={idx} className="bg-gray-900/50 p-4 rounded-lg border border-green-500/10">
                        <p className="text-gray-300 mb-2">{dev.summary}</p>
                        <a href={dev.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline">
                            Source: {dev.sourceTitle}
                        </a>
                    </div>
                ))}
            </div>
        </div>

        {/* Perspectives */}
        <div className="bg-gray-800/50 rounded-lg p-6 border border-indigo-500/20">
            <h3 className="text-xl font-bold mb-4 text-indigo-300">Perspectives</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dailySummaryData.perspectives.map((p: any, idx: number) => (
                    <div key={idx} className="bg-gray-900/50 p-4 rounded-lg border border-indigo-500/10">
                        <h4 className="font-semibold text-indigo-300 mb-2">{p.viewpoint}</h4>
                        <p className="text-sm text-gray-400">{p.summary}</p>
                    </div>
                ))}
            </div>
        </div>
      </div>
    );
  };

  const renderTopicDashboard = () => {
    if (isLoadingTopic) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          {/* Animated Icon */}
          <div className="relative mb-6">
            {/* Outer pulse ring */}
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                backgroundColor: 'rgba(168, 85, 247, 0.2)',
                animationDuration: '2s'
              }}
            />
            {/* Main circle */}
            <div
              className="relative flex items-center justify-center w-24 h-24 rounded-full"
              style={{
                backgroundColor: 'rgba(168, 85, 247, 0.1)',
                border: '3px solid #a855f7',
                boxShadow: '0 0 30px rgba(168, 85, 247, 0.5), inset 0 0 30px rgba(168, 85, 247, 0.1)'
              }}
            >
              {/* Rotating inner element */}
              <div className="animate-spin">
                <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Loading Text */}
          <h2 className="text-3xl font-bold mb-3" style={{ color: '#a855f7' }}>
            🔍 Generating Topic Dashboard
          </h2>
          <p className="text-gray-400 text-center max-w-lg mb-2">
            Searching the web for the latest information about
          </p>
          <p className="text-2xl font-bold text-white mb-6">"{topicDashboard}"</p>

          {/* Loading bar animation */}
          <div className="w-80 h-2 bg-gray-800 rounded-full overflow-hidden" style={{ border: '1px solid rgba(168, 85, 247, 0.2)' }}>
            <div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, rgba(168, 85, 247, 0.3) 0%, rgba(168, 85, 247, 0.8) 50%, rgba(168, 85, 247, 0.3) 100%)',
                animation: 'slide 2s ease-in-out infinite',
                boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)'
              }}
            />
          </div>

          {/* Process steps */}
          <div className="mt-8 space-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
              <span>Searching web for latest developments...</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <span>Analyzing recent news articles...</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <span>Compiling multiple perspectives...</span>
            </div>
          </div>
        </div>
      );
    }

    if (!topicData || topicData.error) {
      return (
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold text-white">Dashboard Generation Failed</h2>
          <p className="text-gray-400 mt-2">
            {topicData?.executiveSummary || `Unable to generate dashboard for "${topicDashboard}". Try a different topic.`}
          </p>
          <button
            onClick={() => {
              setViewMode('feed');
              setTopicData(null);
              setTopicDashboard('');
            }}
            className="mt-4 px-4 py-2 rounded-lg"
            style={{
              backgroundColor: 'rgba(0, 255, 255, 0.1)',
              color: '#00ffff',
              border: '1px solid rgba(0, 255, 255, 0.3)'
            }}
          >
            ← Back to Feed
          </button>
        </div>
      );
    }

    const { executiveSummary, keyPoints, recentDevelopments, perspectives, relevanceScore } = topicData;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-800/50 to-cyan-800/50 rounded-lg p-6 border border-purple-500/30">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-3xl font-bold font-display text-purple-300">🔍 Topic Dashboard</h2>
            <button
              onClick={() => {
                setViewMode('feed');
                setTopicData(null);
                setTopicDashboard('');
                setSearchKeyword('');
              }}
              className="text-sm px-3 py-1.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 transition-all"
            >
              ← Back to Feed
            </button>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-white">"{topicDashboard}"</span>
            <span className="text-sm text-gray-400">Generated {new Date(topicData.generatedAt).toLocaleTimeString()}</span>
          </div>
          <p className="text-gray-300 text-sm mt-2">Based on latest web search results</p>
        </div>

        {/* Relevance Score */}
        <div className="bg-gray-800/50 rounded-lg p-6 border border-cyan-500/20">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-20 h-20 rounded-full"
              style={{
                backgroundColor: 'rgba(0, 255, 255, 0.2)',
                border: '3px solid #00ffff',
                boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)'
              }}
            >
              <span className="text-3xl font-bold text-cyan-400">{relevanceScore}</span>
            </div>
            <div>
              <div className="text-sm text-gray-400">Global Relevance Score</div>
              <div className="text-lg font-semibold text-white">Current importance of this topic</div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-800/40 rounded-lg p-6 border border-purple-500/30">
          <h3 className="text-xl font-bold mb-4 text-purple-300">📋 Executive Summary</h3>
          <p className="text-gray-300 leading-relaxed whitespace-pre-line">{executiveSummary}</p>
        </div>

        {/* Key Points */}
        {keyPoints && keyPoints.length > 0 && (
          <div className="bg-gray-800/50 rounded-lg p-6 border border-cyan-500/20">
            <h3 className="text-xl font-bold mb-4 text-cyan-300">🎯 Key Points</h3>
            <ul className="space-y-3">
              {keyPoints.map((point: string, idx: number) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-cyan-400 text-xl mt-0.5">•</span>
                  <span className="text-gray-300 flex-1">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recent Developments */}
        {recentDevelopments && recentDevelopments.length > 0 && (
          <div className="bg-gray-800/50 rounded-lg p-6 border border-green-500/20">
            <h3 className="text-xl font-bold mb-4 text-green-300">📰 Recent Developments</h3>
            <div className="space-y-4">
              {recentDevelopments.map((dev: any, idx: number) => {
                // Support both old format (source) and new format (sourceUrl + sourceName)
                const sourceUrl = dev.sourceUrl || dev.source;
                const sourceName = dev.sourceName || (dev.source && !dev.source.startsWith('http') ? dev.source : null);
                const isValidUrl = sourceUrl && (sourceUrl.startsWith('http://') || sourceUrl.startsWith('https://'));

                return (
                  <div key={idx} className="bg-gray-900/50 p-4 rounded-lg border border-green-500/10">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-semibold text-white flex-1">{dev.title}</h4>
                      {dev.date && (
                        <span className="text-xs text-gray-500 whitespace-nowrap">{dev.date}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{dev.description}</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-400">Source:</span>
                      {isValidUrl ? (
                        <a
                          href={sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 underline transition-colors flex items-center gap-1"
                          title={`Open article on ${sourceName || new URL(sourceUrl).hostname}`}
                        >
                          {sourceName || new URL(sourceUrl).hostname}
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-green-400">{sourceName || sourceUrl || 'Unknown source'}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Perspectives */}
        {perspectives && perspectives.length > 0 && (
          <div className="bg-gray-800/50 rounded-lg p-6 border border-indigo-500/20">
            <h3 className="text-xl font-bold mb-4 text-indigo-300">💭 Multiple Perspectives</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {perspectives.map((perspective: any, idx: number) => (
                <div key={idx} className="bg-gray-900/50 p-4 rounded-lg border border-indigo-500/10">
                  <h4 className="font-semibold text-indigo-300 mb-2">{perspective.viewpoint}</h4>
                  <p className="text-sm text-gray-400">{p.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getTimeSinceLastFetch = () => {
    if (!lastFetchTime) return '';
    const minutes = Math.floor((Date.now() - lastFetchTime) / 60000);
    if (minutes === 0) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    return `${hours} hours ago`;
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-0">
        <div className="flex gap-4">
          <button
            onClick={() => setViewMode('feed')}
            className={`pb-3 px-2 font-semibold transition-all ${viewMode === 'feed' ? 'border-b-2' : ''}`}
            style={{
              color: viewMode === 'feed' ? '#00ffff' : '#9ca3af',
              borderColor: viewMode === 'feed' ? '#00ffff' : 'transparent'
            }}
          >
            Feed
          </button>
          <button
            onClick={() => setViewMode('summary')}
            className={`pb-3 px-2 font-semibold transition-all ${viewMode === 'summary' ? 'border-b-2' : ''}`}
            style={{
              color: viewMode === 'summary' ? '#00ffff' : '#9ca3af',
              borderColor: viewMode === 'summary' ? '#00ffff' : 'transparent'
            }}
          >
            Daily Summary
          </button>
        </div>
        <div className="flex items-center gap-3 pb-3">
          {viewMode === 'feed' && (
            <>
              {lastFetchTime && (
                <span className="text-xs text-gray-500">Updated {getTimeSinceLastFetch()}</span>
              )}
              <button
                onClick={() => loadFeed(true)}
                disabled={isLoading}
                className="text-xs font-semibold px-3 py-2 rounded-lg transition-all disabled:opacity-50"
                style={{
                  backgroundColor: 'rgba(0, 255, 255, 0.1)',
                  color: '#00ffff',
                  border: '1px solid rgba(0, 255, 255, 0.25)'
                }}
              >
                {isLoading ? 'Refreshing...' : '↻ Refresh'}
              </button>
            </>
          )}
          {viewMode === 'summary' && (
            <>
              {dailySummaryData?.generatedAt && (
                <span className="text-xs text-gray-500">
                  Generated {new Date(dailySummaryData.generatedAt).toLocaleTimeString()}
                </span>
              )}
              <button
                onClick={() => {
                  localStorage.removeItem(SUMMARY_CACHE_KEY);
                  setDailySummaryData(null);
                  generateDailyBriefing();
                }}
                disabled={isLoadingSummary}
                className="text-xs font-semibold px-3 py-2 rounded-lg transition-all disabled:opacity-50"
                style={{
                  backgroundColor: 'rgba(0, 255, 255, 0.1)',
                  color: '#00ffff',
                  border: '1px solid rgba(0, 255, 255, 0.25)'
                }}
              >
                {isLoadingSummary ? 'Generating...' : '↻ Regenerate Summary'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {viewMode === 'feed' && isFullyLoaded && (
        <div className="mb-6 space-y-4">
          {/* Info Badge - Last 48h */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/30">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-green-400">Showing only news from the last 48 hours</span>
            <span className="text-xs text-gray-500 ml-auto">Auto-refreshes every 30 minutes</span>
          </div>

          {/* Search Bar with Topic Dashboard button */}
          <div className="relative flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchKeyword.trim()) {
                    handleSearch(searchKeyword);
                  }
                }}
                placeholder="Enter a topic to generate a dashboard (e.g., 'AI', 'climate', 'bitcoin')..."
                className="w-full px-4 py-3 pl-10 pr-10 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none transition-colors"
                style={{
                  boxShadow: searchKeyword ? '0 0 10px rgba(0, 255, 255, 0.1)' : 'none'
                }}
              />
              <svg
                className="absolute left-3 top-3.5 w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-3 top-3 text-gray-500 hover:text-cyan-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <button
              onClick={() => {
                if (searchKeyword.trim()) {
                  handleSearch(searchKeyword);
                }
              }}
              disabled={!searchKeyword.trim() || isLoadingTopic}
              className="px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 whitespace-nowrap"
              style={{
                backgroundColor: searchKeyword.trim() ? 'rgba(0, 255, 255, 0.2)' : 'rgba(100, 100, 100, 0.2)',
                color: searchKeyword.trim() ? '#00ffff' : '#666',
                border: searchKeyword.trim() ? '2px solid #00ffff' : '1px solid #444',
                boxShadow: searchKeyword.trim() ? '0 0 15px rgba(0, 255, 255, 0.3)' : 'none'
              }}
            >
              {isLoadingTopic ? '⏳ Generating...' : '📊 Generate Dashboard'}
            </button>
          </div>

          {/* Categories Chips + Sort */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-400 font-semibold">Categories:</span>
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === 'all' ? 'scale-105' : ''
              }`}
              style={{
                backgroundColor: selectedCategory === 'all' ? 'rgba(0, 255, 255, 0.2)' : 'rgba(100, 100, 100, 0.15)',
                color: selectedCategory === 'all' ? '#00ffff' : '#9ca3af',
                border: selectedCategory === 'all' ? '2px solid #00ffff' : '1px solid rgba(100, 100, 100, 0.3)',
                boxShadow: selectedCategory === 'all' ? '0 0 10px rgba(0, 255, 255, 0.2)' : 'none'
              }}
            >
              All
            </button>
            {getCategories().map(cat => {
              const categoryColors: Record<string, { bg: string, color: string, border: string }> = {
                'Technology': { bg: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', border: '#8b5cf6' },
                'News': { bg: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '#3b82f6' },
                'Brazilian News': { bg: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', border: '#22c55e' },
                'Politics': { bg: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '#ef4444' },
                'Finance': { bg: 'rgba(234, 179, 8, 0.2)', color: '#fbbf24', border: '#eab308' },
                'Science': { bg: 'rgba(0, 255, 255, 0.2)', color: '#00ffff', border: '#00ffff' },
              };
              const colors = categoryColors[cat] || { bg: 'rgba(100, 100, 100, 0.2)', color: '#9ca3af', border: '#666' };
              const isSelected = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 ${
                    isSelected ? 'scale-105' : ''
                  }`}
                  style={{
                    backgroundColor: colors.bg,
                    color: colors.color,
                    border: isSelected ? `2px solid ${colors.border}` : `1px solid ${colors.border}50`,
                    boxShadow: isSelected ? `0 0 10px ${colors.bg}` : 'none'
                  }}
                >
                  {cat}
                </button>
              );
            })}

            {/* Sort Dropdown */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-gray-400">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'personal' | 'general')}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-600 text-gray-300 font-semibold"
                style={{ outline: 'none' }}
              >
                <option value="date">Latest</option>
                <option value="personal">Personal Relevance</option>
                <option value="general">General Relevance</option>
              </select>
            </div>
          </div>

          {/* Active Filters Status */}
          {(selectedCategory !== 'all') && (
            <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Showing</span>
                <span className="font-bold text-cyan-400">{getFilteredArticles().length}</span>
                <span className="text-gray-400">of</span>
                <span className="font-bold text-white">{allArticles.length}</span>
                <span className="text-gray-400">articles</span>
              </div>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                }}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
        {viewMode === 'feed' && renderContent()}
        {viewMode === 'summary' && renderDailySummary()}
        {viewMode === 'topic' && renderTopicDashboard()}
      </div>

      {selectedArticle && (
        <ArticleDetailModal
            article={selectedArticle}
            onClose={handleCloseModal}
        />
      )}

      {urlSummary && (
        <UrlSummaryModal summaryData={urlSummary} onClose={() => setUrlSummary(null)} isLoading={isLoadingUrlSummary} />
      )}
    </div>
  );
};

export default Feed;
