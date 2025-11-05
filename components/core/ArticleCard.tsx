
import React from 'react';
import { Article } from '../../types';

interface ArticleCardProps {
  article: Article;
  onAnalyze: (articleId: string) => void;
  onViewDetails: (article: Article) => void;
}

const RelevanceMeter = ({ label, score }: { label: string; score: number }) => (
    <div className="w-1/2 pr-2">
        <div className="flex justify-between items-baseline mb-1">
            <span className="text-xs font-semibold text-gray-400">{label}</span>
            <span className="text-sm font-bold" style={{ color: '#00ffff' }}>{score}/10</span>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full"
              style={{
                width: `${score * 10}%`,
                backgroundColor: '#00ffff',
                boxShadow: '0 0 6px rgba(0, 255, 255, 0.3)'
              }}
            ></div>
        </div>
    </div>
);


const ArticleCard: React.FC<ArticleCardProps> = ({ article, onAnalyze, onViewDetails }) => {
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
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-white mt-1 line-clamp-2">{article.title}</h3>
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex w-full sm:w-2/3 gap-3">
                           <RelevanceMeter label="General" score={article.aiAnalysis.generalRelevance} />
                           <RelevanceMeter label="Personal" score={article.aiAnalysis.personalRelevance} />
                        </div>
                        <button
                          onClick={() => onViewDetails(article)}
                          className="w-full sm:w-auto text-xs sm:text-sm font-semibold py-2 px-3 sm:px-4 rounded-lg transition-all active:scale-95 whitespace-nowrap"
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
                     <p className="text-xs sm:text-sm text-gray-500 italic">Analysis pending...</p>
                    <button
                      onClick={() => onAnalyze(article.id)}
                      className="w-full sm:w-auto text-xs sm:text-sm font-bold py-2 px-3 sm:px-4 rounded-lg transition-all active:scale-95 whitespace-nowrap"
                      style={{
                        backgroundColor: '#00ffff',
                        color: '#0a0a0a',
                        boxShadow: '0 0 10px rgba(0, 255, 255, 0.25)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.35)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.25)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                        Analyze with AI
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
