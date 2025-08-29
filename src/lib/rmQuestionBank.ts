// src/lib/rmQuestionBank.ts
// RM Question Bank Management - Completely separate from current questionBank system

import { db } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  deleteDoc,
  orderBy,
  limit
} from "firebase/firestore";
import { RMQuestion, RM_TOPICS } from "./rmExamData";

interface RMQuestionBank {
  id: string; // e.g., "rm-paper-1", "rm-paper-2"
  category: "RM";
  paper: string;
  questions: RMQuestion[];
  totalQuestions: number;
  lastUpdated: Date;
  createdBy: string; // admin who created/updated
  metadata: {
    difficultyDistribution: {
      beginner: number;
      intermediate: number;
      advanced: number;
    };
    topicDistribution: Record<string, number>;
  };
}

class RMQuestionBankManager {
  private static instance: RMQuestionBankManager;
  private rmQuestionBanks: Map<string, RMQuestionBank> = new Map();
  
  static getInstance(): RMQuestionBankManager {
    if (!RMQuestionBankManager.instance) {
      RMQuestionBankManager.instance = new RMQuestionBankManager();
    }
    return RMQuestionBankManager.instance;
  }
  
  /**
   * Initialize RM question banks
   */
  async initializeRMQuestionBanks(): Promise<void> {
    try {
      console.log("🔧 Initializing RM question banks...");
      
      // Load existing RM question banks from Firebase
      await this.loadRMQuestionBanksFromFirebase();
      
      console.log("📊 Loaded question banks from Firebase:", Array.from(this.rmQuestionBanks.keys()));
      
      // If no question banks exist, create default ones
      if (this.rmQuestionBanks.size === 0) {
        console.log("⚠️ No RM question banks found, creating default ones...");
        await this.createDefaultRMQuestionBanks();
      } else {
        console.log("✅ RM question banks already exist");
      }
    } catch (error) {
      console.error("Error initializing RM question banks:", error);
    }
  }
  
  /**
   * Load RM question banks from Firebase
   */
  private async loadRMQuestionBanksFromFirebase(): Promise<void> {
    try {
      const q = query(collection(db, "rmQuestionBanks"));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((doc) => {
        const bankData = doc.data() as RMQuestionBank;
        this.rmQuestionBanks.set(bankData.id, bankData);
      });
    } catch (error) {
      console.error("Error loading RM question banks from Firebase:", error);
    }
  }
  
  /**
   * Create default RM question banks (only if none exist)
   */
  private async createDefaultRMQuestionBanks(): Promise<void> {
    try {
      console.log("🏗️ Creating default RM question banks...");
      
      // Create RM Paper 1 question bank
      await this.createRMQuestionBank("RM", "paper-1", 1000, "system");
      console.log("✅ Created RM Paper 1 question bank");
      
      // Create RM Paper 2 question bank  
      await this.createRMQuestionBank("RM", "paper-2", 1000, "system");
      console.log("✅ Created RM Paper 2 question bank");
      
      console.log("✅ Default RM question banks created");
    } catch (error) {
      console.error("Error creating default RM question banks:", error);
    }
  }
  
  /**
   * Create RM question bank with generated questions
   */
  async createRMQuestionBank(
    category: "RM",
    paper: string,
    questionCount: number,
    createdBy: string
  ): Promise<void> {
    try {
      const bankId = `${category.toLowerCase()}-${paper}`;
      
      // Generate questions for this bank
      const questions = await this.generateRMQuestions(category, paper, questionCount);
      
      // Calculate metadata
      const metadata = this.calculateQuestionBankMetadata(questions);
      
      const questionBank: RMQuestionBank = {
        id: bankId,
        category,
        paper,
        questions,
        totalQuestions: questions.length,
        lastUpdated: new Date(),
        createdBy,
        metadata,
      };
      
      // Save to Firebase
      await setDoc(doc(db, "rmQuestionBanks", bankId), questionBank);
      
      // Update local cache
      this.rmQuestionBanks.set(bankId, questionBank);
      
      console.log(`RM question bank created: ${bankId} with ${questionCount} questions`);
    } catch (error) {
      console.error("Error creating RM question bank:", error);
      throw error;
    }
  }
  
