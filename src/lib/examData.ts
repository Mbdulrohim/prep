// src/lib/examData.ts
// This file provides comprehensive test exam data for RN Paper 1 & Paper 2

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
  id: number | string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  examId?: string;
  category?: string;
  difficulty?: string;
  flagged?: boolean;
}

// Exam definitions
const ALL_EXAMS: ExamData[] = [
  // RN Paper 1 - Requires Admin Schedule Setup
  {
    id: "rn-paper-1",
    category: "RN",
    title: "RN Paper 1",
    description:
      "Comprehensive nursing fundamentals, patient care basics, and clinical practice skills.",
    questionsCount: 250,
    durationMinutes: 150, // 2.5 hours
    difficulty: "Intermediate",
    topics: [
      "Basic Patient Care",
      "Vital Signs & Assessment",
      "Infection Control",
      "Accident and Emergency Nursing",
      "Pharmacology Basics",
      "Medical-Surgical Nursing",
      "Ethics & Communication",
      "Anatomy & Physiology",
      "Nutrition & Dietetics",
    ],
    color: "from-blue-500 to-blue-600",
    available: true, // Temporarily enabled for testing
  },
  // RN Paper 2 - Requires Admin Schedule Setup
  {
    id: "rn-paper-2",
    category: "RN",
    title: "RN Paper 2",
    description:
      "Advanced nursing practice, specialized care, and clinical decision making.",
    questionsCount: 250,
    durationMinutes: 150, // 2.5 hours
    difficulty: "Intermediate",
    topics: [
      "Entrepreneurship in Nursing",
      "Nursing Informatics",
      "Mental Health Nursing",
      "Community Health Nursing",
      "Primary Health Care",
      "Leadership & Management",
      "Research / Biostatistics",
      "Politics / Governance in Nursing",
      "Nursing Jurisprudence",
      "Health Economics",
      "Computer Literacy",
    ],
    color: "from-blue-600 to-indigo-600",
    available: false, // Changed to false - requires admin setup
  },
  // RM Papers - Requires Admin Schedule Setup
  {
    id: "rm-paper-1",
    category: "RM",
    title: "RM Paper 1",
    description:
      "Midwifery fundamentals, maternal care, and reproductive health basics.",
    questionsCount: 250,
    durationMinutes: 150, // 2.5 hours
    difficulty: "Intermediate",
    topics: [
      "Reproductive Health",
      "Antenatal Care",
      "Normal Labor & Birth",
      "Postpartum Care",
      "Newborn Care",
      "Family Planning",
      "Infection Control",
      "Emergency Obstetrics",
    ],
    color: "from-green-500 to-emerald-600",
    available: false,
  },
  {
    id: "rm-paper-2",
    category: "RM",
    title: "RM Paper 2",
    description:
      "Advanced midwifery practice, high-risk pregnancies, and specialized care.",
    questionsCount: 250,
    durationMinutes: 150, // 2.5 hours
    difficulty: "Intermediate",
    topics: [
      "High-Risk Pregnancies",
      "Obstetric Emergencies",
      "Neonatal Complications",
      "Advanced Procedures",
      "Research & Evidence",
      "Professional Practice",
      "Midwifery Management",
      "Ethics & Legal Issues",
    ],
    color: "from-green-600 to-teal-600",
    available: false,
  },
  // RPHN Papers - Requires Admin Schedule Setup
  {
    id: "rphn-paper-1",
    category: "RPHN",
    title: "RPHN Paper 1",
    description:
      "Public health fundamentals, community assessment, and health promotion.",
    questionsCount: 250,
    durationMinutes: 150, // 2.5 hours
    difficulty: "Intermediate",
    topics: [
      "Community Health Assessment",
      "Epidemiology Basics",
      "Health Education",
      "Disease Prevention",
      "Environmental Health",
      "Population Health",
      "Primary Health Care",
      "Health Promotion",
    ],
    color: "from-purple-500 to-fuchsia-600",
    available: false,
  },
  {
    id: "rphn-paper-2",
    category: "RPHN",
    title: "RPHN Paper 2",
    description:
      "Advanced public health practice, policy development, and program management.",
    questionsCount: 250,
    durationMinutes: 150, // 2.5 hours
    difficulty: "Intermediate",
    topics: [
      "Health Policy & Advocacy",
      "Program Planning & Evaluation",
      "Advanced Epidemiology",
      "Global Health Issues",
      "Emergency Preparedness",
      "Leadership in Public Health",
      "Research Methods",
      "Quality Improvement",
    ],
    color: "from-purple-600 to-violet-600",
    available: false,
  },
];

