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

    let explanation = '';

    // Try to get AI explanation if OpenAI is available
    if (openai) {
      try {
        const correctOptionText = options[correctAnswer];
        const userAnswerText = userAnswer !== null ? options[userAnswer] : 'No answer selected';

        const prompt = `
As an educational AI assistant, provide a clear and helpful explanation for this exam question.

Question: ${question}

Options:
${options.map((option: string, index: number) => `${index + 1}. ${option}`).join('\n')}

Correct Answer: ${correctOptionText}
Student's Answer: ${userAnswerText}
Result: ${isCorrect ? 'Correct' : 'Incorrect'}

Please provide:
1. A brief explanation of why the correct answer is right
2. If the student got it wrong, explain why their answer was incorrect
3. Key learning points to remember
4. Encouragement and study tips

Keep the explanation concise but educational, suitable for helping the student learn.
`;

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful educational assistant that provides clear, encouraging explanations for exam questions. Focus on helping students learn and understand concepts."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 300,
          temperature: 0.7,
        });

        explanation = completion.choices[0]?.message?.content || '';
      } catch (aiError) {
        console.error('OpenAI API error:', aiError);
        // Fall back to basic explanation
      }
    }

    // Fallback explanation if AI is not available or failed
    if (!explanation) {
      const correctOptionText = options[correctAnswer];
      const userAnswerText = userAnswer !== null ? options[userAnswer] : 'No answer selected';
      
      if (isCorrect) {
        explanation = `🎉 **Excellent work!** You selected the correct answer: "${correctOptionText}"

**Why this is correct:** This option best addresses the question requirements and demonstrates your understanding of the key concepts.

**Key Learning Point:** Continue to apply this level of critical thinking to similar questions.

**Study Tip:** Review related topics to strengthen your knowledge foundation.`;
      } else {
        explanation = `**Correct Answer:** ${correctOptionText}

**Your Answer:** ${userAnswerText}

**Why the correct answer is right:** This option accurately addresses the question requirements and reflects the proper understanding of the concept.

${userAnswer !== null ? `**Why your answer was incorrect:** While this option may seem plausible, it doesn't fully meet the criteria outlined in the question.` : '**Remember:** Always read questions carefully and eliminate obviously incorrect options first.'}

**Study Tip:** Review the fundamental concepts related to this topic and practice similar questions to improve your understanding.`;
      }
    }

    return NextResponse.json({ explanation });

  } catch (error) {
    console.error('AI explanation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}