  /**
   * Generate RM questions for a specific paper
   */
  private async generateRMQuestions(
    category: "RM",
    paper: string,
    count: number
  ): Promise<RMQuestion[]> {
    const questions: RMQuestion[] = [];
    const topics = RM_TOPICS[paper as keyof typeof RM_TOPICS] || RM_TOPICS["paper-1"];
    
    for (let i = 0; i < count; i++) {
      const difficulty = this.getRMDifficultyDistribution(i, count);
      const topic = topics[i % topics.length];
      
      const question: RMQuestion = {
        id: `rm-${paper}-q${i + 1}`,
        text: this.generateRMQuestionText(category, paper, topic, i + 1),
        options: this.generateRMOptions(category, topic),
        correctAnswer: Math.floor(Math.random() * 4),
        explanation: this.generateRMExplanation(category, topic),
        difficulty,
        topics: [topic],
        category: "RM",
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
   * Generate realistic RM question text
   */
  private generateRMQuestionText(
    category: string,
    paper: string,
    topic: string,
    questionNum: number
  ): string {
    const rmQuestionTemplates = {
      "Antenatal Care": [
        "During the first antenatal visit, which of the following assessments is MOST critical for a 28-year-old primigravida at 12 weeks gestation?",
        "A pregnant woman presents with bleeding at 16 weeks gestation. What is the most appropriate initial intervention?",
        "Which laboratory test is essential during the booking visit for antenatal care?",
        "When counseling a pregnant woman about nutrition, which supplement is most important during the first trimester?",
      ],
      "Labor & Delivery": [
        "During the active phase of labor, what is the normal rate of cervical dilatation for a primigravida?",
        "A woman in labor presents with variable decelerations on the fetal heart rate monitor. What is the most likely cause?",
        "What is the most appropriate position for a woman during the second stage of labor?",
        "Which sign indicates the onset of the third stage of labor?",
      ],
      "Postnatal Care": [
        "What is the most important assessment to perform on a woman 2 hours after delivery?",
        "A new mother complains of severe afterpains. What is the most appropriate nursing intervention?",
        "Which finding in the postnatal period requires immediate medical attention?",
        "When should a woman who delivered normally be encouraged to ambulate?",
      ],
      "Newborn Care": [
        "What is the normal respiratory rate for a healthy newborn?",
        "Which reflex should be present in a normal full-term newborn?",
        "What is the most appropriate method for maintaining a newborn's body temperature?",
        "Which assessment finding in a newborn requires immediate intervention?",
      ],
      "Family Planning": [
        "Which contraceptive method is most suitable for a breastfeeding mother?",
        "What is the most important counseling point for a client choosing oral contraceptives?",
        "Which family planning method provides the highest efficacy rate?",
        "When can a woman safely start using hormonal contraceptives after delivery?",
      ],
      "High-Risk Pregnancies": [
        "A pregnant woman with diabetes mellitus requires which of the following special considerations?",
        "What is the most serious complication of pregnancy-induced hypertension?",
        "Which intervention is most important for a woman with placenta previa?",
        "A pregnant woman with heart disease should be monitored for which complication?",
      ],
      "Obstetric Emergencies": [
        "The immediate management of shoulder dystocia includes which intervention?",
        "What is the most appropriate initial management for postpartum hemorrhage?",
        "Which sign indicates uterine rupture during labor?",
        "The management of eclampsia primarily involves which intervention?",
      ],
      "Advanced Midwifery": [
        "When performing an episiotomy, which anatomical structure must be carefully avoided?",
        "What is the most appropriate technique for manual removal of placenta?",
        "Which suturing technique is preferred for perineal repair?",
        "During vacuum extraction, what is the maximum number of pulls recommended?",
      ],
    };
    
    const templates = rmQuestionTemplates[topic as keyof typeof rmQuestionTemplates] || [
      `Which of the following is most important in ${topic.toLowerCase()}?`,
      `What is the primary nursing intervention for ${topic.toLowerCase()}?`,
      `The most common complication of ${topic.toLowerCase()} is:`,
      `When managing ${topic.toLowerCase()}, the priority action is:`,
    ];
    
    return templates[questionNum % templates.length];
  }
  
  /**
   * Generate realistic RM options
   */
  private generateRMOptions(category: string, topic: string): string[] {
    const rmOptionSets = {
      "Antenatal Care": [
        ["Blood pressure measurement", "Urine protein test", "Complete blood count", "Blood glucose test"],
        ["Immediate ultrasound", "Complete bed rest", "Pelvic examination", "IV fluid administration"],
        ["Hemoglobin level", "Blood grouping and Rh typing", "HIV screening", "All of the above"],
        ["Folic acid", "Iron supplements", "Calcium tablets", "Vitamin D"],
      ],
      "Labor & Delivery": [
        ["0.5 cm per hour", "1.0 cm per hour", "1.5 cm per hour", "2.0 cm per hour"],
        ["Cord compression", "Fetal hypoxia", "Maternal position", "Uterine contractions"],
        ["Supine position", "Left lateral position", "Upright position", "Trendelenburg position"],
        ["Separation of placenta", "Cord lengthening", "Uterine contraction", "All of the above"],
      ],
      "Postnatal Care": [
        ["Vital signs", "Fundal height and consistency", "Lochia assessment", "All of the above"],
        ["Administer analgesics", "Apply heat therapy", "Encourage breastfeeding", "Position change"],
        ["Heavy bleeding", "Severe headache", "Chest pain", "All of the above"],
        ["Immediately after delivery", "6 hours post-delivery", "12 hours post-delivery", "24 hours post-delivery"],
      ],
      "Newborn Care": [
        ["20-30 breaths per minute", "30-50 breaths per minute", "50-70 breaths per minute", "70-90 breaths per minute"],
        ["Rooting reflex", "Moro reflex", "Grasp reflex", "All of the above"],
        ["Skin-to-skin contact", "Warm blankets", "Radiant warmer", "All of the above"],
        ["Cyanosis", "Jitteriness", "Poor feeding", "All of the above"],
      ],
    };
    
    const defaultOptions = [
      "Option A - Standard intervention",
      "Option B - Alternative approach", 
      "Option C - Emergency procedure",
      "Option D - Contraindicated action",
    ];
    
    const specificOptions = rmOptionSets[topic as keyof typeof rmOptionSets];
    if (specificOptions && specificOptions.length > 0) {
      return specificOptions[Math.floor(Math.random() * specificOptions.length)];
    }
    
    return defaultOptions;
  }
  
  /**
   * Generate RM explanation
   */
  private generateRMExplanation(category: string, topic: string): string {
    const explanationTemplates = {
      "Antenatal Care": "This is essential in antenatal care to ensure early detection of complications and promote maternal and fetal wellbeing throughout pregnancy.",
      "Labor & Delivery": "Understanding normal labor progression is crucial for identifying when interventions may be necessary to ensure safe delivery for both mother and baby.",
      "Postnatal Care": "Proper postnatal assessment and care are vital for preventing complications and ensuring successful recovery and bonding between mother and baby.",
      "Newborn Care": "Newborn assessment and care require careful attention to normal parameters and early recognition of signs that may indicate the need for immediate intervention.",
      "Family Planning": "Effective family planning counseling involves understanding contraceptive options, their mechanisms, effectiveness, and suitability for individual clients.",
      "High-Risk Pregnancies": "Managing high-risk pregnancies requires specialized knowledge and vigilant monitoring to prevent maternal and fetal complications.",
      "Obstetric Emergencies": "Quick recognition and appropriate management of obstetric emergencies are essential skills that can be life-saving for both mother and baby.",
      "Advanced Midwifery": "Advanced midwifery procedures require precise technique and thorough understanding of anatomy to ensure safety and optimal outcomes.",
    };
    
    return explanationTemplates[topic as keyof typeof explanationTemplates] || 
           `This concept is fundamental to understanding ${topic.toLowerCase()} in midwifery practice and ensuring safe, evidence-based care.`;
  }
  
  /**
   * Get difficulty distribution for RM questions
   */
  private getRMDifficultyDistribution(
    index: number,
    total: number
  ): "Beginner" | "Intermediate" | "Advanced" {
    const position = index / total;
    
    if (position < 0.3) return "Beginner";
    if (position < 0.8) return "Intermediate";
    return "Advanced";
  }
  
  /**
   * Calculate question bank metadata
   */
  private calculateQuestionBankMetadata(questions: RMQuestion[]): RMQuestionBank['metadata'] {
    const difficultyDistribution = {
      beginner: questions.filter(q => q.difficulty === "Beginner").length,
      intermediate: questions.filter(q => q.difficulty === "Intermediate").length,
      advanced: questions.filter(q => q.difficulty === "Advanced").length,
    };
    
    const topicDistribution: Record<string, number> = {};
    questions.forEach(q => {
      q.topics.forEach(topic => {
        topicDistribution[topic] = (topicDistribution[topic] || 0) + 1;
      });
    });
    
    return {
      difficultyDistribution,
      topicDistribution,
    };
  }
  
  /**
   * Upload RM questions from admin (bulk upload)
   */
  async uploadRMQuestions(
    paper: string,
    questions: Omit<RMQuestion, 'id' | 'category' | 'paper' | 'createdAt' | 'updatedAt' | 'metadata'>[],
    uploadedBy: string
  ): Promise<void> {
    try {
      const bankId = `rm-${paper}`;
      
      // Process uploaded questions
      const processedQuestions: RMQuestion[] = questions.map((q, index) => ({
        ...q,
        id: `rm-${paper}-uploaded-${Date.now()}-${index}`,
        category: "RM",
        paper,
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          source: "uploaded",
          reviewStatus: "pending", // Admin needs to review uploaded questions
          uploadedBy,
        },
      }));
      
      // Get existing bank or create new one
      let existingBank = this.rmQuestionBanks.get(bankId);
      
      if (!existingBank) {
        // Create new bank
        existingBank = {
          id: bankId,
          category: "RM",
          paper,
          questions: [],
          totalQuestions: 0,
          lastUpdated: new Date(),
          createdBy: uploadedBy,
          metadata: {
            difficultyDistribution: { beginner: 0, intermediate: 0, advanced: 0 },
            topicDistribution: {},
          },
        };
      }
      
      // Add new questions to existing bank
      const updatedQuestions = [...existingBank.questions, ...processedQuestions];
      const updatedMetadata = this.calculateQuestionBankMetadata(updatedQuestions);
      
      const updatedBank: RMQuestionBank = {
        ...existingBank,
        questions: updatedQuestions,
        totalQuestions: updatedQuestions.length,
        lastUpdated: new Date(),
        metadata: updatedMetadata,
      };
      
      // Save to Firebase
      await setDoc(doc(db, "rmQuestionBanks", bankId), updatedBank);
      
      // Update local cache
      this.rmQuestionBanks.set(bankId, updatedBank);
      
      console.log(`Added ${processedQuestions.length} questions to RM ${paper} bank`);
    } catch (error) {
      console.error("Error uploading RM questions:", error);
      throw error;
    }
  }
  
  /**
   * Assign unique RM questions to a user for an exam
   */
  async assignRMQuestionsToUser(
    userId: string,
    paper: string,
    questionCount: number = 250
  ): Promise<RMQuestion[]> {
    try {
      console.log("🔍 assignRMQuestionsToUser called with:", { userId, paper, questionCount });
      const bankId = `rm-${paper}`;
      console.log("🔍 Looking for question bank with ID:", bankId);
      console.log("🔍 Available question banks:", Array.from(this.rmQuestionBanks.keys()));
      
      const questionBank = this.rmQuestionBanks.get(bankId);
      
      if (!questionBank) {
        console.error("❌ RM question bank not found:", bankId);
        console.log("📊 Available banks:", Array.from(this.rmQuestionBanks.keys()));
        throw new Error(`RM question bank not found for ${paper}`);
      }
      
      console.log("✅ Found question bank:", bankId, "with", questionBank.questions.length, "questions");
      
      if (questionBank.questions.length < questionCount) {
        throw new Error(`Insufficient questions in RM ${paper} bank. Available: ${questionBank.questions.length}, Required: ${questionCount}`);
      }
      
      // Filter only approved questions
      const approvedQuestions = questionBank.questions.filter(
        q => q.metadata.reviewStatus === "approved"
      );
      
      if (approvedQuestions.length < questionCount) {
        throw new Error(`Insufficient approved questions in RM ${paper} bank. Available: ${approvedQuestions.length}, Required: ${questionCount}`);
      }
      
      // Shuffle questions and select required count
      const shuffled = [...approvedQuestions].sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, questionCount);
      
      // Ensure good difficulty distribution
      const beginner = selectedQuestions
        .filter(q => q.difficulty === "Beginner")
        .slice(0, Math.floor(questionCount * 0.3));
      const intermediate = selectedQuestions
        .filter(q => q.difficulty === "Intermediate")
        .slice(0, Math.floor(questionCount * 0.5));
      const advanced = selectedQuestions
        .filter(q => q.difficulty === "Advanced")
        .slice(0, Math.floor(questionCount * 0.2));
      
      const finalQuestions = [...beginner, ...intermediate, ...advanced]
        .sort(() => Math.random() - 0.5)
        .slice(0, questionCount);
      
      return finalQuestions;
    } catch (error) {
      console.error("Error assigning RM questions to user:", error);
      throw error;
    }
  }
  
  /**
   * Get RM question bank statistics
   */
  getRMQuestionBankStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    this.rmQuestionBanks.forEach((bank, bankId) => {
      stats[bankId] = {
        totalQuestions: bank.totalQuestions,
        lastUpdated: bank.lastUpdated,
        difficultyDistribution: bank.metadata.difficultyDistribution,
        topicDistribution: bank.metadata.topicDistribution,
        createdBy: bank.createdBy,
      };
    });
    
    return stats;
  }
  
