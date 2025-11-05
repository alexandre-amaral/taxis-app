
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
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-2 font-display" style={{ color: '#00ffff' }}>
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
      <h2 className="text-xl sm:text-2xl font-semibold mb-3 text-center font-display" style={{ color: '#00ffff' }}>
        Select Categories & Subcategories
      </h2>
      <p className="text-gray-400 mb-4 text-center text-sm px-2">
        Click on categories to expand and select subcategories. Set priorities with sliders.
      </p>

      {/* Grid of Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#00ffff #1f2937' }}>
        {CATEGORIES_WITH_SUBCATEGORIES.map(({ name: category, subcategories }) => {
          const isSelected = selectedCategories.includes(category);
          const categoryWeight = categoryInterests[category]?.weight || 3;
          const selectedSubcats = categoryInterests[category]?.subcategories || {};
          const selectedSubcatCount = Object.keys(selectedSubcats).length;

          return (
            <div
              key={category}
              className="rounded-lg transition-all duration-300 overflow-hidden"
              style={{
                backgroundColor: isSelected ? 'rgba(0, 255, 255, 0.08)' : 'rgba(0, 255, 255, 0.03)',
                border: isSelected ? '2px solid rgba(0, 255, 255, 0.4)' : '1px solid rgba(0, 255, 255, 0.15)',
                boxShadow: isSelected ? '0 0 12px rgba(0, 255, 255, 0.15)' : 'none'
              }}
            >
              {/* Category Header - Always Visible */}
              <button
                onClick={() => onCategoryToggle(category)}
                className="w-full p-3 text-left transition-all active:scale-98 hover:bg-white/5"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0"
                      style={{
                        borderColor: isSelected ? '#00ffff' : 'rgba(255, 255, 255, 0.3)',
                        backgroundColor: isSelected ? '#00ffff' : 'transparent'
                      }}
                    >
                      {isSelected && <span className="text-black font-bold text-xs">✓</span>}
                    </div>
                    <span className="text-sm font-bold" style={{ color: isSelected ? '#00ffff' : '#fff' }}>
                      {category}
                    </span>
                  </div>
                  {isSelected && selectedSubcatCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded font-semibold" style={{ backgroundColor: 'rgba(0, 255, 255, 0.2)', color: '#00ffff' }}>
                      {selectedSubcatCount}/{subcategories.length}
                    </span>
                  )}
                </div>

                {/* Category Weight Slider - Show when selected */}
                {isSelected && (
                  <div className="flex items-center gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[9px] text-gray-500 w-7">Low</span>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={categoryWeight}
                      onChange={(e) => onCategoryWeightChange(category, parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      style={{ accentColor: '#00ffff' }}
                    />
                    <span className="text-[9px] text-gray-500 w-8">High</span>
                    <span className="text-xs font-bold w-3" style={{ color: '#00ffff' }}>
                      {categoryWeight}
                    </span>
                  </div>
                )}
              </button>

              {/* Subcategories - Show when selected */}
              {isSelected && (
                <div className="px-3 pb-3 space-y-1 border-t border-cyan-500/20 pt-2" onClick={(e) => e.stopPropagation()}>
                  {subcategories.map((subcategory: string) => {
                    const isSubSelected = !!selectedSubcats[subcategory];
                    const weight = selectedSubcats[subcategory]?.weight || 3;

                    return (
                      <div key={subcategory} className="animate-fadeIn">
                        <button
                          onClick={() => onSubcategoryToggle(category, subcategory)}
                          className="flex items-center gap-1.5 w-full text-left p-1.5 rounded transition-all hover:bg-white/5"
                          style={{
                            backgroundColor: isSubSelected ? 'rgba(0, 255, 255, 0.1)' : 'transparent'
                          }}
                        >
                          <div
                            className="w-3 h-3 rounded border flex items-center justify-center transition-all shrink-0"
                            style={{
                              borderColor: isSubSelected ? '#00ffff' : 'rgba(255, 255, 255, 0.3)',
                              backgroundColor: isSubSelected ? '#00ffff' : 'transparent'
                            }}
                          >
                            {isSubSelected && <span className="text-black font-bold text-[8px]">✓</span>}
                          </div>
                          <span className="text-xs flex-1" style={{ color: isSubSelected ? '#00ffff' : '#d1d5db' }}>
                            {subcategory}
                          </span>
                        </button>

                        {/* Subcategory Weight */}
                        {isSubSelected && (
                          <div className="flex items-center gap-1 mt-1 ml-4 animate-fadeIn">
                            <span className="text-[8px] text-gray-500 w-6">Low</span>
                            <input
                              type="range"
                              min="1"
                              max="5"
                              value={weight}
                              onChange={(e) => onSubcategoryWeightChange(category, subcategory, parseInt(e.target.value))}
                              className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                              style={{ accentColor: '#00ffff' }}
                            />
                            <span className="text-[8px] text-gray-500 w-6">High</span>
                            <span className="text-[10px] font-semibold w-2" style={{ color: '#00ffff' }}>
                              {weight}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
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

  const handleSelectAllCategory = (category: string) => {
    const categorySources = CONTENT_SOURCES.filter(s => s.category === category);
    const allSelected = categorySources.every(s => selectedSources.includes(s.id));

    categorySources.forEach(source => {
      if (allSelected) {
        // Deselect all if all are selected
        if (selectedSources.includes(source.id)) {
          onSourceToggle(source.id);
        }
      } else {
        // Select all if not all are selected
        if (!selectedSources.includes(source.id)) {
          onSourceToggle(source.id);
        }
      }
    });
  };

  return (
    <div className="animate-fadeIn">
        <h2 className="text-xl sm:text-2xl font-semibold mb-2 text-center font-display" style={{ color: '#00ffff' }}>Your Sources</h2>
        <p className="text-gray-400 mb-4 text-center text-sm px-2">Select the sources you trust and want to follow.</p>

        <div className="max-h-[58vh] overflow-y-auto pr-2 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#00ffff #1f2937' }}>
            {categories.map(category => {
              const categorySources = CONTENT_SOURCES.filter(s => s.category === category);
              const selectedInCategory = categorySources.filter(s => selectedSources.includes(s.id)).length;
              const allSelected = selectedInCategory === categorySources.length;

              return (
                <div key={category} className="bg-gray-700/30 rounded-lg p-3 animate-fadeIn" style={{ border: '1px solid rgba(0, 255, 255, 0.15)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#00ffff' }}>
                        <span className="h-1 w-6 rounded" style={{ backgroundColor: '#00ffff' }}></span>
                        {category}
                        <span className="text-xs font-normal text-gray-400">
                          ({selectedInCategory}/{categorySources.length})
                        </span>
                      </h3>
                      <button
                        onClick={() => handleSelectAllCategory(category)}
                        className="text-xs px-2 py-1 rounded transition-all hover:scale-105"
                        style={{
                          backgroundColor: allSelected ? 'rgba(255, 85, 85, 0.2)' : 'rgba(0, 255, 255, 0.2)',
                          color: allSelected ? '#ff5555' : '#00ffff',
                          border: `1px solid ${allSelected ? 'rgba(255, 85, 85, 0.3)' : 'rgba(0, 255, 255, 0.3)'}`
                        }}
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1.5">
                        {categorySources.map(source => (
                            <button
                                key={source.id}
                                onClick={() => onSourceToggle(source.id)}
                                className="p-2 text-xs rounded transition-all duration-200 active:scale-95 font-medium truncate"
                                style={{
                                  backgroundColor: selectedSources.includes(source.id) ? '#00ffff' : 'rgba(0, 255, 255, 0.05)',
                                  color: selectedSources.includes(source.id) ? '#0a0a0a' : '#00ffff',
                                  border: '1px solid rgba(0, 255, 255, 0.2)',
                                  boxShadow: selectedSources.includes(source.id) ? '0 0 6px rgba(0, 255, 255, 0.2)' : 'none'
                                }}
                                title={source.name}
                            >
                                {source.name}
                            </button>
                        ))}
                    </div>
                </div>
              );
            })}
        </div>
        {selectedSources.length > 0 && (
          <p className="text-center text-xs mt-3 text-gray-400">
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
        <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 text-center font-display" style={{ color: '#00ffff' }}>Key Topics & People</h2>
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
