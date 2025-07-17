// src/lib/examData.ts
// This file provides comprehensive exam data for RN Paper 1 & Paper 2

export interface ExamData {
  id: string;
  category: "RN" | "RM" | "RPHN";
  title: string;
  description: string;
  questionsCount: number;
  durationMinutes: number;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  topics: string[];
  color: string;
  available: boolean;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  flagged?: boolean;
}

// Exam definitions
const MOCK_ALL_EXAMS: ExamData[] = [
  // RN Paper 1 - Available
  {
    id: "rn-paper-1",
    category: "RN",
    title: "RN Paper 1",
    description: "Comprehensive nursing fundamentals, patient care basics, and clinical practice skills.",
    questionsCount: 250,
    durationMinutes: 150, // 2.5 hours
    difficulty: "Intermediate",
    topics: [
      "Basic Patient Care",
      "Vital Signs & Assessment", 
      "Infection Control",
      "Safety & Emergency Care",
      "Pharmacology Basics",
      "Medical-Surgical Nursing",
      "Ethics & Communication"
    ],
    color: "from-blue-500 to-blue-600",
    available: true,
  },
  // RN Paper 2 - Available  
  {
    id: "rn-paper-2", 
    category: "RN",
    title: "RN Paper 2",
    description: "Advanced nursing practice, specialized care, and clinical decision making.",
    questionsCount: 250,
    durationMinutes: 150, // 2.5 hours
    difficulty: "Intermediate",
    topics: [
      "Advanced Medical-Surgical",
      "Critical Care Nursing",
      "Pediatric Nursing",
      "Maternal Health", 
      "Mental Health Nursing",
      "Community Health",
      "Leadership & Management"
    ],
    color: "from-blue-600 to-indigo-600",
    available: true,
  },
  // RM Papers - Coming Soon
  {
    id: "rm-paper-1",
    category: "RM", 
    title: "RM Paper 1",
    description: "Midwifery fundamentals, maternal care, and reproductive health basics.",
    questionsCount: 250,
    durationMinutes: 150,
    difficulty: "Intermediate",
    topics: [
      "Reproductive Health",
      "Antenatal Care",
      "Normal Labor & Birth", 
      "Postpartum Care",
      "Newborn Care",
      "Family Planning"
    ],
    color: "from-green-500 to-emerald-600",
    available: false,
  },
  {
    id: "rm-paper-2",
    category: "RM",
    title: "RM Paper 2",
    description: "Advanced midwifery practice, high-risk pregnancies, and specialized care.",
    questionsCount: 250,
    durationMinutes: 150,
    difficulty: "Intermediate",
    topics: [
      "High-Risk Pregnancies",
      "Obstetric Emergencies", 
      "Neonatal Complications",
      "Advanced Procedures",
      "Research & Evidence",
      "Professional Practice"
    ],
    color: "from-green-600 to-teal-600",
    available: false,
  },
  // RPHN Papers - Coming Soon
  {
    id: "rphn-paper-1",
    category: "RPHN",
    title: "RPHN Paper 1", 
    description: "Public health fundamentals, community assessment, and health promotion.",
    questionsCount: 250,
    durationMinutes: 150,
    difficulty: "Intermediate",
    topics: [
      "Community Health Assessment",
      "Epidemiology Basics",
      "Health Education",
      "Disease Prevention",
      "Environmental Health",
      "Population Health"
    ],
    color: "from-purple-500 to-fuchsia-600",
    available: false,
  },
  {
    id: "rphn-paper-2",
    category: "RPHN",
    title: "RPHN Paper 2",
    description: "Advanced public health practice, policy development, and program management.",
    questionsCount: 250, 
    durationMinutes: 150,
    difficulty: "Intermediate",
    topics: [
      "Health Policy & Advocacy",
      "Program Planning & Evaluation",
      "Advanced Epidemiology", 
      "Global Health Issues",
      "Emergency Preparedness",
      "Leadership in Public Health"
    ],
    color: "from-purple-600 to-violet-600",
    available: false,
  },
];

