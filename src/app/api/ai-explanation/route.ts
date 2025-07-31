import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function POST(request: NextRequest) {
  try {
    const { question, options, correctAnswer, userAnswer, isCorrect } = await request.json();

    // Validate input
    if (!question || !options || correctAnswer === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!openai) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not configured',
          details: 'Please add your OpenAI API key to the environment variables to enable AI explanations.'
        },
        { status: 503 }
      );
    }

    try {
      const correctOptionText = options[correctAnswer];
      const userAnswerText = userAnswer !== null ? options[userAnswer] : 'No answer selected';

      const prompt = `
As an educational AI assistant for medical exam preparation, provide a well-formatted explanation for this question.

**Question:** ${question}

**Options:**
${options.map((option: string, index: number) => `${String.fromCharCode(65 + index)}. ${option}`).join('\n')}

**Correct Answer:** ${correctOptionText}
**Student's Answer:** ${userAnswerText}
**Result:** ${isCorrect ? 'Correct ✅' : 'Incorrect ❌'}

Please provide a comprehensive but concise explanation (maximum 350 words) using this exact markdown format:

## ${isCorrect ? '🎉 Excellent Work!' : '📚 Learning Opportunity'}

### Why This Answer Is Correct
[2-3 sentences explaining the medical/nursing rationale behind the correct answer]

${!isCorrect ? `### Why Your Answer Was Incorrect
[1-2 sentences explaining the clinical reasoning why the selected answer was wrong]

` : ''}### Key Learning Points
• **[Clinical concept 1]:** Brief explanation
• **[Clinical concept 2]:** Brief explanation  
• **[Clinical concept 3]:** Brief explanation

### Study Tips
• [Specific study suggestion related to this medical topic]
• [Practice or review recommendation with resources]

### Remember
[One encouraging sentence emphasizing the importance of understanding this concept in clinical practice]

**Rules:**
- Use proper markdown headers (##, ###)
- Use bullet points with • symbol
- Bold important medical terms with **text**
- Keep medical explanations accurate and evidence-based
- Stay under 350 words total
- Focus on clinical reasoning and patient safety
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert medical education assistant. Provide clear, well-formatted explanations using markdown. Focus on helping nursing and medical students understand concepts thoroughly. Keep responses under 350 words but comprehensive."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 600,
        temperature: 0.7,
      });

      const explanation = completion.choices[0]?.message?.content || '';
      
      if (!explanation) {
        return NextResponse.json(
          { 
            error: 'Empty response from OpenAI',
            details: 'OpenAI returned an empty response. Please try again.'
          },
          { status: 502 }
        );
      }

      // Validate word count (approximately 350 words = 2150 characters)
      const wordCount = explanation.trim().split(/\s+/).length;
      if (wordCount > 350) {
        console.warn(`AI explanation exceeded word limit: ${wordCount} words`);
        // Truncate if too long and add note
        const words = explanation.trim().split(/\s+/);
        const truncatedExplanation = words.slice(0, 350).join(' ') + 
          '\n\n*Note: Explanation was truncated to meet length requirements.*';
        
        return NextResponse.json({ 
          explanation: truncatedExplanation,
          wordCount: 350,
          truncated: true
        });
      }

      return NextResponse.json({ 
        explanation,
        wordCount,
        truncated: false
      });

    } catch (aiError: any) {
      console.error('OpenAI API error:', aiError);
      
      // Return detailed OpenAI error information
      let errorMessage = 'OpenAI API Error';
      let errorDetails = aiError.message || 'Unknown OpenAI error occurred';
      
      if (aiError.status) {
        errorMessage = `OpenAI API Error (${aiError.status})`;
      }
      
      if (aiError.code) {
        errorDetails = `Error Code: ${aiError.code} - ${errorDetails}`;
      }

      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails,
          openaiError: true
        },
        { status: 502 }
      );
    }

  } catch (error: any) {
    console.error('AI explanation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate explanation',
        details: error.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
