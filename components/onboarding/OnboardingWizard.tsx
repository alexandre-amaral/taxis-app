
import React, { useState } from 'react';
import { UserPreferences, CategoryInterest } from '../../types';
import { CATEGORIES_WITH_SUBCATEGORIES, CONTENT_SOURCES } from '../../constants';

interface OnboardingWizardProps {
  onComplete: (preferences: UserPreferences) => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryInterests, setCategoryInterests] = useState<{ [category: string]: CategoryInterest }>({});
  const [sources, setSources] = useState<string[]>([]);
  const [keywords, setKeywords] = useState('');

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      // Removing category - also clear its interests
      setSelectedCategories(prev => prev.filter(c => c !== category));
      setCategoryInterests(prev => {
        const updated = { ...prev };
        delete updated[category];
        return updated;
      });
    } else {
      // Adding category
      setSelectedCategories(prev => [...prev, category]);
      setCategoryInterests(prev => ({
        ...prev,
        [category]: { weight: 3, subcategories: {} }
      }));
    }
  };

  const handleSubcategoryToggle = (category: string, subcategory: string) => {
    setCategoryInterests(prev => {
      const current = prev[category] || { weight: 3, subcategories: {} };
      const subcats = { ...current.subcategories };

      if (subcats[subcategory]) {
        delete subcats[subcategory];
      } else {
        subcats[subcategory] = { weight: 3 };
      }

      return {
        ...prev,
        [category]: {
          ...current,
          subcategories: subcats
        }
      };
    });
  };

  const handleSubcategoryWeightChange = (category: string, subcategory: string, weight: number) => {
    setCategoryInterests(prev => ({
      ...prev,
      [category]: {
        weight: prev[category]?.weight || 3,
        subcategories: {
          ...(prev[category]?.subcategories || {}),
          [subcategory]: { weight }
        }
      }
    }));
  };

  const handleCategoryWeightChange = (category: string, weight: number) => {
    setCategoryInterests(prev => ({
      ...prev,
      [category]: {
        weight,
        subcategories: prev[category]?.subcategories || {}
      }
    }));
  };

  const handleSourceToggle = (sourceId: string) => {
    setSources(prev =>
      prev.includes(sourceId)
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const finishOnboarding = () => {
    // Create legacy interests object for backwards compatibility
    const legacyInterests: { [category: string]: number } = {};
    Object.entries(categoryInterests).forEach(([cat, data]) => {
      legacyInterests[cat] = data.weight;
    });

    onComplete({
        interests: legacyInterests,
        categoryInterests,
        sources,
        keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
    });
  };

  const canProgressFromStep1 = () => {
    // Check if at least one category is selected AND has at least one subcategory selected
    return selectedCategories.length > 0 && selectedCategories.every(category => {
      const categoryData = categoryInterests[category];
      return categoryData && Object.keys(categoryData.subcategories).length > 0;
    });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <CategorySubcategoryStep
            selectedCategories={selectedCategories}
            categoryInterests={categoryInterests}
            onCategoryToggle={handleCategoryToggle}
            onSubcategoryToggle={handleSubcategoryToggle}
            onSubcategoryWeightChange={handleSubcategoryWeightChange}
            onCategoryWeightChange={handleCategoryWeightChange}
            onNext={() => setStep(2)}
            canProgress={canProgressFromStep1()}
          />
        );
      case 2:
        return (
          <SourceStep
            selectedSources={sources}
            onSourceToggle={handleSourceToggle}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        );
      case 3:
        return (
          <KeywordStep
            keywords={keywords}
            setKeywords={setKeywords}
            onFinish={finishOnboarding}
            onBack={() => setStep(2)}
          />
        );
      default:
        return null;
    }
  };

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-3 sm:p-4 md:p-6">
        <div className="w-full max-w-7xl bg-gray-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-2xl" style={{
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.08)',
          animation: 'fadeIn 0.3s ease-in'
        }}>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-2" style={{ color: '#00ffff' }}>
              Welcome to Taxis
            </h1>
            <p className="text-center text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
              Let's personalize your intelligence briefing. <span className="font-semibold">Step {step} of {totalSteps}</span>
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2 mb-6 sm:mb-8 overflow-hidden">
              <div
                className="h-2 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progress}%`,
                  backgroundColor: '#00ffff',
                  boxShadow: '0 0 8px rgba(0, 255, 255, 0.4)'
                }}
              />
            </div>

            {renderStep()}
        </div>
    </div>
  );
};

