// src/lib/firebase-admin.ts
import {
  initializeApp,
  getApps,
  cert,
  ServiceAccount,
  App,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Only initialize admin app in runtime, not during build
let adminApp: App | null = null;
let adminDb: any = null;

// Check if we're in a server environment and have Firebase credentials
const isServer = typeof window === "undefined";
const hasServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (isServer && hasServiceAccount) {
  try {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY!
    );

    adminApp = !getApps().length
      ? initializeApp({
          credential: cert(serviceAccount as ServiceAccount),
          projectId:
            process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
        })
      : getApps()[0];

    adminDb = getFirestore(adminApp);
    console.log("✅ Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.warn("❌ Firebase Admin SDK initialization failed:", error);
    adminDb = createMockAdminDb();
  }
} else {
  console.warn(
    "⚠️ Using mock Firebase Admin SDK (no service account or not server environment)"
  );
  adminDb = createMockAdminDb();
}

function createMockAdminDb() {
  return {
    collection: (path: string) => ({
      doc: (id: string) => ({
        get: async () => ({
          exists: false,
          data: () => null,
          id,
        }),
        set: async (data: any) => {
          throw new Error(
            `Mock Firebase Admin SDK: Cannot write to ${path}/${id}. Service account required.`
          );
        },
        update: async (data: any) => {
          throw new Error(
            `Mock Firebase Admin SDK: Cannot update ${path}/${id}. Service account required.`
          );
        },
      }),
      where: (field: string, operator: string, value: any) => ({
        get: async () => ({
          docs: [],
          empty: true,
        }),
      }),
      get: async () => ({
        docs: [],
        empty: true,
      }),
    }),
  };
}

export { adminDb };
export default adminApp;
