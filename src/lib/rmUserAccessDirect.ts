import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface RMUserAccess {
  id: string;
  userId: string;
  userEmail: string;
  examCategory: 'RM';
  hasAccess: boolean;
  accessMethod: 'payment' | 'admin' | 'code';
  accessGrantedAt: Date;
  accessExpiresAt?: Date;
  paymentInfo?: {
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionId: string;
    paymentDate: Date;
    paymentStatus: string;
  };
  rmAttempts: {
    [examId: string]: {
      attemptCount: number;
      lastAttemptAt: Date;
      bestScore?: number;
    };
  };
  adminSettings: {
    maxAttempts: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Grant RM access via payment (direct client SDK - bypasses quota)
export async function grantRMAccessViaPaymentDirect(
  userEmail: string,
  paymentInfo: {
    amount: number;
    currency: string;
    paymentMethod: string;
    transactionId: string;
    paymentDate: Date;
    paymentStatus: string;
  }
): Promise<{ success: boolean; message: string; data?: RMUserAccess }> {
  try {
    // First, find the user by email
    const usersQuery = query(
      collection(db, "users"),
      where("email", "==", userEmail)
    );
    
    const usersSnapshot = await getDocs(usersQuery);
    
    if (usersSnapshot.empty) {
      return {
        success: false,
        message: `No user found with email: ${userEmail}`
      };
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    // Create RM access document
    const rmAccessData: RMUserAccess = {
      id: userId,
      userId: userId,
      userEmail: userEmail,
      examCategory: 'RM',
      hasAccess: true,
      accessMethod: 'payment',
      accessGrantedAt: new Date(),
      paymentInfo: paymentInfo,
      rmAttempts: {},
      adminSettings: {
        maxAttempts: 1, // Default: 1 attempt per RM exam
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to Firestore using client SDK
    const rmAccessRef = doc(db, 'rmUserAccess', userId);
    await setDoc(rmAccessRef, rmAccessData);

    console.log(`✅ RM access granted to user ${userId} via payment (client SDK)`);
    
    return {
      success: true,
      message: 'RM access granted successfully',
      data: rmAccessData
    };

  } catch (error) {
    console.error('❌ Error granting RM access via payment (client SDK):', error);
    return {
      success: false,
      message: `Failed to grant RM access: ${error}`
    };
  }
}

// Check if user has RM access (direct client SDK)
export async function hasRMAccessDirect(userId: string): Promise<boolean> {
  try {
    const rmAccessRef = doc(db, 'rmUserAccess', userId);
    const rmAccessSnap = await getDoc(rmAccessRef);

    if (!rmAccessSnap.exists()) {
      return false;
    }

    const data = rmAccessSnap.data() as RMUserAccess;
    
    // Check if access is granted
    if (!data.hasAccess) {
      return false;
    }

    // Check expiry (if set)
    if (data.accessExpiresAt && new Date() > new Date(data.accessExpiresAt)) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking RM access (client SDK):', error);
    return false;
  }
}

// Get RM user access data (direct client SDK)
export async function getRMUserAccessDirect(userId: string): Promise<RMUserAccess | null> {
  try {
    const rmAccessRef = doc(db, 'rmUserAccess', userId);
    const rmAccessSnap = await getDoc(rmAccessRef);

    if (!rmAccessSnap.exists()) {
      return null;
    }

    return rmAccessSnap.data() as RMUserAccess;
  } catch (error) {
    console.error('Error getting RM user access (client SDK):', error);
    return null;
  }
}