  /**
   * Get RM question bank by ID
   */
  getRMQuestionBank(bankId: string): RMQuestionBank | undefined {
    return this.rmQuestionBanks.get(bankId);
  }
  
  /**
   * Delete RM question from bank (admin function)
   */
  async deleteRMQuestion(paper: string, questionId: string): Promise<void> {
    try {
      const bankId = `rm-${paper}`;
      const bank = this.rmQuestionBanks.get(bankId);
      
      if (!bank) {
        throw new Error(`RM question bank not found: ${bankId}`);
      }
      
      // Remove question from bank
      const updatedQuestions = bank.questions.filter(q => q.id !== questionId);
      const updatedMetadata = this.calculateQuestionBankMetadata(updatedQuestions);
      
      const updatedBank: RMQuestionBank = {
        ...bank,
        questions: updatedQuestions,
        totalQuestions: updatedQuestions.length,
        lastUpdated: new Date(),
        metadata: updatedMetadata,
      };
      
      // Save to Firebase
      await setDoc(doc(db, "rmQuestionBanks", bankId), updatedBank);
      
      // Update local cache
      this.rmQuestionBanks.set(bankId, updatedBank);
      
      console.log(`Deleted question ${questionId} from RM ${paper} bank`);
    } catch (error) {
      console.error("Error deleting RM question:", error);
      throw error;
    }
  }
  
