import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface UrlSummaryModalProps {
  summaryData: any;
  onClose: () => void;
  isLoading: boolean;
}

const UrlSummaryModal: React.FC<UrlSummaryModalProps> = ({ summaryData, onClose, isLoading }) => {
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <h2 className="text-2xl font-semibold text-white mt-4">Summarizing URL...</h2>
          <p className="text-gray-400">Please wait while we analyze the content.</p>
        </div>
      </div>
    );
  }

  if (!summaryData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-white">{summaryData.title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        <div className="prose prose-invert max-w-none text-gray-300">
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{summaryData.summary}</ReactMarkdown>
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-bold text-cyan-300 mb-2">Key Points</h3>
          <ul className="list-disc list-inside space-y-2">
            {summaryData.keyPoints.map((point: string, index: number) => (
              <li key={index}>{point}</li>
            ))}
          </ul>
        </div>
        <div className="mt-6 text-xs text-gray-500">
          Source: {summaryData.sourceName} - <a href={summaryData.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">{summaryData.url}</a>
        </div>
      </div>
    </div>
  );
};

export default UrlSummaryModal;
