import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

interface RMQuestion {
  questionText: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
    E?: string;
  };
  correctAnswer: string;
  explanation?: string;
  category: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  references?: string;
  tags?: string[];
}

export async function POST(request: NextRequest) {
  try {
    console.log('📄 DOCX parsing request received');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const paper = formData.get('paper') as string;

    console.log('File received:', file?.name, 'Size:', file?.size, 'Type:', file?.type);
    console.log('Paper:', paper);

    if (!file) {
      console.log('❌ No file provided');
      return NextResponse.json({
        success: false,
        error: 'No file provided'
      }, { status: 400 });
    }

    if (!file.name.endsWith('.docx')) {
      console.log('❌ Invalid file type:', file.type);
      return NextResponse.json({
        success: false,
        error: 'Only DOCX files are supported'
      }, { status: 400 });
    }

    console.log('🔄 Converting file to buffer...');
    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log('📖 Extracting text from DOCX...');
    // Extract text from DOCX
    let text = '';
    try {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      console.log('✅ Text extracted successfully, length:', text.length);
    } catch (mammothError) {
      console.error('❌ Mammoth extraction failed:', mammothError);
      return NextResponse.json({
        success: false,
        error: 'Failed to read DOCX file. Please ensure the file is not corrupted.'
      }, { status: 400 });
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No text content found in the DOCX file'
      }, { status: 400 });
    }

    console.log('🔍 Parsing questions from text...');
    // Parse questions from text
    const questions = parseQuestionsFromText(text);

    if (questions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid questions found in the document. Please check the format.'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        questions,
        paper,
        totalParsed: questions.length
      },
      message: `Successfully parsed ${questions.length} questions from DOCX`
    });
  } catch (error) {
    console.error('Error parsing DOCX:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to parse DOCX file'
    }, { status: 500 });
  }
}

function parseQuestionsFromText(text: string): RMQuestion[] {
  const questions: RMQuestion[] = [];
  
  // Split by "Question" to get individual question blocks
  const questionBlocks = text.split(/Question\s+\d+:/i).filter(block => block.trim());
  
  console.log(`📊 Found ${questionBlocks.length} question blocks`);
  
  for (let i = 0; i < questionBlocks.length; i++) {
    try {
      const block = questionBlocks[i].trim();
      if (!block) continue;
      
      const lines = block.split('\n').map(line => line.trim()).filter(line => line);
      if (lines.length < 5) continue; // Need at least question + 4 options
      
      // First non-empty line is the question text
      const questionText = lines[0];
      
      // Find options (A), B), C), D), E))
      const options: any = {};
      let correctAnswer = '';
      let explanationIndex = -1;
      
      for (let j = 1; j < lines.length; j++) {
        const line = lines[j];
        
        // Check if this is an option line
        const optionMatch = line.match(/^([A-E])\)\s*(.+)$/i);
        if (optionMatch) {
          const optionLetter = optionMatch[1].toUpperCase();
          let optionText = optionMatch[2];
          
          // Check if this option is marked as correct with **
          if (optionText.includes('**')) {
            correctAnswer = optionLetter;
            optionText = optionText.replace(/\*\*/g, '').trim();
          }
          
          options[optionLetter] = optionText;
        } else if (line.toLowerCase().startsWith('explanation:')) {
          explanationIndex = j;
          break;
        }
      }
      
      // Validate that we have required options
      if (!options.A || !options.B || !options.C || !options.D) {
        console.log(`⚠️  Question ${i + 1}: Missing required options`);
        continue;
      }
      
      if (!correctAnswer) {
        console.log(`⚠️  Question ${i + 1}: No correct answer marked with **`);
        continue;
      }
      
      // Extract explanation if present
      let explanation = '';
      if (explanationIndex > -1 && explanationIndex < lines.length) {
        explanation = lines[explanationIndex].replace(/^explanation:\s*/i, '').trim();
      }
      
      // Create question object
      const question: RMQuestion = {
        questionText: questionText,
        options: {
          A: options.A,
          B: options.B,
          C: options.C,
          D: options.D,
          E: options.E || undefined
        },
        correctAnswer,
        explanation: explanation || undefined,
        category: 'General', // Default category, can be updated manually
        topic: 'General',
        difficulty: 'medium', // Default difficulty
        references: undefined,
        tags: []
      };
      
      questions.push(question);
      console.log(`✅ Parsed question ${i + 1}: "${questionText.substring(0, 50)}..."`);
      
    } catch (error) {
      console.error(`❌ Error parsing question block ${i + 1}:`, error);
      continue;
    }
  }
  
  console.log(`🎉 Successfully parsed ${questions.length} questions`);
  return questions;
}

function parseQuestionBlock(block: string): RMQuestion | null {
  const lines = block.split('\n').map(line => line.trim()).filter(line => line);
  
  if (lines.length < 7) return null; // Need at least question + 4 options + answer + category
  
  let questionText = '';
  const options: any = {};
  let correctAnswer = '';
  let category = 'General';
  let topic = '';
  let difficulty: 'easy' | 'medium' | 'hard' = 'medium';
  let explanation = '';
  let references = '';
  let tags: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Extract question text
    if (line.match(/^Question \d+:/i)) {
      questionText = line.replace(/^Question \d+:\s*/i, '');
      continue;
    }
    
    // Extract options
    const optionMatch = line.match(/^([A-E])\)\s*(.+)$/);
    if (optionMatch) {
      options[optionMatch[1]] = optionMatch[2];
      continue;
    }
    
    // Extract correct answer
    if (line.match(/^Correct Answer:\s*/i)) {
      correctAnswer = line.replace(/^Correct Answer:\s*/i, '').trim().toUpperCase();
      continue;
    }
    
    // Extract category
    if (line.match(/^Category:\s*/i)) {
      category = line.replace(/^Category:\s*/i, '');
      continue;
    }
    
    // Extract topic
    if (line.match(/^Topic:\s*/i)) {
      topic = line.replace(/^Topic:\s*/i, '');
      continue;
    }
    
    // Extract difficulty
    if (line.match(/^Difficulty:\s*/i)) {
      const diff = line.replace(/^Difficulty:\s*/i, '').toLowerCase();
      if (['easy', 'medium', 'hard'].includes(diff)) {
        difficulty = diff as 'easy' | 'medium' | 'hard';
      }
      continue;
    }
    
    // Extract explanation
    if (line.match(/^Explanation:\s*/i)) {
      explanation = line.replace(/^Explanation:\s*/i, '');
      continue;
    }
    
    // Extract references
    if (line.match(/^References:\s*/i)) {
      references = line.replace(/^References:\s*/i, '');
      continue;
    }
    
    // Extract tags
    if (line.match(/^Tags:\s*/i)) {
      const tagString = line.replace(/^Tags:\s*/i, '');
      tags = tagString.split(',').map(tag => tag.trim()).filter(tag => tag);
      continue;
    }
    
    // If no match and we haven't found question text yet, it might be part of question
    if (!questionText && !line.match(/^[A-E]\)/)) {
      questionText = line;
    }
  }
  
  // Validate required fields
  if (!questionText || !options.A || !options.B || !options.C || !options.D || !correctAnswer) {
    return null;
  }
  
  return {
    questionText,
    options: {
      A: options.A,
      B: options.B,
      C: options.C,
      D: options.D,
      E: options.E || undefined
    },
    correctAnswer,
    explanation: explanation || undefined,
    category,
    topic,
    difficulty,
    references: references || undefined,
    tags: tags.length > 0 ? tags : undefined
  };
}
