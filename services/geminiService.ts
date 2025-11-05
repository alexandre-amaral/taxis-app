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
    const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000; // 48 hours in milliseconds
    const now = Date.now();

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

            // Helper function to decode HTML entities
            const decodeHTML = (html: string) => {
                const txt = document.createElement('textarea');
                txt.innerHTML = html;
                return txt.value;
            };

            return items.map((item): Article | null => {
                const titleRaw = item.querySelector('title')?.textContent?.trim() ?? '';
                const title = decodeHTML(titleRaw);
                const link = item.querySelector('link')?.getAttribute('href') ?? item.querySelector('link')?.textContent?.trim() ?? '';
                const contentSnippetRaw = item.querySelector('description')?.textContent ?? item.querySelector('summary')?.textContent ?? item.querySelector('content')?.textContent ?? '';
                const bodyText = new DOMParser().parseFromString(contentSnippetRaw, 'text/html').body.textContent;
                const contentSnippetDecoded = decodeHTML(bodyText?.substring(0, 200).trim() ?? '');
                const contentSnippet = contentSnippetDecoded + '...';

                // Parse publication date
                const pubDateStr = item.querySelector('pubDate')?.textContent ?? item.querySelector('updated')?.textContent;
                const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();
                const isoDate = pubDate.toISOString();
                const articleAge = now - pubDate.getTime();

                // Use link as primary ID, fallback to hash of title
                const id = link || `article-${title.substring(0, 50).replace(/\s+/g, '-')}`;

                // Filter: only return articles from the last 48 hours
                if (!title || !link || articleAge > FORTY_EIGHT_HOURS_MS) {
                    if (articleAge > FORTY_EIGHT_HOURS_MS) {
                        console.log(`[FeedFilter] Skipping old article (${Math.floor(articleAge / (60 * 60 * 1000))}h old): ${title.substring(0, 50)}`);
                    }
                    return null;
                }

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

    // Deduplicate articles by link (primary) or title (fallback)
    const seen = new Map<string, Article>();
    const deduped = allArticles.filter(article => {
        // Use link as primary key
        const key = article.link || article.title;
        if (seen.has(key)) {
            console.log(`[Dedup] Skipping duplicate: ${article.title.substring(0, 50)}`);
            return false;
        }
        seen.set(key, article);
        return true;
    });

    console.log(`[FeedFetch] Total articles from last 48h: ${allArticles.length}, After dedup: ${deduped.length}`);

    deduped.sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime());

    return deduped;
};

// Web search schema for topic dashboard
const topicDashboardSchema = {
    type: Type.OBJECT,
    properties: {
        executiveSummary: {
            type: Type.STRING,
            description: "A comprehensive executive summary (300-500 words) about the topic based on latest information from web search."
        },
        keyPoints: {
            type: Type.ARRAY,
            description: "5-7 key points or bullet points summarizing the most important aspects of the topic.",
            items: { type: Type.STRING }
        },
        recentDevelopments: {
            type: Type.ARRAY,
            description: "Recent news, updates, or developments related to the topic. Must include FULL URLs to original articles.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: "Title of the news/development" },
                    description: { type: Type.STRING, description: "Brief description of the development" },
                    sourceName: { type: Type.STRING, description: "Name of the source (e.g., 'New York Times', 'Reuters', 'BBC')" },
                    sourceUrl: { type: Type.STRING, description: "FULL URL to the original article (must start with http:// or https://). REQUIRED." },
                    date: { type: Type.STRING, description: "Publication date or timeframe (e.g., '2 days ago', 'Jan 5, 2025')" }
                },
                required: ["title", "description", "sourceName", "sourceUrl"]
            }
        },
        perspectives: {
            type: Type.ARRAY,
            description: "Different perspectives or viewpoints on the topic (e.g., economic, political, technological, social).",
            items: {
                type: Type.OBJECT,
                properties: {
                    viewpoint: { type: Type.STRING },
                    summary: { type: Type.STRING }
                }
            }
        },
        relevanceScore: {
            type: Type.NUMBER,
            description: "A score from 1-10 indicating the current importance/relevance of this topic globally."
        }
    },
    required: ["executiveSummary", "keyPoints", "recentDevelopments", "perspectives", "relevanceScore"]
};

