
import React from 'react';
import { Article } from '../../types';
import { CheckCircleIcon, AlertTriangleIcon, InfoIcon } from './Icons';

interface ArticleDetailModalProps {
  article: Article | null;
  onClose: () => void;
}

const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({ article, onClose }) => {
  if (!article || !article.aiAnalysis) return null;

  const { aiAnalysis } = article;

  const getVerdictIcon = (verdict: string) => {
    switch (verdict.toLowerCase()) {
      case 'verified':
        return <CheckCircleIcon className="w-5 h-5" style={{ color: '#00ff88' }} />;
      case 'misleading':
      case 'unverified':
        return <AlertTriangleIcon className="w-5 h-5" style={{ color: '#ffaa00' }} />;
      default:
        return <InfoIcon className="w-5 h-5" style={{ color: '#00ffff' }} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex justify-center items-center z-50 p-3 sm:p-4" onClick={onClose}>
      <div
        className="bg-gray-800 text-gray-200 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 md:p-8 animate-fadeIn"
        style={{
          border: '1px solid rgba(0, 255, 255, 0.25)',
          boxShadow: '0 0 30px rgba(0, 255, 255, 0.12)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex-1 pr-8 sm:pr-0">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white line-clamp-3">{article.title}</h2>
            <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-xs sm:text-sm hover:underline inline-block mt-1" style={{ color: '#00ffff' }}>
              {article.source} →
            </a>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 sm:static text-gray-400 hover:text-white text-3xl sm:text-4xl leading-none p-1 transition-all"
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#00ffff';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#9ca3af';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            &times;
          </button>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Executive Summary */}
          <div>
            <h3
              className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 pb-2 flex items-center gap-2"
              style={{
                color: '#00ffff',
                borderBottom: '2px solid rgba(0, 255, 255, 0.3)'
              }}
            >
              <span className="h-1 w-6 rounded" style={{ backgroundColor: '#00ffff' }}></span>
              Executive Summary
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-300 leading-relaxed">{aiAnalysis.summary}</p>
          </div>

          {/* Fact Check Module */}
          <div>
            <h3
              className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 pb-2 flex items-center gap-2"
              style={{
                color: '#00ffff',
                borderBottom: '2px solid rgba(0, 255, 255, 0.3)'
              }}
            >
              <span className="h-1 w-6 rounded" style={{ backgroundColor: '#00ffff' }}></span>
              Veracity Report
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 italic mb-3 sm:mb-4">{aiAnalysis.factCheck.summary}</p>
            <div className="space-y-2 sm:space-y-3">
              {aiAnalysis.factCheck.findings.length > 0 ? (
                aiAnalysis.factCheck.findings.map((finding, index) => (
                  <div
                    key={index}
                    className="bg-gray-700 p-3 sm:p-4 rounded-lg"
                    style={{
                      border: '1px solid rgba(0, 255, 255, 0.2)'
                    }}
                  >
                    <p className="font-semibold text-gray-200 text-xs sm:text-sm">Claim: "{finding.claim}"</p>
                    <div className="flex items-center mt-2">
                      {getVerdictIcon(finding.verdict)}
                      <span className="ml-2 text-gray-300 font-medium text-xs sm:text-sm">{finding.verdict}</span>
                    </div>
                    {finding.source && (
                      <a href={finding.source} target="_blank" rel="noopener noreferrer" className="text-[10px] sm:text-xs hover:underline mt-1 block truncate" style={{ color: '#00ffff' }}>
                        Source: {finding.source}
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs sm:text-sm text-gray-500">No specific claims were identified for fact-checking in this article.</p>
              )}
            </div>
          </div>

          {/* Perspectives Module */}
          <div>
            <h3
              className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 pb-2 flex items-center gap-2"
              style={{
                color: '#00ffff',
                borderBottom: '2px solid rgba(0, 255, 255, 0.3)'
              }}
            >
              <span className="h-1 w-6 rounded" style={{ backgroundColor: '#00ffff' }}></span>
              Multiple Perspectives
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {aiAnalysis.perspectives.length > 0 ? (
                aiAnalysis.perspectives.map((perspective, index) => (
                  <div
                    key={index}
                    className="bg-gray-700/50 p-3 sm:p-4 rounded-lg"
                    style={{
                      border: '1px solid rgba(0, 255, 255, 0.15)',
                      boxShadow: '0 0 8px rgba(0, 255, 255, 0.03)'
                    }}
                  >
                    <h4 className="font-bold mb-2 text-sm sm:text-base" style={{ color: '#00ffff' }}>{perspective.viewpoint}</h4>
                    <p className="text-xs sm:text-sm text-gray-300">{perspective.summary}</p>
                  </div>
                ))
              ) : (
                 <p className="text-xs sm:text-sm text-gray-500 col-span-full">No distinct alternative perspectives were identified for this topic.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleDetailModal;
