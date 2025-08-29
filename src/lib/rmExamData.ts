// src/lib/rmExamData.ts
// RM (Registered Midwifery) Exam System - Completely separate from RN/Weekly assessments

export interface RMExamData {
  id: string;
  category: "RM";
  title: string;
  description: string;
  questionsCount: number; // Admin configurable
  durationMinutes: number; // Admin configurable
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  topics: string[];
  color: string;
  available: boolean;
  pricing: {
    amount: number; // Default 2000 NGN, admin configurable
    currency: string;
    accessCodeEnabled: boolean; // Admin can enable access codes for RM too
  };
  adminConfig: {
    maxAttempts: number; // Default 1, admin configurable
    paperCount: number; // Admin can set number of papers
    scheduleRequired: boolean; // Admin can set if scheduling required
    autoGenerate: boolean; // Admin can choose to auto-generate questions
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string; // Admin who created this exam
}

export interface RMQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  topics: string[];
  category: "RM";
  paper: string; // "paper-1", "paper-2", etc. - admin configurable
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    source: "uploaded" | "generated";
    reviewStatus: "pending" | "approved" | "rejected";
    uploadedBy?: string; // Admin who uploaded
  };
}

// Default RM exam configurations - can be modified by admin
const DEFAULT_RM_EXAMS: RMExamData[] = [
  {
    id: "rm-paper-1",
    category: "RM",
    title: "RM Paper 1",
    description: "Midwifery fundamentals, maternal care, and reproductive health basics.",
    questionsCount: 250, // Admin configurable
    durationMinutes: 150, // Admin configurable
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
      "Maternal Nutrition",
      "Breastfeeding Support",
    ],
    color: "from-green-500 to-emerald-600",
    available: false, // Admin controlled
    pricing: {
      amount: 2000, // NGN - admin configurable
      currency: "NGN",
      accessCodeEnabled: true, // Admin can enable/disable
    },
    adminConfig: {
      maxAttempts: 1, // Admin configurable
      paperCount: 2, // Admin can change this
      scheduleRequired: true, // Admin controlled
      autoGenerate: false, // Admin controlled
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "system", // Will be actual admin ID
  },
  {
    id: "rm-paper-2", 
    category: "RM",
    title: "RM Paper 2",
    description: "Advanced midwifery practice, high-risk pregnancies, and specialized care.",
    questionsCount: 250, // Admin configurable
    durationMinutes: 150, // Admin configurable  
    difficulty: "Intermediate",
    topics: [
      "High-Risk Pregnancies",
      "Obstetric Emergencies",
      "Complicated Deliveries", 
      "Neonatal Resuscitation",
      "Maternal Emergencies",
      "Gynecological Care",
      "Fertility Counseling",
      "Advanced Procedures",
      "Midwifery Leadership",
      "Professional Ethics",
    ],
    color: "from-green-600 to-teal-600",
    available: false, // Admin controlled
    pricing: {
      amount: 2000, // NGN - admin configurable
      currency: "NGN", 
      accessCodeEnabled: true,
    },
    adminConfig: {
      maxAttempts: 1,
      paperCount: 2,
      scheduleRequired: true,
      autoGenerate: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "system",
  },
];

// RM Topics for question generation - admin can modify
export const RM_TOPICS = {
  "paper-1": [
    "Antenatal Care",
    "Labor & Delivery", 
    "Postnatal Care",
    "Newborn Care",
    "Family Planning",
    "Reproductive Health",
    "Maternal Nutrition",
    "High-Risk Pregnancy",
    "Breastfeeding",
    "Infection Prevention",
    "Emergency Obstetrics",
    "Documentation",
  ],
  "paper-2": [
    "Advanced Midwifery",
    "Complicated Deliveries",
    "Neonatal Resuscitation", 
    "Maternal Emergencies",
    "Gynecological Care",
    "Fertility Counseling",
    "Contraceptive Methods",
    "Prenatal Diagnosis",
    "Operative Procedures",
    "Leadership & Management",
    "Research & Evidence",
    "Professional Ethics",
  ],
};

// API functions for RM exams - completely separate from RN system
export async function fetchRMExams(): Promise<RMExamData[]> {
  try {
    // Clone the exams array to avoid mutating the original
    const exams = DEFAULT_RM_EXAMS.map(exam => ({ ...exam }));
    
    // Check exam schedules and update availability dynamically
    try {
      const { examScheduleManager } = await import("./examSchedule");
      
      // Update availability based on scheduling status
      for (const exam of exams) {
        const paper = exam.id.includes("paper-2") ? "paper2" : "paper1";
        const scheduleId = `RM_${paper}`;
        
        console.log(`Checking RM schedule for exam ${exam.id} with scheduleId: ${scheduleId}`);
        
        try {
          const schedule = await examScheduleManager.getSchedule(scheduleId);
          console.log(`RM Schedule found for ${scheduleId}:`, schedule);
          
          if (schedule && schedule.isActive && schedule.scheduledDate) {
            const now = new Date();
            const scheduledDate = new Date(schedule.scheduledDate);
            console.log(`RM Schedule check for ${scheduleId}:`, {
              isActive: schedule.isActive,
              scheduledDate: scheduledDate,
              now: now,
              isScheduledDatePassed: now >= scheduledDate
            });
            
            // Make exam available if it's scheduled and the time has passed
            if (now >= scheduledDate) {
              exam.available = true;
              console.log(`✅ RM Exam ${exam.id} is now available (scheduled for ${scheduledDate})`);
            } else {
              console.log(`⏰ RM Exam ${exam.id} is scheduled but not yet available (scheduled for ${scheduledDate})`);
            }
          } else {
            console.log(`❌ RM Exam ${exam.id} is not available:`, {
              hasSchedule: !!schedule,
              isActive: schedule?.isActive,
              hasScheduledDate: !!schedule?.scheduledDate
            });
          }
        } catch (error) {
          console.warn(`Could not check RM schedule for ${scheduleId}:`, error);
        }
      }
    } catch (error) {
      console.warn("Could not load exam schedule manager for RM exams:", error);
    }
    
    return exams;
  } catch (error) {
    console.error("Error fetching RM exams:", error);
    return [];
  }
}

export async function fetchRMQuestionsForExam(examId: string): Promise<RMQuestion[]> {
  try {
    // Will fetch from separate Firebase collection 'rmQuestions'
    // For now return empty array - will implement question bank next
    return [];
  } catch (error) {
    console.error("Error fetching RM questions:", error);
    return [];
  }
}

export async function createRMExam(examData: Partial<RMExamData>): Promise<string> {
  try {
    // Will create in separate Firebase collection 'rmExams'
    // Admin function to create new RM exams
    return "new-rm-exam-id";
  } catch (error) {
    console.error("Error creating RM exam:", error);
    throw error;
  }
}

export async function updateRMExam(examId: string, updates: Partial<RMExamData>): Promise<void> {
  try {
    // Will update in separate Firebase collection 'rmExams' 
    // Admin function to modify RM exam configurations
  } catch (error) {
    console.error("Error updating RM exam:", error);
    throw error;
  }
}
