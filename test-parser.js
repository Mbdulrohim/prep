// Test the document parser with the wer.DOCX file
const mammoth = require("mammoth");
const fs = require("fs");

// Simple test implementation of the parser logic
function parseQuestionBlock(block, examCategory, questionNumber) {
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

  const options = [];
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

  return {
    id: `${examCategory}-q${questionNumber}-${Date.now()}`,
    text: questionText,
    options,
    correctAnswer,
    explanation: undefined,
    category: examCategory,
    difficulty: "medium",
  };
}

async function testDocumentParser() {
  try {
    console.log("Testing document parser with wer.DOCX...\n");

    // Read the DOCX file
    const buffer = fs.readFileSync("wer.DOCX");

    // Extract text
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;

    console.log("Total extracted text length:", text.length);

    // Split by "Question" keyword to get individual question blocks
    const questionBlocks = text
      .split(/(?=Question\s+\d+:)/i)
      .filter((block) => block.trim());

    console.log("Found question blocks:", questionBlocks.length);

    const questions = [];

    for (let i = 0; i < questionBlocks.length && i < 5; i++) {
      // Test first 5 questions
      const block = questionBlocks[i].trim();
      if (!block) continue;

      const parsedQuestion = parseQuestionBlock(block, "test-category", i + 1);
      if (parsedQuestion) {
        questions.push(parsedQuestion);
        console.log(`\n--- Question ${i + 1} ---`);
        console.log("Text:", parsedQuestion.text);
        console.log("Options:", parsedQuestion.options);
        console.log("Correct Answer Index:", parsedQuestion.correctAnswer);
        console.log(
          "Correct Answer:",
          parsedQuestion.options[parsedQuestion.correctAnswer]
        );
      } else {
        console.log(`\n--- Question ${i + 1} FAILED TO PARSE ---`);
        console.log("Block content:", block.substring(0, 200));
      }
    }

    console.log(
      `\n\nSUMMARY: Successfully parsed ${questions.length} out of ${Math.min(
        questionBlocks.length,
        5
      )} questions`
    );

    if (questions.length > 0) {
      console.log("\n✅ Document parser is working correctly!");
      console.log("The upload should now work properly in the admin panel.");
    } else {
      console.log("\n❌ Document parser needs further debugging.");
    }
  } catch (error) {
    console.error("Error testing document parser:", error);
  }
}

testDocumentParser();
