// src/lib/examData.ts
// This file now provides functions to simulate fetching dynamic exam data and questions.

export interface ExamData {
  id: string; // A unique ID for the specific mock exam (e.g., "rn-fundamentals", "rm")
  category: "RN" | "RM" | "RPHN"; // The main professional category
  title: string; // The title of this specific mock exam (e.g., "RN Fundamentals")
  description: string;
  questionsCount: number; // Number of questions in this exam
  durationMinutes: number; // Duration in minutes
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  topics: string[];
  color: string; // Tailwind gradient classes for styling
  available: boolean; // Whether this exam is available for users
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number; // Index of the correct option
  explanation: string;
  flagged?: boolean; // Added for exam interface state
}

// Simulated full list of exams (this would come from a database in a real app)
const MOCK_ALL_EXAMS: ExamData[] = [
  {
    id: "rn-fundamentals",
    category: "RN",
    title: "RN Fundamentals",
    description:
      "Core nursing principles, patient care basics, and fundamental skills.",
    questionsCount: 10, // Reduced for easier testing
    durationMinutes: 60,
    difficulty: "Beginner",
    topics: [
      "Basic Patient Care",
      "Vital Signs",
      "Infection Control",
      "Safety",
      "Ethics",
    ],
    color: "from-blue-500 to-blue-600",
    available: true,
  },
  {
    id: "rn-medical-surgical",
    category: "RN",
    title: "RN Medical-Surgical",
    description: "Advanced medical-surgical nursing concepts and procedures.",
    questionsCount: 15, // Reduced for easier testing
    durationMinutes: 90,
    difficulty: "Intermediate",
    topics: [
      "Cardiovascular",
      "Respiratory",
      "Gastrointestinal",
      "Endocrine",
      "Surgical Care",
    ],
    color: "from-indigo-500 to-indigo-600",
    available: true,
  },
  {
    id: "rn-pediatrics",
    category: "RN",
    title: "RN Pediatrics",
    description:
      "Pediatric nursing care for infants, children, and adolescents.",
    questionsCount: 10, // Reduced for easier testing
    durationMinutes: 60,
    difficulty: "Intermediate",
    topics: [
      "Growth & Development",
      "Immunizations",
      "Pediatric Conditions",
      "Family Care",
      "Emergency Care",
    ],
    color: "from-cyan-500 to-cyan-600",
    available: true,
  },
  {
    id: "rm-general",
    category: "RM",
    title: "Registered Midwifery (General)",
    description:
      "Comprehensive assessment on antenatal, intrapartum, and postnatal care.",
    questionsCount: 20,
    durationMinutes: 120,
    difficulty: "Intermediate",
    topics: [
      "Antenatal Care",
      "Labor & Delivery",
      "Postnatal Care",
      "Neonatal Care",
      "Midwifery Ethics",
    ],
    color: "from-green-500 to-emerald-600",
    available: false, // Mark as coming soon
  },
  {
    id: "rphn-community",
    category: "RPHN",
    title: "Public Health Nursing (Community)",
    description:
      "Focus on community health, disease prevention, and health promotion strategies.",
    questionsCount: 15,
    durationMinutes: 90,
    difficulty: "Advanced",
    topics: [
      "Epidemiology",
      "Health Education",
      "Community Assessment",
      "Environmental Health",
      "Policy & Advocacy",
    ],
    color: "from-purple-500 to-fuchsia-600",
    available: false, // Mark as coming soon
  },
];

