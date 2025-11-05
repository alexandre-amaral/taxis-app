
import React from 'react';
import { Article } from '../../types';

interface ArticleCardProps {
  article: Article;
  onAnalyze: (articleId: string) => void;
  onViewDetails: (article: Article) => void;
  isAnalyzing?: boolean;
}

const RelevanceBadge = ({ label, score }: { label: string; score: number }) => {
    const getColor = (score: number) => {
        if (score >= 8) return { bg: 'rgba(0, 255, 136, 0.2)', border: '#00ff88', text: '#00ff88' };
        if (score >= 6) return { bg: 'rgba(0, 255, 255, 0.2)', border: '#00ffff', text: '#00ffff' };
        if (score >= 4) return { bg: 'rgba(255, 170, 0, 0.2)', border: '#ffaa00', text: '#ffaa00' };
        return { bg: 'rgba(150, 150, 150, 0.2)', border: '#999', text: '#999' };
    };

    const colors = getColor(score);

    return (
        <div className="flex flex-col items-center">
            <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg mb-1"
                style={{
                    backgroundColor: colors.bg,
                    border: `2px solid ${colors.border}`,
                    color: colors.text,
                    boxShadow: `0 0 8px ${colors.bg}`
                }}
            >
                {score}
            </div>
            <span className="text-[10px] text-gray-400 font-semibold">{label}</span>
        </div>
    );
};


const ArticleCard: React.FC<ArticleCardProps> = ({ article, onAnalyze, onViewDetails, isAnalyzing = false }) => {
    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        return Math.floor(seconds) + " seconds ago";
    };

    return (
        <div
          className="bg-gray-800 rounded-lg p-3 sm:p-4 md:p-5 transition-all duration-300 hover:transform hover:scale-[1.01]"
          style={{
            border: '1px solid rgba(0, 255, 255, 0.15)',
            boxShadow: '0 0 10px rgba(0, 255, 255, 0.03)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.border = '1px solid rgba(0, 255, 255, 0.35)';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.border = '1px solid rgba(0, 255, 255, 0.15)';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.03)';
          }}
        >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div className="flex-1">
                    <span className="text-[10px] sm:text-xs font-bold uppercase" style={{ color: '#00ffff' }}>{article.category}</span>
                    <a href={article.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mt-1 line-clamp-2">{article.title}</h3>
                    </a>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-400 whitespace-nowrap shrink-0">{timeAgo(article.isoDate)}</div>
            </div>

            <p className="text-xs sm:text-sm text-gray-400 mt-2 mb-3 sm:mb-4 line-clamp-3">{article.contentSnippet}</p>

            {article.aiAnalysis ? (
                <>
                    <p
                      className="text-xs sm:text-sm text-gray-300 mb-3 sm:mb-4 p-2.5 sm:p-3 rounded-md"
                      style={{
                        backgroundColor: 'rgba(0, 255, 255, 0.05)',
                        border: '1px solid rgba(0, 255, 255, 0.2)'
                      }}
                    >
                        <strong style={{ color: '#00ffff' }}>AI Summary:</strong> {article.aiAnalysis.summary}
                    </p>
                    <div className="flex justify-between items-center gap-4">
                        <div className="flex gap-6">
                           <RelevanceBadge label="Personal" score={article.aiAnalysis.personalRelevance} />
                           <RelevanceBadge label="General" score={article.aiAnalysis.generalRelevance} />
                        </div>
                        <button
                          onClick={() => onViewDetails(article)}
                          className="text-xs sm:text-sm font-semibold py-2 px-4 rounded-lg transition-all active:scale-95 whitespace-nowrap"
                          style={{
                            backgroundColor: 'rgba(0, 255, 255, 0.1)',
                            color: '#00ffff',
                            border: '1px solid rgba(0, 255, 255, 0.25)'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(0, 255, 255, 0.15)';
                            e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 255, 255, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(0, 255, 255, 0.1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                            View Full Analysis
                        </button>
                    </div>
                </>
            ) : (
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-3 sm:mt-4">
                     <p className="text-xs sm:text-sm text-gray-500 italic">
                       {isAnalyzing ? 'Analyzing with AI...' : 'Analysis pending...'}
                     </p>
                    <button
                      onClick={() => onAnalyze(article.id)}
                      disabled={isAnalyzing}
                      className="w-full sm:w-auto text-xs sm:text-sm font-bold py-2 px-3 sm:px-4 rounded-lg transition-all active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: isAnalyzing ? '#666' : '#00ffff',
                        color: '#0a0a0a',
                        boxShadow: isAnalyzing ? 'none' : '0 0 10px rgba(0, 255, 255, 0.25)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isAnalyzing) {
                          e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.35)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isAnalyzing) {
                          e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.25)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                        {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
                    </button>
                </div>
            )}
        </div>
    );
};

const ArticleCardSkeleton = () => (
    <div
      className="bg-gray-800 rounded-lg p-3 sm:p-4 md:p-5 animate-pulse"
      style={{
        border: '1px solid rgba(0, 255, 255, 0.1)'
      }}
    >
        <div className="h-3 sm:h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
        <div className="h-5 sm:h-6 bg-gray-700 rounded w-full mb-3 sm:mb-4"></div>
        <div className="h-3 sm:h-4 bg-gray-700 rounded w-5/6 mb-2"></div>
        <div className="h-3 sm:h-4 bg-gray-700 rounded w-4/6 mb-3 sm:mb-4"></div>
        <div className="flex justify-end">
            <div className="h-8 sm:h-10 bg-gray-600 rounded w-28 sm:w-32"></div>
        </div>
    </div>
);


export { ArticleCard, ArticleCardSkeleton };
