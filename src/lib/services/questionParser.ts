import fs from 'fs';
import path from 'path';
import { rmQuestionService, CreateQuestionData } from './rmQuestionService';

interface ParsedQuestion {
  questionNumber: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export class QuestionParser {
  /**
   * Parse questions from text file
   */
  static parseQuestionsFromFile(filePath: string): ParsedQuestion[] {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return this.parseQuestionsFromText(content);
    } catch (error) {
      console.error('Error reading questions file:', error);
      throw new Error('Failed to read questions file');
    }
  }

  /**
   * Parse questions from text content
   */
  static parseQuestionsFromText(content: string): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);

    let currentQuestion: Partial<ParsedQuestion> | null = null;
    let currentOptions: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Skip bullet points and empty lines
      if (line === '•' || line === '' || line.length === 0) {
        continue;
      }
      
      // Check if this is a question line
      const questionMatch = line.match(/Question\s+(\d+):/i);
      if (questionMatch) {
        // Save previous question if exists
        if (currentQuestion && currentQuestion.questionText && currentOptions.length >= 4) {
          questions.push({
            questionNumber: currentQuestion.questionNumber!,
            questionText: currentQuestion.questionText,
            options: [...currentOptions],
            correctAnswer: this.findCorrectAnswer(currentOptions),
            explanation: currentQuestion.explanation
          });
        }
        
        // Start new question
        currentQuestion = {
          questionNumber: parseInt(questionMatch[1])
        };
        currentOptions = [];
        continue;
      }
      
      // Check if this is the question text (line after Question X:)
      if (currentQuestion && !currentQuestion.questionText && !line.match(/^[a-d]\)/i)) {
        currentQuestion.questionText = line.replace(/^•\s*/, '');
        continue;
      }
      
      // Check if this is an option (a), b), c), d))
      const optionMatch = line.match(/^([a-d])\)\s*(.+)$/i);
      if (optionMatch && currentQuestion) {
        const optionText = optionMatch[2].replace(/\*\*$/, ''); // Remove ** marker
        currentOptions.push(optionText);
        continue;
      }
      
      // If we have accumulated question text but this doesn't match option pattern,
      // it might be a continuation of the question text
      if (currentQuestion && currentQuestion.questionText && !line.match(/^[a-d]\)/i)) {
        currentQuestion.questionText += ' ' + line.replace(/^•\s*/, '');
      }
    }
    
    // Don't forget the last question
    if (currentQuestion && currentQuestion.questionText && currentOptions.length >= 4) {
      questions.push({
        questionNumber: currentQuestion.questionNumber!,
        questionText: currentQuestion.questionText,
        options: [...currentOptions],
        correctAnswer: this.findCorrectAnswer(currentOptions),
        explanation: currentQuestion.explanation
      });
    }
    
    return questions;
  }

  /**
   * Find the correct answer from options (marked with **)
   */
  private static findCorrectAnswer(options: string[]): string {
    for (let i = 0; i < options.length; i++) {
      if (options[i].includes('**')) {
        // Clean the option text and return the letter
        options[i] = options[i].replace(/\*\*/g, '').trim();
        return String.fromCharCode(65 + i); // Convert 0,1,2,3 to A,B,C,D
      }
    }
    
    // If no ** marker found, default to A
    console.warn('No correct answer marker found, defaulting to A');
    return 'A';
  }

  /**
   * Convert parsed questions to CreateQuestionData format
   */
  static convertToQuestionData(parsedQuestions: ParsedQuestion[]): CreateQuestionData[] {
    return parsedQuestions.map(q => ({
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || `This is question ${q.questionNumber} from the RM exam bank.`,
      category: 'RM',
      subcategory: this.categorizeQuestion(q.questionText),
      difficulty: 'medium' as const
    }));
  }

  /**
   * Categorize question based on content
   */
  private static categorizeQuestion(questionText: string): string {
    const text = questionText.toLowerCase();
    
    if (text.includes('antenatal') || text.includes('prenatal') || text.includes('pregnancy')) {
      return 'Antenatal Care';
    } else if (text.includes('labor') || text.includes('labour') || text.includes('delivery') || text.includes('birth')) {
      return 'Labor and Delivery';
    } else if (text.includes('postnatal') || text.includes('postpartum') || text.includes('breastfeeding') || text.includes('lactation')) {
      return 'Postnatal Care';
    } else if (text.includes('newborn') || text.includes('neonatal') || text.includes('baby')) {
      return 'Neonatal Care';
    } else if (text.includes('family planning') || text.includes('contraception') || text.includes('contraceptive')) {
      return 'Family Planning';
    } else if (text.includes('gynecolog') || text.includes('menstrual') || text.includes('menopause')) {
      return 'Gynecology';
    } else if (text.includes('complication') || text.includes('emergency') || text.includes('hemorrhage')) {
      return 'Emergency Care';
    } else {
      return 'General Midwifery';
    }
  }

  /**
   * Extract relevant tags from question text
   */
  private static extractTags(questionText: string): string[] {
    const text = questionText.toLowerCase();
    const tags: string[] = [];
    
    // Medical conditions and topics
    const tagMap: Record<string, string[]> = {
      'assessment': ['assessment', 'evaluation', 'examination'],
      'vital signs': ['blood pressure', 'heart rate', 'pulse', 'temperature'],
      'medication': ['drug', 'medication', 'supplement', 'iron', 'folic acid'],
      'screening': ['screening', 'test', 'glucose', 'diabetes'],
      'immunization': ['vaccine', 'immunization', 'tetanus', 'pertussis'],
      'complications': ['complication', 'bleeding', 'hemorrhage', 'preeclampsia'],
      'fetal development': ['fetal', 'fetus', 'development', 'growth'],
      'nutrition': ['nutrition', 'diet', 'food', 'calcium', 'protein'],
      'education': ['education', 'counseling', 'advice', 'instruction']
    };
    
    for (const [tag, keywords] of Object.entries(tagMap)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        tags.push(tag);
      }
    }
    
    return tags.length > 0 ? tags : ['general'];
  }

  /**
   * Import questions from file to database
   */
  static async importQuestionsFromFile(filePath: string): Promise<{
    imported: number;
    failed: number;
    errors: string[];
  }> {
    try {
      console.log('Parsing questions from file...');
      const parsedQuestions = this.parseQuestionsFromFile(filePath);
      console.log(`Parsed ${parsedQuestions.length} questions`);
      
      const questionData = this.convertToQuestionData(parsedQuestions);
      console.log('Converting to database format...');
      
      const result = await rmQuestionService.bulkImportQuestions(questionData);
      console.log(`Import complete: ${result.imported} imported, ${result.failed} failed`);
      
      return result;
    } catch (error) {
      console.error('Error importing questions:', error);
      throw new Error('Failed to import questions from file');
    }
  }

  /**
   * Preview parsed questions (for testing)
   */
  static previewQuestions(filePath: string, count: number = 5): void {
    try {
      const parsedQuestions = this.parseQuestionsFromFile(filePath);
      const questionData = this.convertToQuestionData(parsedQuestions);
      
      console.log(`\n📋 Preview of ${Math.min(count, questionData.length)} questions:\n`);
      
      questionData.slice(0, count).forEach((q, index) => {
        console.log(`Question ${index + 1}:`);
        console.log(`Text: ${q.questionText}`);
        console.log(`Options: ${q.options.join(', ')}`);
        console.log(`Correct: ${q.correctAnswer}`);
        console.log(`Subcategory: ${q.subcategory}`);
        console.log('---');
      });
      
      console.log(`\nTotal questions parsed: ${questionData.length}`);
    } catch (error) {
      console.error('Error previewing questions:', error);
    }
  }
}
