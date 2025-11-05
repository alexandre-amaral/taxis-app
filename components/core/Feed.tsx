import React, { useState, useEffect } from 'react';
import { Article, UserPreferences } from '../../types';
import { fetchFeeds, analyzeArticleContent } from '../../services/geminiService';
import { ArticleCard, ArticleCardSkeleton } from './ArticleCard';
import ArticleDetailModal from './ArticleDetailModal';
import { CONTENT_SOURCES } from '../../constants';

interface FeedProps {
  userPreferences: UserPreferences;
}

const Feed: React.FC<FeedProps> = ({ userPreferences }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  
  useEffect(() => {
    const loadFeed = async () => {
      setIsLoading(true);
      const selectedSourceIds = new Set(userPreferences.sources);
      const sourcesToFetch = CONTENT_SOURCES.filter(s => selectedSourceIds.has(s.id));
      
      if (sourcesToFetch.length > 0) {
        const fetchedArticles = await fetchFeeds(sourcesToFetch);
        setArticles(fetchedArticles);
      } else {
        setArticles([]);
      }
      setIsLoading(false);
    };

    loadFeed();
  }, [userPreferences]);

  const handleAnalyze = async (articleId: string) => {
    setAnalyzingId(articleId);
    const articleToAnalyze = articles.find(a => a.id === articleId);

    if (articleToAnalyze) {
      try {
        const analysis = await analyzeArticleContent(articleToAnalyze, userPreferences);
        setArticles(prevArticles =>
          prevArticles.map(a =>
            a.id === articleId ? { ...a, aiAnalysis: analysis } : a
          )
        );
      } catch (error) {
        console.error("Failed to analyze article", error);
        // You could add an error state to the article here
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
    if (isLoading) {
      return (
          <div className="space-y-6">
              {[...Array(5)].map((_, i) => <ArticleCardSkeleton key={i} />)}
          </div>
      );
    }

    if (articles.length === 0) {
      return (
        <div className="text-center py-20">
            <h2 className="text-2xl font-semibold text-white">Your Feed is Empty</h2>
            <p className="text-gray-400 mt-2">
                You haven't selected any sources. Go to your preferences to add some!
            </p>
        </div>
      );
    }
    
    return articles.map(article => (
      <ArticleCard 
        key={article.id} 
        article={article}
        onAnalyze={handleAnalyze}
        onViewDetails={handleViewDetails}
      />
    ));
  }

  return (
    <div className="space-y-6">
      {renderContent()}
      {selectedArticle && (
        <ArticleDetailModal 
            article={selectedArticle}
            onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Feed;
