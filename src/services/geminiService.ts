import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisReport } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeData(rawData: string): Promise<AnalysisReport> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze the following raw data and provide a structured intelligence report.
    
    Data:
    ${rawData}
    
    Follow these Core Directives:
    1. Proactive Analysis: Identify underlying patterns, anomalies, and correlations that a human might miss.
    2. Root Cause Identification: Hypothesize "Why" it is happening based on available data.
    3. Prescriptive Action: Provide a "Next Best Action" for every insight.
    4. Data Extraction: Analyze the report and extract monthly sales data to create a bar chart visualizing monthly sales trends. If the data contains other time-series metrics, include them too. LIMIT TO A MAXIMUM OF 50 DATA POINTS to prevent output truncation. If the monthly sales figures are not explicitly found in the provided data, USE YOUR SEARCH TOOLS to find, analyze, and estimate this data from the internet.

    Analysis Framework:
    - Contextualization: Link current data points to historical benchmarks or industry standards.
    - Predictive Foresight: Use current trends to project potential outcomes if no action is taken.
    - Explainability: Every claim must be backed by a specific data reference from the input.
    
    Output Structure (Strict JSON):
    {
      "executiveSummary": "2-sentence BLUF (Bottom Line Up Front)",
      "criticalAnomalies": ["list of anomalies with data references"],
      "theWhy": "Logic-based explanation of drivers and root causes",
      "actionPlan": ["bulleted list of recommended triggers or workflow adjustments"],
      "confidenceScore": 0-100,
      "salesReview": "Brief 2-3 sentence review and analysis of sales performance, market demand, or revenue trends based on the data.",
      "chartTitle": "Descriptive title for the extracted data (e.g., 'Weekly Sales Trend')",
      "chartData": [{"label": "string (e.g. date or category)", "value": number}]
    }`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          executiveSummary: { type: Type.STRING },
          criticalAnomalies: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          theWhy: { type: Type.STRING },
          actionPlan: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          confidenceScore: { type: Type.NUMBER },
          salesReview: { type: Type.STRING },
          chartTitle: { type: Type.STRING },
          chartData: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                value: { type: Type.NUMBER }
              },
              required: ["label", "value"]
            }
          }
        },
        required: ["executiveSummary", "criticalAnomalies", "theWhy", "actionPlan", "confidenceScore", "salesReview"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Failed to parse Gemini response in analyzeData:", response.text);
    throw new Error("The analysis response was incomplete or malformed. Please try with a smaller dataset or a more specific query.");
  }
}

export async function chatWithAnalyst(report: AnalysisReport, userMessage: string, history: { role: string, content: string }[]): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `You are the "Ozone Co." chatbot for an autonomous digital analyst platform. 
    Your goal is to explain the current intelligence report to the user and answer their queries.
    
    Current Report Context:
    ${JSON.stringify(report, null, 2)}
    
    User Query:
    ${userMessage}
    
    Guidelines:
    1. Be concise, professional, and technical.
    2. Reference specific parts of the report (Executive Summary, Anomalies, etc.) when explaining.
    3. If the user asks about something not in the report, politely state that it's outside the current analytical scope.
    4. Maintain the "Decision-Ready Intelligence" persona.`,
  });

  return response.text;
}

export async function analyzeWebsite(siteData: any): Promise<AnalysisReport> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-pro-preview",
    contents: `Analyze the following website data and provide a structured intelligence report.
    
    Website Data:
    Title: ${siteData.title}
    Description: ${siteData.metaDescription}
    Headings: ${siteData.headings.join(", ")}
    Content: ${siteData.content}
    URL: ${siteData.url}
    
    Follow these Core Directives:
    1. Competitive Positioning: Identify the website's value proposition and target audience.
    2. UX/SEO Audit: Highlight potential friction points or optimization opportunities.
    3. Content Strategy: Analyze the messaging effectiveness and clarity.
    4. Metric Estimation: Analyze the site and extract monthly sales data to create a bar chart visualizing monthly sales trends. If the data is not public, USE YOUR SEARCH TOOLS to research, analyze, and estimate the monthly sales volume and visitors from the internet. You MUST include these metrics in the chartData array.

    Output Structure (Strict JSON):
    {
      "executiveSummary": "2-sentence BLUF (Bottom Line Up Front)",
      "criticalAnomalies": ["list of strategic gaps or technical issues"],
      "theWhy": "Logic-based explanation of the site's market positioning, including insights on their product sales and visitor traffic.",
      "actionPlan": ["bulleted list of recommended improvements or content pivots"],
      "confidenceScore": 0-100,
      "salesReview": "Brief 2-3 sentence review and analysis of the product's sales potential, market demand, and revenue performance based on the website's content.",
      "chartTitle": "Estimated Traffic & Sales Metrics",
      "chartData": [{"label": "string", "value": number}]
    }`,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          executiveSummary: { type: Type.STRING },
          criticalAnomalies: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          theWhy: { type: Type.STRING },
          actionPlan: { 
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          confidenceScore: { type: Type.NUMBER },
          salesReview: { type: Type.STRING },
          chartTitle: { type: Type.STRING },
          chartData: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                value: { type: Type.NUMBER }
              },
              required: ["label", "value"]
            }
          }
        },
        required: ["executiveSummary", "criticalAnomalies", "theWhy", "actionPlan", "confidenceScore", "salesReview"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Failed to parse Gemini response in analyzeWebsite:", response.text);
    throw new Error("The analysis response was incomplete or malformed. Please try with a smaller dataset or a more specific query.");
  }
}
