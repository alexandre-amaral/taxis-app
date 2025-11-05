import { GoogleGenAI, Type } from '@google/genai';
import { UserPreferences, Article, AIAnalysis, ContentSource } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "A concise, neutral, executive summary of the article content, under 150 words."
        },
        generalRelevance: {
            type: Type.NUMBER,
            description: "A score from 1 to 10 on how important this news is to the world or its specific topic. 1 is trivial, 10 is critically important."
        },
        factCheck: {
            type: Type.OBJECT,
            properties: {
                summary: {
                    type: Type.STRING,
                    description: "A summary of the fact-check findings. Mention if the article contains verifiable claims and if they appear credible."
                },
                findings: {
                    type: Type.ARRAY,
                    description: "A list of specific claims made in the article and their verification status.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            claim: { type: Type.STRING },
                            verdict: { type: Type.STRING, description: "e.g., 'Verified', 'Unverified', 'Misleading', 'Needs Context'" },
                            source: { type: Type.STRING, description: "A primary source URL to verify the claim, if available." }
                        }
                    }
                }
            }
        },
        perspectives: {
            type: Type.ARRAY,
            description: "Identify and summarize up to 3 different viewpoints or perspectives on the main topic of the article. Aim for balance.",
            items: {
                type: Type.OBJECT,
                properties: {
                    viewpoint: { type: Type.STRING, description: "e.g., 'Economic Perspective', 'Political Left Perspective', 'Technologist's View'" },
                    summary: { type: Type.STRING, description: "A brief summary of this specific viewpoint." }
                }
            }
        }
    },
    required: ["summary", "generalRelevance", "factCheck", "perspectives"]
};

export const analyzeArticleContent = async (
    article: Article,
    preferences: UserPreferences
): Promise<AIAnalysis> => {
    try {
        const prompt = `
        As a Personal Intelligence Analyst, your task is to analyze the following article content.
        Your goal is to provide a structured, unbiased, and comprehensive analysis based on the user's preferences.
        Do not express your own opinions. Stick to the facts presented in the article and verifiable external sources.

        USER PREFERENCES:
        - Interests (Category: Weight 1-5): ${JSON.stringify(preferences.interests)}
        - Keywords: ${preferences.keywords.join(", ")}

        ARTICLE DETAILS:
        - Title: ${article.title}
        - Source: ${article.source}
        - Category: ${article.category}
        - Content Snippet: ${article.contentSnippet}

        Analyze the article and return the data in the specified JSON format.
        For Personal Relevance, consider the user's interests and keywords. A direct match on a keyword or a high weight on the category should result in a higher score.
        For Fact-Checking, be rigorous. If no verifiable claims are made, state that.
        For Perspectives, find nuanced and distinct viewpoints, not just pro/con.
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: analysisSchema,
                temperature: 0.2,
            },
        });

        const analysisResult = JSON.parse(response.text);

        // Calculate personal relevance locally based on preferences
        let personalRelevance = 3; // Baseline
        if (preferences.interests[article.category]) {
            personalRelevance += preferences.interests[article.category];
        }
        if (preferences.keywords.some(kw => article.title.toLowerCase().includes(kw.toLowerCase()) || article.contentSnippet.toLowerCase().includes(kw.toLowerCase()))) {
            personalRelevance += 3;
        }

        return {
            ...analysisResult,
            personalRelevance: Math.min(10, Math.round(personalRelevance)), // Cap at 10
        };

    } catch (error) {
        console.error("Error analyzing article with Gemini:", error);
        // Return a default/error state object
        return {
            summary: "AI analysis could not be completed for this article.",
            generalRelevance: 0,
            personalRelevance: 0,
            factCheck: { summary: "No fact-check data available.", findings: [] },
            perspectives: [],
        };
    }
};

export const fetchFeeds = async (sources: ContentSource[]): Promise<Article[]> => {
    const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
    const feedPromises = sources.map(async (source) => {
        try {
            const response = await fetch(`${CORS_PROXY}${encodeURIComponent(source.url)}`);
            if (!response.ok) {
                console.warn(`Failed to fetch feed from ${source.name}: ${response.statusText}`);
                return [];
            }
            const text = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'application/xml');
            
            // Check for parsing errors which can result in an error document
            if (xml.getElementsByTagName('parsererror').length > 0) {
                console.warn(`Failed to parse XML from ${source.name}`);
                return [];
            }

            const items = Array.from(xml.querySelectorAll('item, entry'));

            return items.map((item): Article | null => {
                const title = item.querySelector('title')?.textContent?.trim() ?? '';
                const link = item.querySelector('link')?.getAttribute('href') ?? item.querySelector('link')?.textContent?.trim() ?? '';
                const contentSnippetRaw = item.querySelector('description')?.textContent ?? item.querySelector('summary')?.textContent ?? item.querySelector('content')?.textContent ?? '';
                const bodyText = new DOMParser().parseFromString(contentSnippetRaw, 'text/html').body.textContent;
                const contentSnippet = (bodyText?.substring(0, 200).trim() ?? '') + '...';
                const isoDate = new Date(item.querySelector('pubDate')?.textContent ?? item.querySelector('updated')?.textContent ?? Date.now()).toISOString();
                const id = link || title;

                if (!title || !link) return null;

                return {
                    id,
                    title,
                    link,
                    source: source.name,
                    category: source.category,
                    contentSnippet,
                    isoDate
                };
            }).filter((article): article is Article => article !== null);
        } catch (error) {
            console.error(`Error fetching or parsing feed from ${source.name}:`, error);
            return [];
        }
    });

    const results = await Promise.all(feedPromises);
    const allArticles = results.flat();

    allArticles.sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime());

    return allArticles;
};
