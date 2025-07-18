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

export interface ParseError {
  line: number;
  issue: string;
  suggestion: string;
}

export interface ParseResult {
  questions: ParsedQuestion[];
  success: boolean;
  error?: string;
  errors?: ParseError[];
  totalQuestions: number;
  duplicatesFound: number;
  skippedQuestions: number;
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
      const parseResult = this.parseQuestionsFromTextEnhanced(text, examCategory);
      
      return {
        questions: parseResult.questions,
        success: true,
        totalQuestions: parseResult.questions.length,
        duplicatesFound: parseResult.duplicatesFound,
        skippedQuestions: parseResult.skippedQuestions,
        errors: parseResult.errors
      };
      
    } catch (error) {
      console.error('Error parsing DOCX file:', error);
      return {
        questions: [],
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        totalQuestions: 0,
        duplicatesFound: 0,
        skippedQuestions: 0,
        errors: []
      };
    }
  }

  /**
   * Enhanced parsing with error reporting and duplicate detection
   */
  private static parseQuestionsFromTextEnhanced(text: string, examCategory: string): Omit<ParseResult, 'success'> {
    const questions: ParsedQuestion[] = [];
    const errors: ParseError[] = [];
    const questionTexts = new Set<string>(); // For duplicate detection
    let duplicatesFound = 0;
    let skippedQuestions = 0;
    
    // Enhanced patterns to match various formats
    const questionBlocks = text.split(/(?=(?:\d+[\.\)]\s*|Q\d+[\.\:]\s*|Question\s+\d+[\:\.]?\s*|\d+\s+[A-Z]))/i)
      .filter(block => block.trim());
    
    for (let i = 0; i < questionBlocks.length; i++) {
      const block = questionBlocks[i].trim();
      if (!block) continue;
      
      try {
        const parsedQuestion = this.parseQuestionBlockEnhanced(block, examCategory, i + 1, errors);
        if (parsedQuestion) {
          // Check for duplicates
          const questionKey = parsedQuestion.text.toLowerCase().trim();
          if (questionTexts.has(questionKey)) {
            duplicatesFound++;
            errors.push({
              line: i + 1,
              issue: 'Duplicate question detected',
              suggestion: 'Remove or modify this question as it already exists'
            });
            continue;
          }
          
          questionTexts.add(questionKey);
          questions.push(parsedQuestion);
        } else {
          skippedQuestions++;
        }
      } catch (error) {
        skippedQuestions++;
        errors.push({
          line: i + 1,
          issue: 'Failed to parse question',
          suggestion: 'Check question format: ensure it has question text, 4 options (A-D), and correct answer'
        });
      }
    }
    
    return {
      questions,
      errors,
      duplicatesFound,
      skippedQuestions,
      totalQuestions: questions.length
    };
  }

  /**
   * Parse questions from plain text (legacy method)
   */
  private static parseQuestionsFromText(text: string, examCategory: string): ParsedQuestion[] {
    const result = this.parseQuestionsFromTextEnhanced(text, examCategory);
    return result.questions;
  }

  /**
   * Enhanced question block parser with error collection
   */
  private static parseQuestionBlockEnhanced(
    block: string, 
    examCategory: string, 
    questionNumber: number,
    errors: ParseError[]
  ): ParsedQuestion | null {
    try {
      // Use the existing parseQuestionBlock but with error tracking
      const result = this.parseQuestionBlock(block, examCategory, questionNumber);
      
      if (!result) {
        errors.push({
          line: questionNumber,
          issue: 'Could not parse question block',
          suggestion: 'Check question format: ensure it has question text, at least 2 options, and follows standard format'
        });
        return null;
      }
      
      // Additional validation for enhanced parsing
      if (!result.text || result.text.length < 10) {
        errors.push({
          line: questionNumber,
          issue: 'Question text too short',
          suggestion: 'Question text should be at least 10 characters long'
        });
        return null;
      }
      
      const optionCount = Object.keys(result.options).length;
      if (optionCount < 2) {
        errors.push({
          line: questionNumber,
          issue: `Only ${optionCount} options found`,
          suggestion: 'Questions should have at least 2 options, preferably 4 (A-D)'
        });
        return null;
      }
      
      if (optionCount < 4) {
        errors.push({
          line: questionNumber,
          issue: `Only ${optionCount} options found, expected 4`,
          suggestion: 'Consider adding more options for better question quality'
        });
      }
      
      return result;
    } catch (error) {
      errors.push({
        line: questionNumber,
        issue: 'Parse error occurred',
        suggestion: 'Check question format and try again'
      });
      return null;
    }
  }

  /**
   * Parse a single question block with improved format detection
   */
  private static parseQuestionBlock(block: string, examCategory: string, questionNumber: number): ParsedQuestion | null {
    // Enhanced regex to remove various question number formats
    const content = block.replace(/^(?:\d+[\.\)]\s*|Q\d+[\.\:]\s*|Question\s+\d+[\:\.]?\s*|\d+\s+)/i, '').trim();
    
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
