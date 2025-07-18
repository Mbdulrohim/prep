// src/lib/documentParser.ts
import mammoth from 'mammoth';

export interface ParsedQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  category?: string;
  difficulty?: string;
}

export interface ParseResult {
  questions: ParsedQuestion[];
  success: boolean;
  error?: string;
  totalQuestions: number;
}

export class DocumentParser {
  
  /**
   * Parse a DOCX file and extract questions
   */
  static async parseDocxFile(file: File, examCategory: string): Promise<ParseResult> {
    try {
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Extract text from DOCX
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value;
      
      // Parse questions from the extracted text
      const questions = this.parseQuestionsFromText(text, examCategory);
      
      return {
        questions,
        success: true,
        totalQuestions: questions.length
      };
      
    } catch (error) {
      console.error('Error parsing DOCX file:', error);
      return {
        questions: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        totalQuestions: 0
      };
    }
  }

  /**
   * Parse questions from plain text
   */
  private static parseQuestionsFromText(text: string, examCategory: string): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];
    
    // Split text into potential question blocks
    // Look for patterns like "1.", "2.", "Question 1:", etc.
    const questionBlocks = text.split(/(?=\d+\.|Question\s+\d+)/i).filter(block => block.trim());
    
    for (let i = 0; i < questionBlocks.length; i++) {
      const block = questionBlocks[i].trim();
      if (!block) continue;
      
      try {
        const parsedQuestion = this.parseQuestionBlock(block, examCategory, i + 1);
        if (parsedQuestion) {
          questions.push(parsedQuestion);
        }
      } catch (error) {
        console.warn(`Failed to parse question block ${i + 1}:`, error);
      }
    }
    
    return questions;
  }

  /**
   * Parse a single question block
   */
  private static parseQuestionBlock(block: string, examCategory: string, questionNumber: number): ParsedQuestion | null {
    // Remove question number prefix
    const content = block.replace(/^\d+\.\s*|^Question\s+\d+:?\s*/i, '').trim();
    
    // Split into lines
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    if (lines.length < 5) { // Need at least question + 4 options
      return null;
    }
    
    // Extract question text (everything before the first option)
    let questionText = '';
    let optionStartIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line looks like an option (A), (B), A., B., etc.
      if (/^[A-Z]\)|\([A-Z]\)|^[A-Z]\./.test(line)) {
        optionStartIndex = i;
        break;
      }
      
      questionText += (questionText ? ' ' : '') + line;
    }
    
    if (optionStartIndex === -1 || !questionText) {
      return null;
    }
    
    // Extract options
    const options: string[] = [];
    let explanationStartIndex = -1;
    
    for (let i = optionStartIndex; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is an option line
      if (/^[A-Z]\)|\([A-Z]\)|^[A-Z]\./.test(line)) {
        // Remove the option prefix and add to options
        const optionText = line.replace(/^[A-Z]\)|\([A-Z]\)|^[A-Z]\./, '').trim();
        options.push(optionText);
      } else if (line.toLowerCase().includes('answer:') || 
                 line.toLowerCase().includes('explanation:') ||
                 line.toLowerCase().includes('rationale:')) {
        explanationStartIndex = i;
        break;
      } else if (options.length >= 4) {
        // If we have 4 options and encounter a non-option line, it might be explanation
        explanationStartIndex = i;
        break;
      }
    }
    
    if (options.length < 2) {
      return null;
    }
    
    // Extract correct answer and explanation
    let correctAnswer = 0; // Default to first option
    let explanation = '';
    
    if (explanationStartIndex !== -1) {
      const explanationLines = lines.slice(explanationStartIndex);
      const explanationText = explanationLines.join(' ');
      
      // Look for answer indicators
      const answerMatch = explanationText.match(/answer[:\s]*([A-D])/i);
      if (answerMatch) {
        const answerLetter = answerMatch[1].toUpperCase();
        correctAnswer = answerLetter.charCodeAt(0) - 'A'.charCodeAt(0);
      }
      
      // Extract explanation text
      explanation = explanationText
        .replace(/answer[:\s]*[A-D]/i, '')
        .replace(/explanation[:\s]*/i, '')
        .replace(/rationale[:\s]*/i, '')
        .trim();
    }
    
    // Determine difficulty based on question complexity
    const difficulty = this.determineDifficulty(questionText, options);
    
    return {
      id: `${examCategory}-q${questionNumber}-${Date.now()}`,
      text: questionText,
      options,
      correctAnswer: Math.max(0, Math.min(correctAnswer, options.length - 1)),
      explanation: explanation || undefined,
      category: examCategory,
      difficulty
    };
  }

  /**
   * Determine question difficulty based on content analysis
   */
  private static determineDifficulty(questionText: string, options: string[]): string {
    const text = (questionText + ' ' + options.join(' ')).toLowerCase();
    
    // Advanced keywords indicate higher difficulty
    const advancedKeywords = [
      'pathophysiology', 'contraindication', 'adverse effect', 'mechanism',
      'differential diagnosis', 'pharmacokinetics', 'contraindicated',
      'priority', 'most appropriate', 'best intervention', 'most likely'
    ];
    
    // Basic keywords indicate lower difficulty
    const basicKeywords = [
      'normal', 'basic', 'standard', 'routine', 'common', 'typical',
      'first', 'initial', 'primary'
    ];
    
    const hasAdvanced = advancedKeywords.some(keyword => text.includes(keyword));
    const hasBasic = basicKeywords.some(keyword => text.includes(keyword));
    
    if (hasAdvanced) return 'Advanced';
    if (hasBasic) return 'Beginner';
    return 'Intermediate';
  }

  /**
   * Validate parsed questions
   */
  static validateQuestions(questions: ParsedQuestion[]): {
    valid: ParsedQuestion[];
    invalid: Array<{ question: ParsedQuestion; errors: string[] }>;
  } {
    const valid: ParsedQuestion[] = [];
    const invalid: Array<{ question: ParsedQuestion; errors: string[] }> = [];
    
    for (const question of questions) {
      const errors: string[] = [];
      
      if (!question.text || question.text.length < 10) {
        errors.push('Question text is too short');
      }
      
      if (question.options.length < 2) {
        errors.push('Must have at least 2 options');
      }
      
      if (question.correctAnswer < 0 || question.correctAnswer >= question.options.length) {
        errors.push('Invalid correct answer index');
      }
      
      if (question.options.some(opt => !opt || opt.length < 1)) {
        errors.push('All options must have text');
      }
      
      if (errors.length === 0) {
        valid.push(question);
      } else {
        invalid.push({ question, errors });
      }
    }
    
    return { valid, invalid };
  }

  /**
   * Generate sample question for testing
   */
  static generateSampleQuestion(examCategory: string): ParsedQuestion {
    return {
      id: `${examCategory}-sample-${Date.now()}`,
      text: `Sample nursing question for ${examCategory}. What is the most appropriate intervention for a patient experiencing acute pain?`,
      options: [
        'Administer prescribed analgesics immediately',
        'Wait for physician orders before any intervention',
        'Apply ice to the affected area without assessment',
        'Encourage patient to tolerate the pain'
      ],
      correctAnswer: 0,
      explanation: 'Administering prescribed analgesics is the most appropriate intervention as it provides immediate relief while following established protocols.',
      category: examCategory,
      difficulty: 'Intermediate'
    };
  }
}
