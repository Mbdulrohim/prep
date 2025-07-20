// src/lib/firebase-admin.ts
import {
  initializeApp,
  getApps,
  cert,
  ServiceAccount,
  App,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// For production, we'll use the default credentials
// For now, let's use a simpler approach that works with your current setup
let adminApp: App;
let adminDb: any;

try {
  // Check if admin app already exists
  adminApp =
    getApps().find((app: App) => app.name === "admin") ||
    initializeApp(
      {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      },
      "admin"
    );

  adminDb = getFirestore(adminApp);
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
  // Fallback to client SDK for now
  adminDb = null;
}

export { adminDb };
export default adminApp;