// Generate topic dashboard using web search
export const generateTopicDashboardFromWeb = async (topic: string): Promise<any> => {
    try {
        console.log(`[TopicDashboard] 🔍 Generating dashboard for topic: "${topic}" using web search...`);

        const today = new Date().toISOString().split('T')[0];
        const prompt = `
        As a Personal Intelligence Analyst, generate a comprehensive dashboard about the following topic using ONLY THE LATEST AND MOST RECENT information from web search.

        TOPIC: "${topic}"
        TODAY'S DATE: ${today}

        CRITICAL REQUIREMENTS:
        - ONLY use information from the last 7 days (maximum 14 days if absolutely necessary)
        - Prioritize breaking news, latest developments, and current events
        - Ignore old, outdated, or historical information unless directly relevant to current context
        - For "Recent Developments" section, ONLY include news from the past week
        - Always include the publication date/timeframe for each piece of information
        - **MANDATORY**: For EVERY recent development, provide the FULL ORIGINAL URL (starting with http:// or https://) where the information was found
        - DO NOT use placeholder URLs or generic domains - provide ACTUAL article links

        Your task:
        1. Search the web for THE LATEST news, updates, and information about this topic (last 7 days)
        2. Provide a comprehensive executive summary (300-500 words) focusing on CURRENT STATE and RECENT EVENTS
        3. Identify 5-7 key points about what's happening RIGHT NOW with this topic
        4. List ONLY recent developments from the past 7 days - FOR EACH ONE:
           - Include the full article title
           - Provide a brief description
           - Give the SOURCE NAME (e.g., "Reuters", "BBC News", "The Guardian")
           - Provide the COMPLETE ORIGINAL URL to the article (REQUIRED - must be actual clickable link)
           - Include publication date or timeframe
        5. Present different perspectives on CURRENT discussions about the topic
        6. Assess the current global relevance/importance of this topic TODAY (1-10 scale)

        Be objective, factual, cite sources with dates and REAL URLs, and PRIORITIZE RECENCY ABOVE ALL.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: topicDashboardSchema,
                temperature: 0.3,
            },
            tools: [{ googleSearch: {} }], // Enable Google Search grounding
        });

        const result = JSON.parse(response.text);
        console.log('[TopicDashboard] ✅ Dashboard generated successfully');

        return {
            topic,
            ...result,
            generatedAt: new Date().toISOString()
        };

    } catch (error) {
        console.error('[TopicDashboard] ❌ Error generating dashboard:', error);
        return {
            topic,
            executiveSummary: `Unable to generate dashboard for "${topic}". Please try again.`,
            keyPoints: [],
            recentDevelopments: [],
            perspectives: [],
            relevanceScore: 0,
            generatedAt: new Date().toISOString(),
            error: true
        };
    }
};

const briefingSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "A compelling, newspaper-style headline for the daily briefing."
        },
        executiveSummary: {
            type: Type.STRING,
            description: "A comprehensive, narrative-style executive summary (300-400 words) in the style of a presidential daily briefing. Synthesize the provided articles into a cohesive report, identifying the most critical developments and overarching themes."
        },
        keyDevelopments: {
            type: Type.ARRAY,
            description: "A list of the 3-5 most important developments. Each item should include a summary and the source article.",
            items: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING, description: "A summary of the key development." },
                    sourceTitle: { type: Type.STRING, description: "The title of the source article." },
                    sourceUrl: { type: Type.STRING, description: "The URL of the source article." }
                },
                required: ["summary", "sourceTitle", "sourceUrl"]
            }
        },
        perspectives: {
            type: Type.ARRAY,
            description: "A summary of 2-3 different perspectives on the main topics covered in the briefing.",
            items: {
                type: Type.OBJECT,
                properties: {
                    viewpoint: { type: Type.STRING, description: "e.g., 'Economic Perspective', 'Technological View'" },
                    summary: { type: Type.STRING, description: "A brief summary of this specific viewpoint." }
                },
                required: ["viewpoint", "summary"]
            }
        }
    },
    required: ["title", "executiveSummary", "keyDevelopments", "perspectives"]
};

const newsArticleFromGeminiSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "The full title of the news article." },
        url: { type: Type.STRING, description: "The full, direct URL to the original article." },
        sourceName: { type: Type.STRING, description: "The name of the news publication (e.g., 'Reuters', 'BBC News')." },
        summary: { type: Type.STRING, description: "A brief, neutral summary of the article's content." },
        category: { type: Type.STRING, description: "The category this article belongs to, from the provided list." },
        publishedDate: { type: Type.STRING, description: "The publication date of the article in ISO 8601 format." },
    },
    required: ["title", "url", "sourceName", "summary", "category", "publishedDate"],
};

const newsResponseSchema = {
    type: Type.OBJECT,
    properties: {
        articles: {
            type: Type.ARRAY,
            description: "A list of 20 news articles found.",
            items: newsArticleFromGeminiSchema
        }
    },
    required: ["articles"]
};

export const fetchNewsFromGemini = async (preferences: UserPreferences): Promise<Article[]> => {
    console.log('[GeminiNews] 📰 Fetching news from Gemini based on user preferences...');

    const categories = Object.keys(preferences.categoryInterests || preferences.interests);
    const keywords = preferences.keywords;

    const prompt = `
    As an expert news aggregator, your task is to find 20 recent and relevant news articles based on the user's preferred categories and keywords. Use Google Search to find the most up-to-date information.

    **User Preferences:**
    - Categories: ${categories.join(", ")}
    - Keywords: ${keywords.join(", ")}

    **Instructions:**
    1.  For each category, find a variety of recent (last 48 hours) and high-quality news articles.
    2.  Also, find articles that specifically match the user's keywords.
    3.  Ensure the articles are from reputable news sources.
    4.  Return a total of 20 articles.
    5.  For each article, provide the full title, the direct URL to the article, the source name, a brief summary, the category it belongs to, and the publication date.
    6.  The final output must be in the specified JSON format.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: newsResponseSchema,
                temperature: 0.5,
            },
            tools: [{ googleSearch: {} }],
        });

        const result = JSON.parse(response.text);

        const articles: Article[] = result.articles.map((article: any) => ({
            id: article.url, // Use URL as a unique ID
            title: article.title,
            link: article.url,
            source: article.sourceName,
            category: article.category,
            contentSnippet: article.summary,
            isoDate: article.publishedDate,
        }));

        console.log(`[GeminiNews] ✅ Fetched ${articles.length} articles from Gemini.`);
        return articles;

    } catch (error) {
        console.error('[GeminiNews] ❌ Error fetching news from Gemini:', error);
        return []; // Return empty array on error
    }
};