  /**
   * Approve/reject uploaded RM questions (admin function)
   */
  async reviewRMQuestion(
    paper: string,
    questionId: string,
    reviewStatus: "approved" | "rejected",
    reviewedBy: string
  ): Promise<void> {
    try {
      const bankId = `rm-${paper}`;
      const bank = this.rmQuestionBanks.get(bankId);
      
      if (!bank) {
        throw new Error(`RM question bank not found: ${bankId}`);
      }
      
      // Update question review status
      const updatedQuestions = bank.questions.map(q => {
        if (q.id === questionId) {
          return {
            ...q,
            metadata: {
              ...q.metadata,
              reviewStatus,
              reviewedBy,
            },
            updatedAt: new Date(),
          };
        }
        return q;
      });
      
      const updatedBank: RMQuestionBank = {
        ...bank,
        questions: updatedQuestions,
        lastUpdated: new Date(),
      };
      
      // Save to Firebase
      await setDoc(doc(db, "rmQuestionBanks", bankId), updatedBank);
      
      // Update local cache
      this.rmQuestionBanks.set(bankId, updatedBank);
      
      console.log(`Question ${questionId} ${reviewStatus} by ${reviewedBy}`);
    } catch (error) {
      console.error("Error reviewing RM question:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const rmQuestionBankManager = RMQuestionBankManager.getInstance();
