import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/databaseClean';
import { RMExam } from '@/lib/entities/RMExam';

// Import the exam data from examData.ts structure
const RM_EXAM_DATA = [
  {
    id: "rm-paper-1",
    title: "RM Paper 1",
    paper: "paper1",
    description: "Midwifery fundamentals, maternal care, and reproductive health basics.",
    duration: 150, // 2.5 hours
    totalQuestions: 250,
    passingScore: 70,
    topics: [
      "Reproductive Health",
      "Antenatal Care", 
      "Normal Labor & Birth",
      "Postpartum Care",
      "Newborn Care",
      "Family Planning",
      "Infection Control",
      "Emergency Obstetrics"
    ],
    instructions: {
      general: [
        "Read each question carefully before selecting your answer",
        "You have 150 minutes (2.5 hours) to complete all 250 questions",
        "Each question has only one correct answer",
        "You can flag questions for review and return to them later",
        "Submit your exam before the time expires"
      ],
      guidelines: [
        "Ensure stable internet connection throughout the exam",
        "Do not refresh the browser during the exam",
        "Contact support immediately if you experience technical issues",
        "Maintain exam integrity - no external assistance allowed"
      ]
    },
    settings: {
      timeLimit: 150,
      questionsPerPage: 1,
      allowReview: true,
      shuffleQuestions: true,
      shuffleOptions: true,
      showProgress: true,
      autoSave: true
    }
  },
  {
    id: "rm-paper-2", 
    title: "RM Paper 2",
    paper: "paper2",
    description: "Advanced midwifery practice, high-risk pregnancies, and specialized care.",
    duration: 150, // 2.5 hours
    totalQuestions: 250,
    passingScore: 70,
    topics: [
      "High-Risk Pregnancies",
      "Obstetric Emergencies", 
      "Neonatal Complications",
      "Advanced Procedures",
      "Research & Evidence",
      "Professional Practice",
      "Midwifery Management",
      "Ethics & Legal Issues"
    ],
    instructions: {
      general: [
        "Read each question carefully before selecting your answer",
        "You have 150 minutes (2.5 hours) to complete all 250 questions", 
        "Each question has only one correct answer",
        "You can flag questions for review and return to them later",
        "Submit your exam before the time expires"
      ],
      guidelines: [
        "Ensure stable internet connection throughout the exam",
        "Do not refresh the browser during the exam", 
        "Contact support immediately if you experience technical issues",
        "Maintain exam integrity - no external assistance allowed"
      ]
    },
    settings: {
      timeLimit: 150,
      questionsPerPage: 1,
      allowReview: true,
      shuffleQuestions: true,
      shuffleOptions: true,
      showProgress: true,
      autoSave: true
    }
  }
];

export async function POST(request: NextRequest) {
  try {
    const examRepository = await getRepository(RMExam);
    
    const results = [];
    
    for (const examData of RM_EXAM_DATA) {
      // Check if exam already exists by paper type
      let exam = await examRepository.findOne({
        where: { paper: examData.paper }
      });
      
      if (exam) {
        // Update existing exam with new data
        exam = examRepository.merge(exam, {
          title: examData.title,
          description: examData.description,
          topics: examData.topics,
          duration: examData.duration,
          passingScore: examData.passingScore,
          instructions: examData.instructions,
          settings: examData.settings,
          updatedAt: new Date()
        });
        
        await examRepository.save(exam);
        results.push({ action: 'updated', paper: examData.paper, id: exam.id });
      } else {
        // Create new exam
        exam = examRepository.create({
          title: examData.title,
          paper: examData.paper,
          description: examData.description,
          topics: examData.topics,
          duration: examData.duration,
          totalQuestions: examData.totalQuestions,
          passingScore: examData.passingScore,
          instructions: examData.instructions,
          settings: examData.settings,
          isActive: true,
          isPublished: false, // Not published until questions are added
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        await examRepository.save(exam);
        results.push({ action: 'created', paper: examData.paper, id: exam.id });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'RM exams populated successfully',
        results,
        examData: RM_EXAM_DATA.map(e => ({
          paper: e.paper,
          title: e.title,
          topics: e.topics,
          description: e.description
        }))
      }
    });

  } catch (error) {
    console.error('Error populating RM exams:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to populate RM exams'
    }, { status: 500 });
  }
}