export const generatePresidentialBriefing = async (
    articles: Article[],
    preferences: UserPreferences
): Promise<{ title: string; executiveSummary: string; keyDevelopments: any[]; perspectives: any[] }> => {
    try {
        console.log(`[Briefing] 📝 Generating Presidential Briefing from ${articles.length} articles...`);

        const articlesForPrompt = articles.map(a => (
            `- Title: ${a.title}\n` +
            `- Source: ${a.source}\n` +
            `- URL: ${a.link}\n` +
            `- Snippet: ${a.contentSnippet}`
        )).join('\n\n');

        const prompt = `
        As a top-tier intelligence analyst for a head of state, your task is to synthesize the provided raw intelligence reports (news articles) into a single, cohesive, and insightful daily briefing. The briefing should be written in a formal, executive style, suitable for a president or CEO.

        Your briefing must contain four distinct sections:
        1.  **Title:** A compelling, newspaper-style headline for the entire briefing.
        2.  **Executive Summary:** A 300-400 word narrative that synthesizes the most critical information. Weave the articles together to identify overarching themes, connections between events, and potential future implications. Do not just list summaries.
        3.  **Key Developments:** A bulleted list of the 3-5 most important individual developments. For each development, provide a concise summary and include the title and URL of the primary source article it is based on.
        4.  **Perspectives:** A section outlining 2-3 different viewpoints on the main topics covered (e.g., economic, political, technological). Summarize each perspective briefly.

        **User Preferences (for prioritization):**
        - Interests (Categories and their importance from 1-5): ${JSON.stringify(preferences.categoryInterests || preferences.interests)}
        - Key Keywords: ${preferences.keywords.join(", ")}

        **Raw Intelligence (Top Articles for Today):**
        ${articlesForPrompt}

        **Your Task:**
        Based on the user's preferences and the provided articles, generate a Presidential Daily Briefing in the specified JSON format.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', // Using a more powerful model for higher quality synthesis
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: briefingSchema,
                temperature: 0.4,
            },
        });

        const result = JSON.parse(response.text);
        console.log('[Briefing] ✅ Presidential Briefing generated successfully');
        return result;

    } catch (error) {
        console.error('[Briefing] ❌ Error generating Presidential Briefing:', error);
        throw new Error('Failed to generate daily briefing.');
    }
};
const urlSummarySchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "The title of the article." },
        summary: { type: Type.STRING, description: "A concise summary of the article's content." },
        keyPoints: {
            type: Type.ARRAY,
            description: "A list of the main key points from the article.",
            items: { type: Type.STRING }
        },
        sourceName: { type: Type.STRING, description: "The name of the website or publication." },
    },
    required: ["title", "summary", "keyPoints", "sourceName"],
};

export const summarizeUrl = async (url: string): Promise<any> => {
    console.log(`[URLSummary] 🌐 Summarizing URL: ${url}`);

    const prompt = `
    Please visit the following URL, read the content of the article, and provide a structured summary.

    URL: ${url}

    Your task is to return a JSON object with the following information:
    - title: The title of the article.
    - summary: A concise summary of the article's content.
    - keyPoints: A list of the main key points from the article.
    - sourceName: The name of the website or publication.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: urlSummarySchema,
                temperature: 0.3,
            },
            tools: [{ googleSearch: {} }],
        });

        const result = JSON.parse(response.text);
        console.log(`[URLSummary] ✅ URL summarized successfully: ${url}`);
        return { ...result, url };
    } catch (error) {
        console.error(`[URLSummary] ❌ Error summarizing URL: ${url}`, error);
        throw new Error('Failed to summarize the URL.');
    }
};

