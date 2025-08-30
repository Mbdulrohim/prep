// src/lib/firebase-admin.ts
import {
  initializeApp,
  getApps,
  cert,
  ServiceAccount,
  App,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Fallback service account for build time
const fallbackServiceAccount = {
  type: "service_account",
  project_id: "demo-project",
  private_key_id: "demo-key-id",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC+demo+demo\n-----END PRIVATE KEY-----\n",
  client_email: "demo@demo-project.iam.gserviceaccount.com",
  client_id: "demo-client-id",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/demo%40demo-project.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY 
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : fallbackServiceAccount;

// Only initialize admin app in runtime, not during build
let adminApp: App | null = null;
let adminDb: any = null;

// Check if we're in a build environment
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!isBuildTime) {
  try {
    adminApp = !getApps().length
      ? initializeApp({
          credential: cert(serviceAccount as ServiceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
        })
      : getApps()[0];
    
    adminDb = getFirestore(adminApp);
  } catch (error) {
    console.warn('Firebase Admin SDK not initialized:', error);
    // Create a mock adminDb for build time
    adminDb = {
      collection: () => ({
        doc: () => ({
          get: async () => ({ exists: false, data: () => null }),
          set: async () => {},
          update: async () => {},
        }),
        where: () => ({
          get: async () => ({ docs: [], empty: true }),
        }),
        get: async () => ({ docs: [], empty: true }),
      }),
    };
  }
} else {
  // Mock adminDb for build time
  adminDb = {
    collection: () => ({
      doc: () => ({
        get: async () => ({ exists: false, data: () => null }),
        set: async () => {},
        update: async () => {},
      }),
      where: () => ({
        get: async () => ({ docs: [], empty: true }),
      }),
      get: async () => ({ docs: [], empty: true }),
    }),
  };
}

export { adminDb };
export default adminApp;