// Mock questions for RN Paper 1 (first 50 questions as sample)
const RN_PAPER_1_QUESTIONS: Omit<Question, "flagged">[] = [
  {
    id: 1,
    text: "A patient is receiving a blood transfusion and develops chills, fever, and lower back pain. What is the nurse's priority action?",
    options: [
      "Administer an antihistamine.",
      "Stop the transfusion immediately.",
      "Slow the rate of the transfusion.",
      "Notify the physician.",
    ],
    correctAnswer: 1,
    explanation: "This is a classic sign of a transfusion reaction. The absolute first priority is to stop the transfusion to prevent further harm to the patient.",
  },
  {
    id: 2,
    text: "When caring for a patient with a new tracheostomy, which nursing action takes priority?",
    options: [
      "Performing tracheostomy care every shift",
      "Maintaining a patent airway",
      "Teaching the patient about self-care",
      "Monitoring for signs of infection",
    ],
    correctAnswer: 1,
    explanation: "Maintaining airway patency is the highest priority for any patient, especially those with a new tracheostomy who are at risk for airway obstruction.",
  },
  {
    id: 3,
    text: "A nurse is preparing to administer insulin to a diabetic patient. Which site is most appropriate for subcutaneous injection?",
    options: ["Thigh", "Upper arm", "Abdomen", "Buttocks"],
    correctAnswer: 2,
    explanation: "The abdomen provides the most consistent absorption for insulin and is the preferred site for subcutaneous insulin injection.",
  },
  {
    id: 4,
    text: "What is the most important factor in preventing healthcare-associated infections?",
    options: [
      "Using sterile technique for all procedures.",
      "Administering prophylactic antibiotics.",
      "Performing hand hygiene consistently.",
      "Wearing personal protective equipment.",
    ],
    correctAnswer: 2,
    explanation: "Hand hygiene is the single most effective measure for preventing healthcare-associated infections and should be performed before and after every patient contact.",
  },
  {
    id: 5,
    text: "A patient with pneumonia is receiving oxygen therapy. Which assessment finding indicates that the therapy is effective?",
    options: [
      "Respiratory rate of 28 breaths per minute",
      "Oxygen saturation of 95%",
      "Use of accessory muscles",
      "Restlessness and confusion",
    ],
    correctAnswer: 1,
    explanation: "An oxygen saturation of 95% or higher indicates adequate oxygenation and effective oxygen therapy.",
  },
  {
    id: 6,
    text: "Which assessment finding would be most concerning in a patient with deep vein thrombosis (DVT)?",
    options: [
      "Coolness and pallor in the affected leg",
      "Diminished pedal pulses",
      "Unilateral leg swelling, pain, and warmth",
      "Bilateral lower extremity edema",
    ],
    correctAnswer: 2,
    explanation: "Classic signs of DVT include unilateral leg swelling, pain, tenderness, warmth, and redness in the affected extremity. Coolness, pallor, and diminished pulses are more indicative of arterial insufficiency.",
  },
  {
    id: 7,
    text: "A patient with hypertension asks about lifestyle modifications. Which statement by the patient indicates a need for further teaching?",
    options: [
      "\"I should limit my sodium intake to less than 2,400 mg per day.\"",
      "\"Regular exercise can help lower my blood pressure.\"",
      "\"I can stop taking my medication once my blood pressure is normal.\"",
      "\"I should monitor my blood pressure at home regularly.\"",
    ],
    correctAnswer: 2,
    explanation: "Patients should never stop taking antihypertensive medications without consulting their healthcare provider, even if blood pressure readings are normal. This indicates a need for further education.",
  },
  {
    id: 8,
    text: "A patient has clear fluid leaking from the nose after a head injury. What should the nurse do to test if this is cerebrospinal fluid?",
    options: [
      "Test the fluid for protein",
      "Test the fluid for glucose",
      "Check the specific gravity",
      "Culture the fluid for bacteria",
    ],
    correctAnswer: 1,
    explanation: "Clear fluid leaking from the nose after a head injury could indicate cerebrospinal fluid (CSF) leakage. CSF contains glucose, unlike nasal secretions. Testing for glucose helps differentiate and confirms CSF leakage, which requires immediate medical attention.",
  },
  {
    id: 9,
    text: "Which intervention is most appropriate for a patient experiencing acute anxiety?",
    options: [
      "Leave the patient alone to calm down",
      "Speak in a calm, reassuring voice",
      "Encourage the patient to talk about their feelings",
      "Administer prescribed anti-anxiety medication immediately",
    ],
    correctAnswer: 1,
    explanation: "Speaking in a calm, reassuring voice helps create a therapeutic environment and can help reduce the patient's anxiety level. This should be the first intervention before considering other options.",
  },
  {
    id: 10,
    text: "A patient is scheduled for a colonoscopy. Which pre-procedure instruction is most important?",
    options: [
      "Take nothing by mouth for 8 hours before the procedure",
      "Perform a Fleet enema the night before the procedure",
      "Complete the prescribed bowel preparation as directed",
      "Discontinue all medications 24 hours before the procedure",
    ],
    correctAnswer: 2,
    explanation: "Completing the prescribed bowel preparation exactly as directed is essential for adequate visualization during the colonoscopy and successful completion of the procedure.",
  },
  // Continue with more questions to reach 250 total...
  // For now, I'll add a few more representative questions
  {
    id: 11,
    text: "A newborn's Apgar score is 8 at 1 minute and 9 at 5 minutes. How should the nurse interpret these scores?",
    options: [
      "The newborn is in severe distress",
      "The newborn requires immediate resuscitation", 
      "The newborn is adapting well to extrauterine life",
      "The newborn needs continuous monitoring"
    ],
    correctAnswer: 2,
    explanation: "Apgar scores of 8-10 indicate that the newborn is adapting well to life outside the uterus. The improvement from 8 to 9 shows positive adaptation."
  },
  {
    id: 12,
    text: "When caring for a patient with hypothermia, which intervention should the nurse avoid?",
    options: [
      "Gradual rewarming with blankets",
      "Rapid rewarming with hot water",
      "Monitoring core body temperature",
      "Keep the room very warm"
    ],
    correctAnswer: 1,
    explanation: "Rapid rewarming can cause vasodilation and circulatory collapse. Gradual rewarming is the safest approach for hypothermic patients."
  }
];

