// src/lib/aiHelper.ts
// AI-powered assistance for missed questions

import OpenAI from 'openai';

interface AIHelpRequest {
  questionText: string;
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
  category: string;
  topic: string;
}

interface AIHelpResponse {
  success: boolean;
  explanation: string;
  keyPoints: string[];
  studyTips: string[];
  relatedTopics: string[];
  error?: string;
}

class AIHelper {
  private openai: OpenAI | null = null;
  private initialized = false;

  constructor() {
    this.initializeOpenAI();
  }

  private initializeOpenAI() {
    try {
      // Only initialize if API key is available
      if (process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
          dangerouslyAllowBrowser: true // Note: In production, use server-side API
        });
        this.initialized = true;
      }
    } catch (error) {
      console.warn('OpenAI not initialized:', error);
    }
  }

  /**
   * Get AI-powered help for a missed question
   */
  async getHelpForMissedQuestion(request: AIHelpRequest): Promise<AIHelpResponse> {
    if (!this.initialized || !this.openai) {
      return this.getFallbackHelp(request);
    }

    try {
      const prompt = this.buildPrompt(request);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are an expert nursing education assistant. Help students understand why they got a question wrong and provide clear, educational explanations. Always be encouraging and supportive.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        return this.getFallbackHelp(request);
      }

      return this.parseAIResponse(response, request);

    } catch (error) {
      console.error('AI Help Error:', error);
      return this.getFallbackHelp(request);
    }
  }

  /**
   * Build prompt for AI assistant
   */
  private buildPrompt(request: AIHelpRequest): string {
    return `
As a nursing education expert, help a student understand this missed question:

QUESTION: ${request.questionText}

CORRECT ANSWER: ${request.correctAnswer}
STUDENT'S ANSWER: ${request.userAnswer}
CATEGORY: ${request.category}
TOPIC: ${request.topic}

PROVIDED EXPLANATION: ${request.explanation}

Please provide:
1. A clear explanation of why the correct answer is right
2. Why the student's answer was incorrect
3. 3 key learning points
4. 3 study tips for this topic
5. 2 related topics to review

Format your response as:
EXPLANATION: [Your explanation]
KEY_POINTS: [Point 1] | [Point 2] | [Point 3]
STUDY_TIPS: [Tip 1] | [Tip 2] | [Tip 3]
RELATED_TOPICS: [Topic 1] | [Topic 2]

Keep it encouraging and educational.
    `;
  }

  /**
   * Parse AI response into structured format
   */
  private parseAIResponse(response: string, request: AIHelpRequest): AIHelpResponse {
    try {
      const lines = response.split('\n').filter(line => line.trim());
      
      let explanation = '';
      let keyPoints: string[] = [];
      let studyTips: string[] = [];
      let relatedTopics: string[] = [];

      for (const line of lines) {
        if (line.startsWith('EXPLANATION:')) {
          explanation = line.replace('EXPLANATION:', '').trim();
        } else if (line.startsWith('KEY_POINTS:')) {
          keyPoints = line.replace('KEY_POINTS:', '').split('|').map(p => p.trim());
        } else if (line.startsWith('STUDY_TIPS:')) {
          studyTips = line.replace('STUDY_TIPS:', '').split('|').map(t => t.trim());
        } else if (line.startsWith('RELATED_TOPICS:')) {
          relatedTopics = line.replace('RELATED_TOPICS:', '').split('|').map(t => t.trim());
        }
      }

      // Fallback to basic parsing if structured format not found
      if (!explanation) {
        explanation = response.slice(0, 300) + '...';
      }

      return {
        success: true,
        explanation: explanation || 'The AI provided helpful insights for this question.',
        keyPoints: keyPoints.length > 0 ? keyPoints : this.getDefaultKeyPoints(request),
        studyTips: studyTips.length > 0 ? studyTips : this.getDefaultStudyTips(request),
        relatedTopics: relatedTopics.length > 0 ? relatedTopics : this.getDefaultRelatedTopics(request)
      };

    } catch (error) {
      console.error('Error parsing AI response:', error);
      return this.getFallbackHelp(request);
    }
  }

  /**
   * Provide fallback help when AI is not available
   */
  private getFallbackHelp(request: AIHelpRequest): AIHelpResponse {
    return {
      success: true,
      explanation: `The correct answer is "${request.correctAnswer}". ${request.explanation}`,
      keyPoints: this.getDefaultKeyPoints(request),
      studyTips: this.getDefaultStudyTips(request),
      relatedTopics: this.getDefaultRelatedTopics(request)
    };
  }

  /**
   * Get default key points based on category and topic
   */
  private getDefaultKeyPoints(request: AIHelpRequest): string[] {
    const defaultPoints = {
      'RN': [
        'Focus on patient safety and evidence-based practice',
        'Consider the nursing process: assess, diagnose, plan, implement, evaluate',
        'Remember to prioritize immediate life-threatening conditions'
      ],
      'RM': [
        'Consider maternal and fetal wellbeing equally',
        'Focus on normal physiological processes vs complications',
        'Remember emergency protocols for obstetric situations'
      ],
      'RPHN': [
        'Think population health vs individual care',
        'Consider prevention and health promotion strategies',
        'Focus on community assessment and intervention'
      ]
    };

    return defaultPoints[request.category as keyof typeof defaultPoints] || defaultPoints['RN'];
  }

  /**
   * Get default study tips
   */
  private getDefaultStudyTips(request: AIHelpRequest): string[] {
    return [
      `Review textbook chapters on ${request.topic}`,
      'Practice similar questions to reinforce learning',
      'Create concept maps linking related topics',
      'Discuss with study group or instructor'
    ];
  }

  /**
   * Get default related topics
   */
  private getDefaultRelatedTopics(request: AIHelpRequest): string[] {
    const relatedTopicsMap = {
      'Basic Patient Care': ['Safety Measures', 'Infection Control'],
      'Pharmacology': ['Drug Interactions', 'Dosage Calculations'],
      'Assessment': ['Physical Examination', 'Health History'],
      'Emergency Care': ['First Aid', 'Crisis Intervention']
    };

    return relatedTopicsMap[request.topic as keyof typeof relatedTopicsMap] || 
           ['Evidence-Based Practice', 'Professional Standards'];
  }

  /**
   * Get study resources for a topic
   */
  async getStudyResources(topic: string, category: string): Promise<string[]> {
    return [
      `${category} Fundamentals Textbook - Chapter on ${topic}`,
      `Professional ${category} Practice Guidelines`,
      `Evidence-Based Research on ${topic}`,
      `Case Studies in ${topic}`,
      `${category} Board Review Questions`
    ];
  }
}

// Export singleton instance
export const aiHelper = new AIHelper();