// All questions are now loaded from Firestore database
// No static questions needed as we have 2k+ questions in Firebase

// Public API functions
export async function fetchAllExams(): Promise<ExamData[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 100));
  
  // Clone the exams array to avoid mutating the original
  const exams = ALL_EXAMS.map(exam => ({ ...exam }));
  
  // Check exam schedules and update availability dynamically
  try {
    const { examScheduleManager } = await import("./examSchedule");
    
    // Update availability based on scheduling status
    for (const exam of exams) {
      if (exam.category === "RM" || exam.category === "RN") {
        const paper = exam.id.includes("paper-2") ? "paper2" : "paper1";
        const scheduleId = `${exam.category}_${paper}`;
        
        try {
          const schedule = await examScheduleManager.getSchedule(scheduleId);
          if (schedule && schedule.isActive && schedule.scheduledDate) {
            exam.available = true;
          }
        } catch (error) {
          console.warn(`Could not check schedule for ${scheduleId}:`, error);
        }
      }
    }
  } catch (error) {
    console.warn("Could not load exam schedule manager:", error);
  }
  
  return exams;
}

export async function fetchQuestionsForExam(
  examId: string
): Promise<Question[]> {
  try {
    // Import Firestore functions dynamically to avoid circular dependency
    const { db } = await import("./firebase");
    const { collection, query, where, getDocs, limit } = await import(
      "firebase/firestore"
    );

    const exam = ALL_EXAMS.find((e: ExamData) => e.id === examId);
    if (!exam) {
      throw new Error(`Exam not found: ${examId}`);
    }

    // Load questions from Firestore
    console.log(`Loading questions for examId: ${examId}`);
    const questionsQuery = query(
      collection(db, "questions"),
      where("examId", "==", examId),
      limit(exam.questionsCount) // Limit to the required number of questions
    );

    const snapshot = await getDocs(questionsQuery);
    console.log(`Found ${snapshot.docs.length} questions in Firestore for ${examId}`);
    
    if (snapshot.docs.length === 0) {
      throw new Error(`No questions found in Firestore for ${examId}. Please ensure questions are properly uploaded.`);
    }
    
    const firestoreQuestions = snapshot.docs.map((doc) => {
      const data = doc.data();
      console.log(`Question ${doc.id} structure:`, {
        hasText: !!data.text,
        hasOptions: !!data.options,
        optionsLength: data.options?.length || 0,
        hasCorrectAnswer: data.correctAnswer !== undefined,
        examId: data.examId,
        category: data.category,
        difficulty: data.difficulty,
      });
      
      return {
        id: doc.id, // Use document ID as question ID
        text: data.text || "",
        options: data.options || [],
        correctAnswer: data.correctAnswer || 0,
        explanation: data.explanation || "",
        examId: data.examId || examId,
        category: data.category || "",
        difficulty: data.difficulty || "",
        flagged: false,
      };
    });

    console.log(`Successfully loaded ${firestoreQuestions.length} questions from Firestore for ${examId}`);

    // Shuffle questions for randomization
    return firestoreQuestions.sort(() => Math.random() - 0.5);
    
  } catch (error) {
    console.error("Error loading questions from Firestore:", error);
    throw new Error(`Failed to load questions for ${examId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Function to get exam availability with schedule check
export async function getExamAvailabilityStatus(examId: string): Promise<{
  isAvailable: boolean;
  reason?: string;
  scheduleInfo?: any;
}> {
  try {
    // Import dynamically to avoid circular dependency
    const { examScheduleManager } = await import("./examSchedule");
    const availability = await examScheduleManager.getExamAvailability(examId);

    return {
      isAvailable: availability.isAvailable,
      reason: availability.reason,
      scheduleInfo: availability,
    };
  } catch (error) {
    console.error("Error checking exam availability:", error);
    return {
      isAvailable: false,
      reason: "Error checking exam availability. Please contact admin.",
    };
  }
}

export async function getExamById(examId: string): Promise<ExamData | null> {
  const exams = await fetchAllExams();
  return exams.find((exam) => exam.id === examId) || null;
}

// Backward compatibility
export const allExams = ALL_EXAMS;