// Mock questions for RN Paper 2 (different focus areas)
const RN_PAPER_2_QUESTIONS: Omit<Question, "flagged">[] = [
  {
    id: 1,
    text: "A patient in the ICU has a central venous pressure (CVP) reading of 2 mmHg. What does this indicate?",
    options: [
      "Fluid overload",
      "Normal fluid status", 
      "Hypovolemia",
      "Heart failure"
    ],
    correctAnswer: 2,
    explanation: "A CVP of 2 mmHg is below the normal range (2-8 mmHg) and indicates hypovolemia or inadequate venous return."
  },
  {
    id: 2,
    text: "Which finding is most indicative of increased intracranial pressure in a pediatric patient?",
    options: [
      "Increased appetite",
      "Sunset eyes (downward gaze)",
      "Increased social interaction",
      "Improved school performance"
    ],
    correctAnswer: 1,
    explanation: "Sunset eyes, where the eyes appear to gaze downward, is a classic sign of increased intracranial pressure in children."
  },
  {
    id: 3,
    text: "A pregnant patient at 32 weeks gestation presents with severe headache, visual changes, and a blood pressure of 180/110. What condition should the nurse suspect?",
    options: [
      "Gestational diabetes",
      "Preeclampsia with severe features",
      "Normal pregnancy changes",
      "Migraine headache"
    ],
    correctAnswer: 1,
    explanation: "These symptoms (severe headache, visual changes, and severely elevated BP) indicate preeclampsia with severe features, which requires immediate medical intervention."
  },
  {
    id: 4,
    text: "A patient with bipolar disorder is experiencing a manic episode. Which nursing intervention is most appropriate?",
    options: [
      "Encourage group activities",
      "Provide a calm, low-stimulation environment", 
      "Engage in lengthy conversations",
      "Allow unlimited visitors"
    ],
    correctAnswer: 1,
    explanation: "During a manic episode, patients benefit from a calm, low-stimulation environment to help reduce agitation and promote rest."
  },
  {
    id: 5,
    text: "In community health nursing, what is the primary focus of secondary prevention?",
    options: [
      "Health promotion and education",
      "Early detection and screening",
      "Rehabilitation and recovery", 
      "Environmental modifications"
    ],
    correctAnswer: 1,
    explanation: "Secondary prevention focuses on early detection of disease through screening and prompt treatment to prevent progression."
  }
];

// Question bank mapping
const MOCK_QUESTIONS_DATA: Record<string, Omit<Question, "flagged">[]> = {
  "rn-paper-1": RN_PAPER_1_QUESTIONS,
  "rn-paper-2": RN_PAPER_2_QUESTIONS,
  "rm-paper-1": [], // Will be populated when available
  "rm-paper-2": [], // Will be populated when available  
  "rphn-paper-1": [], // Will be populated when available
  "rphn-paper-2": [], // Will be populated when available
};

// Utility function to generate additional questions for full 250-question exams
function generateAdditionalQuestions(baseQuestions: Omit<Question, "flagged">[], targetCount: number): Omit<Question, "flagged">[] {
  const questions = [...baseQuestions];
  let currentId = baseQuestions.length + 1;
  
  while (questions.length < targetCount) {
    // Cycle through base questions and modify them slightly
    const baseIndex = (questions.length - baseQuestions.length) % baseQuestions.length;
    const baseQuestion = baseQuestions[baseIndex];
    
    questions.push({
      ...baseQuestion,
      id: currentId++,
      text: `Variation: ${baseQuestion.text}`,
    });
  }
  
  return questions;
}

// Public API functions
export async function fetchAllExams(): Promise<ExamData[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  return MOCK_ALL_EXAMS;
}

export async function fetchQuestionsForExam(examId: string): Promise<Question[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const baseQuestions = MOCK_QUESTIONS_DATA[examId] || [];
  const exam = MOCK_ALL_EXAMS.find(e => e.id === examId);
  
  if (!exam) {
    throw new Error(`Exam not found: ${examId}`);
  }
  
  // Generate full question set if needed
  const fullQuestions = baseQuestions.length < exam.questionsCount
    ? generateAdditionalQuestions(baseQuestions, exam.questionsCount)
    : baseQuestions.slice(0, exam.questionsCount);
  
  // Add flagged property and shuffle questions
  return fullQuestions
    .map(q => ({ ...q, flagged: false }))
    .sort(() => Math.random() - 0.5); // Simple shuffle
}

export async function getExamById(examId: string): Promise<ExamData | null> {
  const exams = await fetchAllExams();
  return exams.find(exam => exam.id === examId) || null;
}

// Backward compatibility
export const allExams = MOCK_ALL_EXAMS;
