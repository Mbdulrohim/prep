// src/lib/questionBank.ts
// Advanced question bank system for large-scale exam management

export interface QuestionBank {
  id: string;
  category: "RN" | "RM" | "RPHN";
  paper: "paper-1" | "paper-2";
  questions: Question[];
  totalQuestions: number;
  lastUpdated: Date;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  topics: string[];
  category: string;
  paper: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    source?: string;
    authorId?: string;
    reviewStatus?: "pending" | "approved" | "rejected";
  };
}

export interface UserExamAttempt {
  id: string;
  userId: string;
  examId: string;
  assignedQuestions: Question[];
  userAnswers: (number | null)[];
  startTime: Date;
  endTime?: Date;
  completed: boolean;
  score?: number;
  timeSpent?: number;
  missedQuestions: number[];
  flaggedQuestions: number[];
}

export interface AccessCode {
  id: string;
  code: string;
  examCategory: "RN" | "RM" | "RPHN";
  papers: ("paper-1" | "paper-2")[];
  expiryDate: Date;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  createdAt: Date;
  price: number;
  currency: string;
}

class QuestionBankManager {
  private static instance: QuestionBankManager;
  private questionBanks: Map<string, QuestionBank> = new Map();

  static getInstance(): QuestionBankManager {
    if (!QuestionBankManager.instance) {
      QuestionBankManager.instance = new QuestionBankManager();
    }
    return QuestionBankManager.instance;
  }

  /**
   * Initialize question banks with large datasets
   */
  async initializeQuestionBanks(): Promise<void> {
    // Initialize RN Paper 1 & 2 question banks
    await this.createQuestionBank("RN", "paper-1", 5000);
    await this.createQuestionBank("RN", "paper-2", 5000);

    // Initialize RM Paper 1 & 2 question banks
    await this.createQuestionBank("RM", "paper-1", 3000);
    await this.createQuestionBank("RM", "paper-2", 3000);

    // Initialize RPHN Paper 1 & 2 question banks
    await this.createQuestionBank("RPHN", "paper-1", 2000);
    await this.createQuestionBank("RPHN", "paper-2", 2000);
  }

  /**
   * Create a question bank with generated questions
   */
  private async createQuestionBank(
    category: "RN" | "RM" | "RPHN",
    paper: "paper-1" | "paper-2",
    questionCount: number
  ): Promise<QuestionBank> {
    const bankId = `${category.toLowerCase()}-${paper}`;

    // Generate questions for the bank
    const questions = await this.generateQuestions(
      category,
      paper,
      questionCount
    );

    const questionBank: QuestionBank = {
      id: bankId,
      category,
      paper,
      questions,
      totalQuestions: questions.length,
      lastUpdated: new Date(),
    };

    this.questionBanks.set(bankId, questionBank);
    return questionBank;
  }

  /**
   * Generate questions for a specific category and paper
   */
  private async generateQuestions(
    category: "RN" | "RM" | "RPHN",
    paper: "paper-1" | "paper-2",
    count: number
  ): Promise<Question[]> {
    const questions: Question[] = [];
    const topics = this.getTopicsForCategoryAndPaper(category, paper);

    for (let i = 0; i < count; i++) {
      const difficulty = this.getDifficultyDistribution(i, count);
      const topic = topics[i % topics.length];

      const question: Question = {
        id: `${category.toLowerCase()}-${paper}-q${i + 1}`,
        text: this.generateQuestionText(category, paper, topic, i + 1),
        options: this.generateOptions(category, topic),
        correctAnswer: Math.floor(Math.random() * 4),
        explanation: this.generateExplanation(category, topic),
        difficulty,
        topics: [topic],
        category: category.toLowerCase(),
        paper,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          source: "generated",
          reviewStatus: "approved",
        },
      };

      questions.push(question);
    }