// Simulated questions for each exam ID
const MOCK_QUESTIONS_DATA: Record<string, Omit<Question, "flagged">[]> = {
  "rn-fundamentals": [
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
      explanation:
        "This is a classic sign of a transfusion reaction. The absolute first priority is to stop the transfusion to prevent further harm to the patient.",
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
      explanation:
        "According to ABCs (Airway, Breathing, Circulation), maintaining a patent airway is always the highest priority.",
    },
    {
      id: 3,
      text: "What is the primary purpose of administering furosemide (Lasix)?",
      options: [
        "To lower blood pressure",
        "To reduce potassium levels",
        "To treat edema by increasing urine output",
        "To prevent blood clots",
      ],
      correctAnswer: 2,
      explanation:
        "Furosemide is a loop diuretic whose primary action is to increase renal excretion of water and electrolytes, thereby reducing edema.",
    },
    {
      id: 4,
      text: "A nurse is preparing to administer insulin. Which site is the best for absorption?",
      options: ["Thigh", "Upper arm", "Abdomen", "Buttocks"],
      correctAnswer: 2,
      explanation:
        "The abdomen provides the fastest and most consistent absorption of insulin compared to other sites.",
    },
    {
      id: 5,
      text: "Which assessment finding would indicate a potential complication of immobility?",
      options: [
        "Increased muscle mass",
        "Bradycardia",
        "Reddened area on the sacrum",
        "Increased urinary output",
      ],
      correctAnswer: 2,
      explanation:
        "Prolonged pressure on bony prominences like the sacrum can lead to pressure ulcers, a common complication of immobility.",
    },
    {
      id: 6,
      text: "A patient with a history of heart failure is prescribed a low-sodium diet. Which meal choice indicates the patient understands the dietary restrictions?",
      options: [
        "Canned soup and crackers",
        "Grilled chicken with steamed vegetables",
        "A frozen TV dinner",
        "Ham and cheese sandwich",
      ],
      correctAnswer: 1,
      explanation:
        "Grilled chicken and steamed vegetables are naturally low in sodium. Canned, processed, and cured foods are typically very high in sodium.",
    },
    {
      id: 7,
      text: "What is the correct procedure for collecting a 24-hour urine specimen?",
      options: [
        "Discard the first voiding, then collect all urine for 24 hours.",
        "Collect all urine for 24 hours, including the first voiding.",
        "Collect one sample in the morning and one at night.",
        "Keep the collection container at room temperature.",
      ],
      correctAnswer: 0,
      explanation:
        "To ensure accuracy, the 24-hour collection period begins immediately after the patient's first void, which is discarded.",
    },
    {
      id: 8,
      text: "A nurse is teaching a patient about using an incentive spirometer. What is the most important instruction?",
      options: [
        "Exhale quickly into the device.",
        "Inhale slowly and deeply.",
        "Use the device once a day.",
        "Wash the device with soap and water after each use.",
      ],
      correctAnswer: 1,
      explanation:
        "The purpose of an incentive spirometer is to encourage slow, deep breaths to expand the lungs and prevent atelectasis.",
    },
    {
      id: 9,
      text: "Which of the following is a key symptom of hypoglycemia?",
      options: [
        "Fruity breath",
        "Increased thirst",
        "Diaphoresis and shakiness",
        "Kussmaul respirations",
      ],
      correctAnswer: 2,
      explanation:
        "Diaphoresis (sweating), shakiness, and confusion are classic signs of low blood sugar (hypoglycemia). Fruity breath and increased thirst are signs of hyperglycemia.",
    },
    {
      id: 10,
      text: "What is the most effective way for a nurse to prevent the spread of infection?",
      options: [
        "Wearing gloves for all patient contact.",
        "Placing all patients in isolation.",
        "Administering prophylactic antibiotics.",
        "Performing hand hygiene consistently.",
      ],
      correctAnswer: 3,
      explanation:
        "Consistent and proper hand hygiene is the single most effective measure to prevent the transmission of healthcare-associated infections.",
    },
  ],
  "rn-medical-surgical": [
    {
      id: 1,
      text: "A patient with chronic kidney disease is prescribed a low-protein diet. The nurse explains that this diet is important to:",
      options: [
        "Reduce fluid retention.",
        "Prevent hyperkalemia.",
        "Decrease the accumulation of nitrogenous waste products.",
        "Improve bone density.",
      ],
      correctAnswer: 2,
      explanation:
        "In chronic kidney disease, the kidneys have difficulty filtering waste products. A low-protein diet reduces the workload on the kidneys by minimizing the production of nitrogenous waste from protein metabolism.",
    },
    {
      id: 2,
      text: "The nurse is assessing a patient with a suspected deep vein thrombosis (DVT). Which finding is most indicative of a DVT?",
      options: [
        "Coolness and pallor of the affected extremity.",
        "Unilateral leg swelling, pain, and warmth.",
        "Diminished peripheral pulses in the affected leg.",
        "Bilateral ankle edema.",
      ],
      correctAnswer: 1,
      explanation:
        "Classic signs of DVT include unilateral leg swelling, pain, tenderness, warmth, and redness in the affected extremity. Coolness, pallor, and diminished pulses are more indicative of arterial insufficiency.",
    },
    {
      id: 3,
      text: "A patient is admitted with acute pancreatitis. Which laboratory value would the nurse expect to be elevated?",
      options: [
        "Serum amylase and lipase.",
        "Blood urea nitrogen (BUN) and creatinine.",
        "Hemoglobin and hematocrit.",
        "Serum albumin.",
      ],
      correctAnswer: 0,
      explanation:
        "Acute pancreatitis is characterized by inflammation of the pancreas, leading to the release of pancreatic enzymes into the bloodstream, specifically amylase and lipase, which are typically elevated.",
    },
    {
      id: 4,
      text: "The nurse is providing discharge teaching to a patient with newly diagnosed hypertension. Which statement by the patient indicates a need for further teaching?",
      options: [
        "“I should limit my salt intake.”",
        "“I can stop taking my medication once my blood pressure is normal.”",
        "“I need to exercise regularly.”",
        "“I will monitor my blood pressure at home.”",
      ],
      correctAnswer: 1,
      explanation:
        "Hypertension is a chronic condition that usually requires lifelong medication. Stopping medication without a physician's order can lead to a rebound hypertensive crisis.",
    },
    {
      id: 5,
      text: "A patient post-thyroidectomy develops tetany. The nurse recognizes this as a sign of which electrolyte imbalance?",
      options: [
        "Hypernatremia",
        "Hypocalcemia",
        "Hyperkalemia",
        "Hypomagnesemia",
      ],
      correctAnswer: 1,
      explanation:
        "Tetany (muscle spasms, tingling, numbness) after a thyroidectomy is a classic sign of hypocalcemia, often due to accidental removal or damage to the parathyroid glands during surgery.",
    },
    {
      id: 6,
      text: "When assessing a patient with a head injury, the nurse observes clear fluid leaking from the nose. What is the nurse's priority action?",
      options: [
        "Test the fluid for glucose.",
        "Apply a nasal packing.",
        "Position the patient in a supine position.",
        "Document the finding and continue monitoring.",
      ],
      correctAnswer: 0,
      explanation:
        "Clear fluid leaking from the nose after a head injury could indicate cerebrospinal fluid (CSF) leakage. CSF contains glucose, unlike nasal secretions. Testing for glucose helps differentiate and confirms CSF leakage, which requires immediate medical attention.",
    },
    {
      id: 7,
      text: "A patient with a colostomy is being taught how to change the pouch. Which statement by the patient indicates effective learning?",
      options: [
        "“I should change my pouch every day.”",
        "“I will empty the pouch when it is half full.”",
        "“I can use regular toilet paper to clean around the stoma.”",
        "“I should apply a tight-fitting pouch to prevent leaks.”",
      ],
      correctAnswer: 1,
      explanation:
        "Emptying the pouch when it is one-third to one-half full prevents it from becoming too heavy, which could lead to leakage or detachment.",
    },
    {
      id: 8,
      text: "The nurse is caring for a patient with a new prescription for warfarin. Which food should the patient be advised to limit?",
      options: ["Oranges", "Spinach", "Chicken breast", "White bread"],
      correctAnswer: 1,
      explanation:
        "Warfarin is an anticoagulant, and its effectiveness can be affected by vitamin K intake. Spinach and other leafy green vegetables are high in vitamin K, which can reduce the anticoagulant effect of warfarin.",
    },
    {
      id: 9,
      text: "A patient is experiencing an acute asthma exacerbation. Which medication would the nurse expect to administer first?",
      options: [
        "Oral corticosteroids",
        "Long-acting beta-agonists",
        "Inhaled short-acting beta-agonists (SABA)",
        "Leukotriene modifiers",
      ],
      correctAnswer: 2,
      explanation:
        "Short-acting beta-agonists (SABAs) like albuterol are bronchodilators that provide rapid relief of bronchospasm during an acute asthma attack.",
    },
    {
      id: 10,
      text: "The nurse is preparing a patient for a colonoscopy. Which instruction is most important for the patient to follow?",
      options: [
        "Maintain a regular diet until the morning of the procedure.",
        "Drink clear liquids for 24 hours before the procedure.",
        "Take all regular medications as usual.",
        "Perform a Fleet enema the night before the procedure.",
      ],
      correctAnswer: 1,
      explanation:
        "A clear liquid diet for 24 hours prior to the colonoscopy, along with bowel preparation, is essential to ensure the colon is clean for visualization.",
    },
  ],
  "rn-pediatrics": [
    {
      id: 1,
      text: "A nurse is assessing a 6-month-old infant. Which developmental milestone would the nurse expect to observe?",
      options: [
        "Walking independently",
        "Saying 'mama' and 'dada' meaningfully",
        "Sitting without support",
        "Drinking from a cup",
      ],
      correctAnswer: 2,
      explanation:
        "Most infants can sit independently by 6-8 months of age. Walking, meaningful words, and drinking from a cup typically occur later.",
    },
    {
      id: 2,
      text: "The nurse is teaching parents about preventing sudden infant death syndrome (SIDS). Which instruction is most important?",
      options: [
        "Place the infant to sleep on their stomach.",
        "Use soft bedding and bumpers in the crib.",
        "Place the infant to sleep on their back.",
        "Keep the room very warm.",
      ],
      correctAnswer: 2,
      explanation:
        "Placing infants to sleep on their back (supine position) is the most effective way to reduce the risk of SIDS.",
    },
    {
      id: 3,
      text: "A child with cystic fibrosis is prescribed pancreatic enzymes. The nurse should instruct the parents to administer these enzymes:",
      options: [
        "Once daily in the morning.",
        "With every meal and snack.",
        "Only when the child has diarrhea.",
        "30 minutes before meals.",
      ],
      correctAnswer: 1,
      explanation:
        "Pancreatic enzymes are essential for digestion and absorption of nutrients in children with cystic fibrosis. They must be taken with all meals and snacks to be effective.",
    },
    {
      id: 4,
      text: "The nurse is preparing to administer an immunization to a 4-year-old child. Which approach is best to gain the child's cooperation?",
      options: [
        "Tell the child it won't hurt at all.",
        "Force the child to sit still.",
        "Offer a choice of arm or leg for the injection.",
        "Threaten the child with punishment if they don't cooperate.",
      ],
      correctAnswer: 2,
      explanation:
        "Offering a limited choice gives the child a sense of control, which can reduce anxiety and promote cooperation. Lying or threatening is counterproductive.",
    },
    {
      id: 5,
      text: "A child is admitted with a diagnosis of croup. Which symptom is most characteristic of croup?",
      options: [
        "High-pitched inspiratory stridor",
        "Barking cough",
        "Wheezing on expiration",
        "Sudden onset of high fever",
      ],
      correctAnswer: 1,
      explanation:
        "A 'barking' or 'seal-like' cough is the hallmark symptom of croup (laryngotracheobronchitis), often accompanied by inspiratory stridor.",
    },
  ],
  // Add mock questions for rm-general and rphn-community when they become available
  "rm-general": [
    {
      id: 1,
      text: "A pregnant client in her third trimester reports swelling in her ankles and feet. What is the nurse's initial action?",
      options: [
        "Advise the client to restrict fluid intake.",
        "Elevate her legs and encourage rest.",
        "Assess for other signs of preeclampsia.",
        "Recommend a diuretic.",
      ],
      correctAnswer: 2,
      explanation:
        "While ankle swelling is common in pregnancy, it's crucial to rule out more serious conditions like preeclampsia by assessing for other symptoms such as headache, visual disturbances, and elevated blood pressure.",
    },
    {
      id: 2,
      text: "During labor, a client's cervix is 8 cm dilated, and she is experiencing strong contractions every 2-3 minutes. The nurse identifies this as which phase of labor?",
      options: [
        "Latent phase",
        "Active phase",
        "Transition phase",
        "Second stage",
      ],
      correctAnswer: 2,
      explanation:
        "The transition phase of the first stage of labor is characterized by rapid cervical dilation from 8 to 10 cm, with strong, frequent contractions.",
    },
  ],
  "rphn-community": [
    {
      id: 1,
      text: "A community health nurse is planning a health promotion program for adolescents. Which topic would be most appropriate to address first?",
      options: [
        "Nutrition and healthy eating habits.",
        "Risky sexual behaviors and STIs.",
        "Substance abuse prevention.",
        "Mental health awareness.",
      ],
      correctAnswer: 1,
      explanation:
        "While all are important, addressing risky sexual behaviors and STIs is often a high priority for adolescents due to the significant public health impact and prevalence in this age group.",
    },
    {
      id: 2,
      text: "In a community with a high incidence of tuberculosis, which intervention would be a primary prevention strategy?",
      options: [
        "Directly observed therapy (DOT) for active cases.",
        "Contact tracing for newly diagnosed cases.",
        "Providing education on cough etiquette and hand hygiene.",
        "Screening high-risk populations with tuberculin skin tests.",
      ],
      correctAnswer: 2,
      explanation:
        "Primary prevention aims to prevent disease before it occurs. Education on cough etiquette and hand hygiene reduces the transmission of the bacteria, thus preventing new infections.",
    },
  ],
};

// Function to simulate fetching all available exams
export async function fetchAllExams(): Promise<ExamData[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  return MOCK_ALL_EXAMS;
}

// Export allExams for backward compatibility
export const allExams = MOCK_ALL_EXAMS;

// Function to simulate fetching questions for a specific exam
export async function fetchQuestionsForExam(
  examId: string
): Promise<Question[]> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 700));

  const questions = MOCK_QUESTIONS_DATA[examId];
  if (!questions) {
    throw new Error(`No questions found for exam ID: ${examId}`);
  }
  // Add 'flagged' property for the exam interface
  return questions.map((q) => ({ ...q, flagged: false }));
}
