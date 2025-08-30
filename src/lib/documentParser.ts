// src/lib/documentParser.ts
import mammoth from "mammoth";

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
  static async parseDocxFile(
    file: File,
    examCategory: string
  ): Promise<ParseResult> {
    try {
      // Convert file to ArrayBuffer then to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Extract text from DOCX
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value;

      // Parse questions from the extracted text
      const parseResult = this.parseQuestionsFromTextEnhanced(
        text,
        examCategory
      );

      return {
        questions: parseResult.questions,
        success: true,
        totalQuestions: parseResult.questions.length,
        duplicatesFound: parseResult.duplicatesFound,
        skippedQuestions: parseResult.skippedQuestions,
        errors: parseResult.errors,
      };
    } catch (error) {
      console.error("Error parsing DOCX file:", error);
      return {
        questions: [],
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        totalQuestions: 0,
        duplicatesFound: 0,
        skippedQuestions: 0,
        errors: [],
      };
    }
  }

  /**
   * Enhanced parsing with error reporting and duplicate detection
   */
  private static parseQuestionsFromTextEnhanced(
    text: string,
    examCategory: string
  ): Omit<ParseResult, "success"> {
    const questions: ParsedQuestion[] = [];
    const errors: ParseError[] = [];
    const questionTexts = new Set<string>(); // For duplicate detection
    let duplicatesFound = 0;
    let skippedQuestions = 0;

    // Split by "Question" keyword to get individual question blocks
    const questionBlocks = text
      .split(/(?=Question\s+\d+:)/i)
      .filter((block) => block.trim());

    for (let i = 0; i < questionBlocks.length; i++) {
      const block = questionBlocks[i].trim();
      if (!block) continue;

      try {
        const parsedQuestion = this.parseQuestionBlockEnhanced(
          block,
          examCategory,
          i + 1,
          errors
        );
        if (parsedQuestion) {
          // Check for duplicates
          const questionKey = parsedQuestion.text.toLowerCase().trim();
          if (questionTexts.has(questionKey)) {
            duplicatesFound++;
            errors.push({
              line: i + 1,
              issue: "Duplicate question detected",
              suggestion: "Remove or modify this question as it already exists",
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
          issue: "Failed to parse question",
          suggestion:
            "Check question format: ensure it has question text, 4 options (A-D), and correct answer",
        });
      }
    }

    return {
      questions,
      errors,
      duplicatesFound,
      skippedQuestions,
      totalQuestions: questions.length,
    };
  }

  /**
   * Parse questions from plain text (legacy method)
   */
  private static parseQuestionsFromText(
    text: string,
    examCategory: string
  ): ParsedQuestion[] {
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
      const result = this.parseQuestionBlock(
        block,
        examCategory,
        questionNumber
      );

      if (!result) {
        errors.push({
          line: questionNumber,
          issue: "Could not parse question block",
          suggestion:
            "Check question format: ensure it has question text, at least 2 options, and follows standard format",
        });
        return null;
      }

      // Additional validation for enhanced parsing
      if (!result.text || result.text.length < 10) {
        errors.push({
          line: questionNumber,
          issue: "Question text too short",
          suggestion: "Question text should be at least 10 characters long",
        });
        return null;
      }

      const optionCount = Object.keys(result.options).length;
      if (optionCount < 2) {
        errors.push({
          line: questionNumber,
          issue: `Only ${optionCount} options found`,
          suggestion:
            "Questions should have at least 2 options, preferably 4 (A-D)",
        });
        return null;
      }

      if (optionCount < 4) {
        errors.push({
          line: questionNumber,
          issue: `Only ${optionCount} options found, expected 4`,
          suggestion:
            "Consider adding more options for better question quality",
        });
      }

      return result;
    } catch (error) {
      errors.push({
        line: questionNumber,
        issue: "Parse error occurred",
        suggestion: "Check question format and try again",
      });
      return null;
    }
  }

  /**
   * Parse a single question block with improved format detection for ** correct answer format
   */
  private static parseQuestionBlock(
    block: string,
    examCategory: string,
    questionNumber: number
  ): ParsedQuestion | null {
    // Clean up the block - remove extra whitespace and normalize line breaks
    const cleanBlock = block.replace(/\s+/g, " ").trim();

    // Remove "Question X:" prefix if present
    const content = cleanBlock.replace(/^Question\s+\d+:\s*/i, "").trim();

    if (!content) {
      return null;
    }

    // Find where options start (first occurrence of a) or b) etc.)
    const optionPattern = /\b[a-d]\)\s*/i;
    const firstOptionMatch = content.match(optionPattern);

    if (!firstOptionMatch) {
      return null;
    }

    const firstOptionIndex = content.indexOf(firstOptionMatch[0]);

    // Extract question text (everything before first option)
    const questionText = content.substring(0, firstOptionIndex).trim();

    if (!questionText || questionText.length < 5) {
      return null;
    }

    // Extract options part
    const optionsText = content.substring(firstOptionIndex);

    // Split by option markers to get individual options
    const optionParts = optionsText
      .split(/\b[a-d]\)\s*/i)
      .filter((part) => part.trim());

    const options: string[] = [];
    let correctAnswer = 0;

    for (let i = 0; i < optionParts.length && i < 4; i++) {
      let optionText = optionParts[i].trim();

      // Check if this option is marked as correct with **
      if (optionText.includes("**")) {
        correctAnswer = i; // Store the index (0-based)
        optionText = optionText.replace(/\*\*/g, "").trim(); // Remove ** markers
      }

      // Clean up option text - remove any trailing parts that look like next question or options
      optionText = optionText.split(/\b[a-d]\)/i)[0].trim();
      optionText = optionText.split(/Question\s+\d+:/i)[0].trim();

      if (optionText) {
        options.push(optionText);
      }
    }

    if (options.length < 2) {
      return null;
    }

    // Ensure correct answer index is valid
    correctAnswer = Math.max(0, Math.min(correctAnswer, options.length - 1));

    // Determine difficulty based on question complexity
    const difficulty = this.determineDifficulty(questionText, options);

    return {
      id: `${examCategory}-q${questionNumber}-${Date.now()}`,
      text: questionText,
      options,
      correctAnswer,
      explanation: undefined, // No explanation in this format
      category: examCategory,
      difficulty,
    };
  }

  /**
   * Determine question difficulty based on content analysis
   */
  private static determineDifficulty(
    questionText: string,
    options: string[]
  ): string {
    const text = (questionText + " " + options.join(" ")).toLowerCase();

    // Advanced keywords indicate higher difficulty
    const advancedKeywords = [
      "pathophysiology",
      "contraindication",
      "adverse effect",
      "mechanism",
      "differential diagnosis",
      "pharmacokinetics",
      "contraindicated",
      "priority",
      "most appropriate",
      "best intervention",
      "most likely",
    ];

    // Basic keywords indicate lower difficulty
    const basicKeywords = [
      "normal",
      "basic",
      "standard",
      "routine",
      "common",
      "typical",
      "first",
      "initial",
      "primary",
    ];

    const hasAdvanced = advancedKeywords.some((keyword) =>
      text.includes(keyword)
    );
    const hasBasic = basicKeywords.some((keyword) => text.includes(keyword));

    if (hasAdvanced) return "Advanced";
    if (hasBasic) return "Beginner";
    return "Intermediate";
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
        errors.push("Question text is too short");
      }

      if (question.options.length < 2) {
        errors.push("Must have at least 2 options");
      }

      if (
        question.correctAnswer < 0 ||
        question.correctAnswer >= question.options.length
      ) {
        errors.push("Invalid correct answer index");
      }

      if (question.options.some((opt) => !opt || opt.length < 1)) {
        errors.push("All options must have text");
      }

      if (errors.length === 0) {
        valid.push(question);
      } else {
        invalid.push({ question, errors });
      }
    }

    return { valid, invalid };
  }
}

export default DocumentParser;
