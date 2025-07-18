// src/lib/feedback.ts
import { db } from './firebase';
import { collection, doc, setDoc, getDocs, query, orderBy, where, Timestamp } from 'firebase/firestore';

interface Feedback {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  university: string;
  type: 'bug' | 'feature' | 'complaint' | 'compliment' | 'suggestion' | 'other';
  category: 'exam' | 'payment' | 'ui' | 'performance' | 'content' | 'other';
  subject: string;
  message: string;
  rating?: number; // 1-5 stars
  examId?: string; // If feedback is about a specific exam
  attachments?: string[]; // URLs to uploaded files
  status: 'new' | 'in-review' | 'resolved' | 'dismissed';
  adminResponse?: string;
  respondedBy?: string;
  respondedAt?: Date;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  userAgent?: string;
  platform?: string;
}

class FeedbackManager {
  private static instance: FeedbackManager;

  static getInstance(): FeedbackManager {
    if (!FeedbackManager.instance) {
      FeedbackManager.instance = new FeedbackManager();
    }
    return FeedbackManager.instance;
  }

  async submitFeedback(feedbackData: Omit<Feedback, 'id' | 'createdAt' | 'status' | 'priority'>): Promise<string> {
    try {
      const id = `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Auto-assign priority based on type and category
      let priority: Feedback['priority'] = 'medium';
      if (feedbackData.type === 'bug' && feedbackData.category === 'exam') {
        priority = 'high';
      } else if (feedbackData.type === 'complaint' && feedbackData.category === 'payment') {
        priority = 'urgent';
      } else if (feedbackData.type === 'bug') {
        priority = 'high';
      } else if (feedbackData.type === 'feature' || feedbackData.type === 'suggestion') {
        priority = 'low';
      }

      const feedback: Feedback = {
        ...feedbackData,
        id,
        createdAt: new Date(),
        status: 'new',
        priority,
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
        platform: typeof window !== 'undefined' ? window.navigator.platform : ''
      };

      await setDoc(doc(db, 'feedback', id), {
        ...feedback,
        createdAt: Timestamp.fromDate(feedback.createdAt)
      });

      return id;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw new Error('Failed to submit feedback');
    }
  }

  async getAllFeedback(): Promise<Feedback[]> {
    try {
      const feedbackRef = collection(db, 'feedback');
      const q = query(feedbackRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          respondedAt: data.respondedAt?.toDate()
        } as Feedback;
      });
    } catch (error) {
      console.error('Error getting feedback:', error);
      return [];
    }
  }

  async getFeedbackByUser(userId: string): Promise<Feedback[]> {
    try {
      const feedbackRef = collection(db, 'feedback');
      const q = query(
        feedbackRef, 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          respondedAt: data.respondedAt?.toDate()
        } as Feedback;
      });
    } catch (error) {
      console.error('Error getting user feedback:', error);
      return [];
    }
  }

  async updateFeedbackStatus(
    feedbackId: string, 
    status: Feedback['status'], 
    adminResponse?: string,
    adminId?: string
  ): Promise<void> {
    try {
      const updateData: any = { 
        status,
        respondedAt: Timestamp.fromDate(new Date())
      };
      
      if (adminResponse) {
        updateData.adminResponse = adminResponse;
      }
      
      if (adminId) {
        updateData.respondedBy = adminId;
      }

      await setDoc(doc(db, 'feedback', feedbackId), updateData, { merge: true });
    } catch (error) {
      console.error('Error updating feedback status:', error);
      throw new Error('Failed to update feedback');
    }
  }

  async getFeedbackStats(): Promise<{
    total: number;
    byStatus: Record<Feedback['status'], number>;
    byType: Record<Feedback['type'], number>;
    byPriority: Record<Feedback['priority'], number>;
    averageRating: number;
  }> {
    try {
      const feedback = await this.getAllFeedback();
      
      const stats = {
        total: feedback.length,
        byStatus: { new: 0, 'in-review': 0, resolved: 0, dismissed: 0 },
        byType: { bug: 0, feature: 0, complaint: 0, compliment: 0, suggestion: 0, other: 0 },
        byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
        averageRating: 0
      };

      let totalRating = 0;
      let ratingCount = 0;

      feedback.forEach(item => {
        stats.byStatus[item.status]++;
        stats.byType[item.type]++;
        stats.byPriority[item.priority]++;
        
        if (item.rating) {
          totalRating += item.rating;
          ratingCount++;
        }
      });

      stats.averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

      return stats;
    } catch (error) {
      console.error('Error getting feedback stats:', error);
      return {
        total: 0,
        byStatus: { new: 0, 'in-review': 0, resolved: 0, dismissed: 0 },
        byType: { bug: 0, feature: 0, complaint: 0, compliment: 0, suggestion: 0, other: 0 },
        byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
        averageRating: 0
      };
    }
  }
}

export const feedbackManager = FeedbackManager.getInstance();
export type { Feedback };