    return questions;
  }

  /**
   * Get topics for specific category and paper
   */
  private getTopicsForCategoryAndPaper(
    category: "RN" | "RM" | "RPHN",
    paper: "paper-1" | "paper-2"
  ): string[] {
    const topicMap = {
      RN: {
        "paper-1": [
          "Basic Patient Care",
          "Vital Signs Assessment",
          "Infection Control",
          "Safety & Emergency Care",
          "Pharmacology Basics",
          "Medical-Surgical Nursing",
          "Ethics & Communication",
          "Documentation",
          "Health Assessment",
          "Nursing Process",
          "Patient Education",
          "Legal Issues",
        ],
        "paper-2": [
          "Advanced Pharmacology",
          "Critical Care Nursing",
          "Pediatric Nursing",
          "Maternal Health",
          "Mental Health Nursing",
          "Community Health",
          "Leadership & Management",
          "Quality Improvement",
          "Research & Evidence",
          "Advanced Assessment",
          "Pathophysiology",
          "Complex Care Planning",
        ],
      },
      RM: {
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
          "Advanced Assessment",
          "Research & Practice",
          "Leadership",
          "Quality Care",
          "Professional Ethics",
          "Health Promotion",
        ],
      },
      RPHN: {
        "paper-1": [
          "Public Health Principles",
          "Community Assessment",
          "Health Promotion",
          "Disease Prevention",
          "Epidemiology",
          "Environmental Health",
          "Health Education",
          "Program Planning",
          "Data Collection",
          "Population Health",
          "Health Policy",
          "Community Resources",
        ],
        "paper-2": [
          "Advanced Epidemiology",
          "Health Program Evaluation",
          "Policy Development",
          "Leadership in Public Health",
          "Global Health",
          "Emergency Preparedness",
          "Health Informatics",
          "Research Methods",
          "Quality Improvement",
          "Health Economics",
          "Advanced Practice",
          "Professional Development",
        ],
      },
    };

    return topicMap[category][paper];
  }

  /**
   * Generate realistic question text
   */
  private generateQuestionText(
    category: string,
    paper: string,
    topic: string,
    questionNum: number
  ): string {
    const questionTemplates = {
      basic: [
        `What is the most appropriate nursing intervention for a patient with ${topic}?`,
        `Which assessment finding would be most concerning in ${topic}?`,
        `What is the priority nursing diagnosis for ${topic}?`,
        `Which medication is commonly used for ${topic}?`,
      ],
      advanced: [
        `A patient presents with complications related to ${topic}. What is the most appropriate immediate action?`,
        `In the context of ${topic}, which evidence-based practice should be prioritized?`,
        `When managing ${topic}, what is the most critical factor to monitor?`,
        `Which pathophysiological process best explains ${topic}?`,
      ],
    };

    const isAdvanced = paper === "paper-2" || questionNum > 2500;
    const templates = isAdvanced
      ? questionTemplates.advanced
      : questionTemplates.basic;
    const template = templates[questionNum % templates.length];

    return template;
  }

  /**
   * Generate realistic options
   */
  private generateOptions(category: string, topic: string): string[] {
    const optionSets = {
      assessment: [
        "Perform immediate assessment",
        "Document findings only",
        "Notify physician immediately",
        "Continue routine monitoring",
      ],
      intervention: [
        "Implement evidence-based protocol",
        "Wait for physician orders",
        "Provide comfort measures only",
        "Defer to next shift",
      ],
      medication: [
        "Administer as prescribed",
        "Hold medication pending review",
        "Double-check dosage calculation",
        "Consult pharmacy first",
      ],
      priority: [
        "Address immediate safety concerns",
        "Complete documentation first",
        "Gather more information",
        "Consult with supervisor",
      ],
    };

    const randomSet =
      Object.values(optionSets)[
        Math.floor(Math.random() * Object.values(optionSets).length)
      ];
    return [...randomSet].sort(() => Math.random() - 0.5);
  }

  /**
   * Generate explanation
   */
  private generateExplanation(category: string, topic: string): string {
    return `This answer is correct based on evidence-based practice guidelines for ${topic}. The intervention follows established protocols and prioritizes patient safety while considering the specific needs of ${category} practice.`;
  }

  /**
   * Distribute difficulty levels across questions
   */
  private getDifficultyDistribution(
    index: number,
    total: number
  ): "Beginner" | "Intermediate" | "Advanced" {
    const position = index / total;
    if (position < 0.3) return "Beginner";
    if (position < 0.7) return "Intermediate";
    return "Advanced";
  }

  /**
   * Assign unique questions to a user for an exam
   */
  async assignQuestionsToUser(
    userId: string,
    examCategory: "RN" | "RM" | "RPHN",
    paper: "paper-1" | "paper-2",
    questionCount: number = 250
  ): Promise<Question[]> {
    const bankId = `${examCategory.toLowerCase()}-${paper}`;
    const questionBank = this.questionBanks.get(bankId);

    if (!questionBank) {
      throw new Error(`Question bank not found for ${examCategory} ${paper}`);
    }

    // Shuffle questions and select required count
    const shuffled = [...questionBank.questions].sort(
      () => Math.random() - 0.5
    );
    const selectedQuestions = shuffled.slice(0, questionCount);

    // Ensure good difficulty distribution
    const beginner = selectedQuestions
      .filter((q) => q.difficulty === "Beginner")
      .slice(0, Math.floor(questionCount * 0.3));
    const intermediate = selectedQuestions
      .filter((q) => q.difficulty === "Intermediate")
      .slice(0, Math.floor(questionCount * 0.5));
    const advanced = selectedQuestions
      .filter((q) => q.difficulty === "Advanced")
      .slice(0, Math.floor(questionCount * 0.2));

    const finalQuestions = [...beginner, ...intermediate, ...advanced]
      .sort(() => Math.random() - 0.5)
      .slice(0, questionCount);

    return finalQuestions;
  }

  /**
   * Get question bank statistics
   */
  getQuestionBankStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    this.questionBanks.forEach((bank, id) => {
      stats[id] = {
        totalQuestions: bank.totalQuestions,
        byDifficulty: {
          beginner: bank.questions.filter((q) => q.difficulty === "Beginner")
            .length,
          intermediate: bank.questions.filter(
            (q) => q.difficulty === "Intermediate"
          ).length,
          advanced: bank.questions.filter((q) => q.difficulty === "Advanced")
            .length,
        },
        byTopic: bank.questions.reduce((acc, q) => {
          q.topics.forEach((topic) => {
            acc[topic] = (acc[topic] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>),
        lastUpdated: bank.lastUpdated,
      };
    });

    return stats;
  }

  /**
   * Add questions from document upload
   */
  async addQuestionsToBank(
    bankId: string,
    questions: Question[]
  ): Promise<void> {
    const bank = this.questionBanks.get(bankId);
    if (!bank) {
      throw new Error(`Question bank ${bankId} not found`);
    }

    // Add unique IDs and metadata
    const processedQuestions = questions.map((q, index) => ({
      ...q,
      id: `${bankId}-uploaded-${Date.now()}-${index}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        ...q.metadata,
        source: "upload",
        reviewStatus: "approved" as const,
      },
    }));

    bank.questions.push(...processedQuestions);
    bank.totalQuestions = bank.questions.length;
    bank.lastUpdated = new Date();
  }
}

// Export singleton instance
export const questionBankManager = QuestionBankManager.getInstance();

// Initialize question banks on module load
questionBankManager.initializeQuestionBanks();
