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

// Initialize admin app with non-nullable types for build time
const adminApp: App = !getApps().length
  ? initializeApp({
      credential: cert(serviceAccount as ServiceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
    })
  : getApps()[0];

const adminDb = getFirestore(adminApp);

export { adminDb };
export default adminApp;