// Step 1: Select Categories AND Subcategories (Combined)
const CategorySubcategoryStep = ({
  selectedCategories,
  categoryInterests,
  onCategoryToggle,
  onSubcategoryToggle,
  onSubcategoryWeightChange,
  onCategoryWeightChange,
  onNext,
  canProgress
}: any) => {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-center" style={{ color: '#00ffff' }}>
        Select Categories & Subcategories
      </h2>
      <p className="text-gray-400 mb-4 sm:mb-6 text-center text-sm sm:text-base px-2">
        Choose categories from the left, then select specific topics and rate their importance (1-5) on the right.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left Panel: Available Categories */}
        <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4" style={{ border: '1px solid rgba(0, 255, 255, 0.2)' }}>
          <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: '#00ffff' }}>
            <span className="h-1 w-6 rounded" style={{ backgroundColor: '#00ffff' }}></span>
            Available Categories
          </h3>
          <div className="space-y-2">
            {CATEGORIES_WITH_SUBCATEGORIES.map(({ name: category }) => {
              const isSelected = selectedCategories.includes(category);

              return (
                <button
                  key={category}
                  onClick={() => onCategoryToggle(category)}
                  className="w-full flex items-center justify-between p-2.5 sm:p-3 rounded-lg transition-all duration-200 hover:shadow-lg active:scale-95"
                  style={{
                    backgroundColor: isSelected ? 'rgba(0, 255, 255, 0.15)' : 'rgba(0, 255, 255, 0.05)',
                    border: isSelected ? '2px solid rgba(0, 255, 255, 0.4)' : '1px solid rgba(0, 255, 255, 0.2)',
                    boxShadow: isSelected ? '0 0 10px rgba(0, 255, 255, 0.15)' : 'none'
                  }}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded border-2 flex items-center justify-center transition-all duration-200 shrink-0"
                      style={{
                        borderColor: isSelected ? '#00ffff' : 'rgba(255, 255, 255, 0.3)',
                        backgroundColor: isSelected ? '#00ffff' : 'transparent',
                        boxShadow: isSelected ? '0 0 6px rgba(0, 255, 255, 0.3)' : 'none'
                      }}
                    >
                      {isSelected && <span className="text-black font-bold text-xs sm:text-sm">✓</span>}
                    </div>
                    <span className="text-sm sm:text-base font-bold text-left" style={{ color: isSelected ? '#00ffff' : '#fff' }}>
                      {category}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="text-xs px-2 py-1 rounded font-semibold shrink-0" style={{ backgroundColor: 'rgba(0, 255, 255, 0.2)', color: '#00ffff' }}>
                      →
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Selected Categories with Subcategories */}
        <div className="bg-gray-700/50 rounded-lg p-3 sm:p-4" style={{ border: '1px solid rgba(0, 255, 255, 0.2)' }}>
          <h3 className="text-base sm:text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: '#00ffff' }}>
            <span className="h-1 w-6 rounded" style={{ backgroundColor: '#00ffff' }}></span>
            Selected Categories ({selectedCategories.length})
          </h3>

          {selectedCategories.length === 0 ? (
            <div className="flex items-center justify-center min-h-[200px] text-center">
              <p className="text-sm text-gray-500 italic px-4">
                Select categories from the left panel to configure their subcategories here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedCategories.map(category => {
                const categoryData = CATEGORIES_WITH_SUBCATEGORIES.find(c => c.name === category);
                const categoryWeight = categoryInterests[category]?.weight || 3;
                const selectedSubcats = categoryInterests[category]?.subcategories || {};

                return (
                  <div
                    key={category}
                    className="bg-gray-800 rounded-lg p-3 animate-fadeIn"
                    style={{
                      border: '1px solid rgba(0, 255, 255, 0.3)',
                      boxShadow: '0 0 10px rgba(0, 255, 255, 0.08)'
                    }}
                  >
                    {/* Category Header */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm sm:text-base font-bold" style={{ color: '#00ffff' }}>{category}</h4>
                        <button
                          onClick={() => onCategoryToggle(category)}
                          className="text-xs px-2 py-1 rounded hover:bg-red-500/20 transition-colors"
                          style={{ color: '#ff5555' }}
                        >
                          Remove
                        </button>
                      </div>

                      {/* Category Weight */}
                      <div className="mb-2">
                        <label className="block text-[10px] sm:text-xs text-gray-400 mb-1">Overall Priority</label>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-500 shrink-0">Low</span>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            value={categoryWeight}
                            onChange={(e) => onCategoryWeightChange(category, parseInt(e.target.value))}
                            className="flex-1 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                            style={{ accentColor: '#00ffff' }}
                          />
                          <span className="text-[10px] text-gray-500 shrink-0">High</span>
                          <span className="text-sm font-bold shrink-0" style={{ color: '#00ffff', minWidth: '15px' }}>
                            {categoryWeight}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Subcategories */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] sm:text-xs text-gray-400 mb-2">
                        Subcategories ({Object.keys(selectedSubcats).length}/{categoryData?.subcategories.length || 0})
                      </p>
                      {categoryData?.subcategories.map((subcategory: string) => {
                        const isSubSelected = !!selectedSubcats[subcategory];
                        const weight = selectedSubcats[subcategory]?.weight || 3;

                        return (
                          <div
                            key={subcategory}
                            className="p-1.5 sm:p-2 rounded-md transition-all duration-200"
                            style={{
                              backgroundColor: isSubSelected ? 'rgba(0, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)',
                              border: isSubSelected ? '1px solid rgba(0, 255, 255, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)'
                            }}
                          >
                            <button
                              onClick={() => onSubcategoryToggle(category, subcategory)}
                              className="flex items-center space-x-2 w-full text-left active:scale-95 transition-transform"
                            >
                              <div
                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border flex items-center justify-center transition-all duration-200 shrink-0"
                                style={{
                                  borderColor: isSubSelected ? '#00ffff' : 'rgba(255, 255, 255, 0.3)',
                                  backgroundColor: isSubSelected ? '#00ffff' : 'transparent',
                                  boxShadow: isSubSelected ? '0 0 4px rgba(0, 255, 255, 0.3)' : 'none'
                                }}
                              >
                                {isSubSelected && <span className="text-black font-bold text-[10px]">✓</span>}
                              </div>
                              <span className="text-xs sm:text-sm" style={{ color: isSubSelected ? '#00ffff' : '#d1d5db' }}>
                                {subcategory}
                              </span>
                            </button>

                            {isSubSelected && (
                              <div className="flex items-center justify-between mt-1.5 ml-5 sm:ml-6 gap-1 animate-fadeIn">
                                <span className="text-[10px] text-gray-500 shrink-0">Low</span>
                                <input
                                  type="range"
                                  min="1"
                                  max="5"
                                  value={weight}
                                  onChange={(e) => onSubcategoryWeightChange(category, subcategory, parseInt(e.target.value))}
                                  className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                  style={{ accentColor: '#00ffff' }}
                                />
                                <span className="text-[10px] text-gray-500 shrink-0">High</span>
                                <span className="ml-1 text-xs font-semibold shrink-0" style={{ color: '#00ffff', minWidth: '12px' }}>
                                  {weight}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!canProgress}
        className="w-full mt-6 sm:mt-8 font-bold py-2.5 sm:py-3 px-4 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-sm sm:text-base"
        style={{
          backgroundColor: '#00ffff',
          color: '#0a0a0a',
          boxShadow: canProgress ? '0 0 12px rgba(0, 255, 255, 0.3)' : 'none',
          border: 'none'
        }}
        onMouseEnter={(e) => {
          if (canProgress) {
            e.currentTarget.style.boxShadow = '0 0 18px rgba(0, 255, 255, 0.4)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 255, 255, 0.3)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        Next: Select Sources →
      </button>
    </div>
  );
};

const SourceStep = ({ selectedSources, onSourceToggle, onNext, onBack }: any) => {
  const categories = Array.from(new Set(CONTENT_SOURCES.map(s => s.category)));

  return (
    <div className="animate-fadeIn">
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-center" style={{ color: '#00ffff' }}>Your Sources</h2>
        <p className="text-gray-400 mb-4 sm:mb-6 text-center text-sm sm:text-base px-2">Select the sources you trust and want to follow.</p>
        <div className="space-y-4 sm:space-y-5">
            {categories.map(category => (
                <div key={category} className="animate-fadeIn">
                    <h3 className="text-base sm:text-xl font-semibold mb-2 sm:mb-3 flex items-center gap-2" style={{ color: '#00ffff' }}>
                      <span className="h-1 w-8 rounded" style={{ backgroundColor: '#00ffff' }}></span>
                      {category}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {CONTENT_SOURCES.filter(s => s.category === category).map(source => (
                            <button
                                key={source.id}
                                onClick={() => onSourceToggle(source.id)}
                                className="p-2 text-xs sm:text-sm rounded-md transition-all duration-200 active:scale-95 hover:shadow-lg font-medium"
                                style={{
                                  backgroundColor: selectedSources.includes(source.id) ? '#00ffff' : 'rgba(0, 255, 255, 0.1)',
                                  color: selectedSources.includes(source.id) ? '#0a0a0a' : '#00ffff',
                                  border: '1px solid rgba(0, 255, 255, 0.3)',
                                  boxShadow: selectedSources.includes(source.id) ? '0 0 8px rgba(0, 255, 255, 0.3)' : 'none'
                                }}
                            >
                                {source.name}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
        {selectedSources.length > 0 && (
          <p className="text-center text-xs sm:text-sm mt-3 sm:mt-4 text-gray-400">
            <span className="font-semibold" style={{ color: '#00ffff' }}>{selectedSources.length}</span> sources selected
          </p>
        )}
        <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6 sm:mt-8">
            <button
                onClick={onBack}
                className="font-bold py-2.5 sm:py-3 px-6 rounded-lg transition-all duration-300 active:scale-95 text-sm sm:text-base order-2 sm:order-1"
                style={{
                  backgroundColor: 'rgba(100, 100, 100, 0.5)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(100, 100, 100, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(100, 100, 100, 0.5)';
                }}
            >
                ← Back
            </button>
            <button
                onClick={onNext}
                disabled={selectedSources.length === 0}
                className="font-bold py-2.5 sm:py-3 px-6 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 text-sm sm:text-base order-1 sm:order-2"
                style={{
                  backgroundColor: '#00ffff',
                  color: '#0a0a0a',
                  boxShadow: selectedSources.length > 0 ? '0 0 12px rgba(0, 255, 255, 0.3)' : 'none'
                }}
                onMouseEnter={(e) => {
                  if (selectedSources.length > 0) {
                    e.currentTarget.style.boxShadow = '0 0 18px rgba(0, 255, 255, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 255, 255, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
            >
                Next: Add Keywords →
            </button>
        </div>
    </div>
  );
};

const KeywordStep = ({ keywords, setKeywords, onFinish, onBack }: any) => {
  const keywordCount = keywords.split(',').filter((k: string) => k.trim()).length;

  return (
    <div className="animate-fadeIn">
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-center" style={{ color: '#00ffff' }}>Key Topics & People</h2>
        <p className="text-gray-400 mb-4 sm:mb-6 text-center text-sm sm:text-base px-2">
          Enter comma-separated keywords, companies, or people you want to track closely.
        </p>
        <textarea
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full h-32 sm:h-40 p-3 sm:p-4 rounded-lg text-white focus:outline-none text-sm sm:text-base transition-all duration-300 resize-none"
            style={{
              backgroundColor: 'rgba(0, 255, 255, 0.05)',
              border: '2px solid rgba(0, 255, 255, 0.25)',
              boxShadow: '0 0 8px rgba(0, 255, 255, 0.06)'
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = '2px solid rgba(0, 255, 255, 0.5)';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 255, 255, 0.15)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = '2px solid rgba(0, 255, 255, 0.25)';
              e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 255, 255, 0.06)';
            }}
            placeholder="artificial intelligence, quantum computing, Elon Musk, climate change, ..."
        />
        {keywordCount > 0 && (
          <p className="text-center text-xs sm:text-sm mt-2 text-gray-400">
            <span className="font-semibold" style={{ color: '#00ffff' }}>{keywordCount}</span> {keywordCount === 1 ? 'keyword' : 'keywords'} added
          </p>
        )}
        <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6 sm:mt-8">
            <button
                onClick={onBack}
                className="font-bold py-2.5 sm:py-3 px-6 rounded-lg transition-all duration-300 active:scale-95 text-sm sm:text-base order-2 sm:order-1"
                style={{
                  backgroundColor: 'rgba(100, 100, 100, 0.5)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(100, 100, 100, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(100, 100, 100, 0.5)';
                }}
            >
                ← Back
            </button>
            <button
                onClick={onFinish}
                className="font-bold py-2.5 sm:py-3 px-6 rounded-lg transition-all duration-300 active:scale-95 text-sm sm:text-base order-1 sm:order-2"
                style={{
                  backgroundColor: '#00ff88',
                  color: '#0a0a0a',
                  boxShadow: '0 0 12px rgba(0, 255, 136, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 18px rgba(0, 255, 136, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 255, 136, 0.3)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
            >
                Finish Setup ✓
            </button>
        </div>
    </div>
  );
};


export default OnboardingWizard;
