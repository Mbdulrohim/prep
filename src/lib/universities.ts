// src/lib/universities.ts
import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";

interface University {
  id: string;
  name: string;
  shortName?: string;
  location?: string;
  type: "federal" | "state" | "private";
  verified: boolean;
  addedBy: "admin" | "user";
  createdAt: Date;
  studentCount: number;
}

class UniversityManager {
  private static instance: UniversityManager;
  private universities: University[] = [];
  private lastFetch: number = 0;
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): UniversityManager {
    if (!UniversityManager.instance) {
      UniversityManager.instance = new UniversityManager();
    }
    return UniversityManager.instance;
  }

  // Pre-populate with major Nigerian universities
  private defaultUniversities: Omit<
    University,
    "id" | "createdAt" | "studentCount"
  >[] = [
    // Federal Universities
    {
      name: "University of Lagos",
      shortName: "UNILAG",
      location: "Lagos",
      type: "federal",
      verified: true,
      addedBy: "admin",
    },
    {
      name: "University of Ibadan",
      shortName: "UI",
      location: "Ibadan",
      type: "federal",
      verified: true,
      addedBy: "admin",
    },
    {
      name: "Ahmadu Bello University",
      shortName: "ABU",
      location: "Zaria",
      type: "federal",
      verified: true,
      addedBy: "admin",
    },
    {
      name: "University of Nigeria Nsukka",
      shortName: "UNN",
      location: "Nsukka",
      type: "federal",
      verified: true,
      addedBy: "admin",
    },
    {
      name: "Obafemi Awolowo University",
      shortName: "OAU",
      location: "Ile-Ife",
      type: "federal",
      verified: true,
      addedBy: "admin",
    },
    {
      name: "University of Benin",
      shortName: "UNIBEN",
      location: "Benin City",
      type: "federal",
      verified: true,
      addedBy: "admin",
    },
    {
      name: "University of Calabar",
      shortName: "UNICAL",
      location: "Calabar",
      type: "federal",
      verified: true,
      addedBy: "admin",
    },
    {
      name: "University of Jos",
      shortName: "UNIJOS",
      location: "Jos",
      type: "federal",
      verified: true,
      addedBy: "admin",
    },
    {
      name: "University of Maiduguri",
      shortName: "UNIMAID",
      location: "Maiduguri",
      type: "federal",
      verified: true,
      addedBy: "admin",
    },
    {
      name: "University of Port Harcourt",
      shortName: "UNIPORT",
      location: "Port Harcourt",
      type: "federal",
      verified: true,
      addedBy: "admin",
    },

    // State Universities
    {
      name: "Lagos State University",
      shortName: "LASU",
      location: "Lagos",
      type: "state",
      verified: true,
      addedBy: "admin",
    },
    {
      name: "Kaduna State University",
      shortName: "KASU",
      location: "Kaduna",
      type: "state",
      verified: true,
      addedBy: "admin",
    },
    {
      name: "Rivers State University",
      shortName: "RSU",
      location: "Port Harcourt",
      type: "state",
      verified: true,
      addedBy: "admin",
    },
    {
      name: "Kano State University",
      shortName: "KASU",
      location: "Kano",
      type: "state",
      verified: true,
      addedBy: "admin",
    },

    // Private Universities
    {
      name: "Covenant University",
      shortName: "CU",
      location: "Ota",
      type: "private",
      verified: true,
      addedBy: "admin",
    },
    {
      name: "Babcock University",
      shortName: "BU",
      location: "Ilishan-Remo",
      type: "private",
      verified: true,
      addedBy: "admin",
    },
    {
      name: "American University of Nigeria",
      shortName: "AUN",
      location: "Yola",
      type: "private",
      verified: true,
      addedBy: "admin",
    },
    {
      name: "Bowen University",
      shortName: "BU",
      location: "Iwo",
      type: "private",
      verified: true,
      addedBy: "admin",
    },

    // Nursing Schools (Key for our platform)
    {
      name: "University of Lagos School of Nursing",
      shortName: "UNILAG SON",
      location: "Lagos",
      type: "federal",
      verified: true,
      addedBy: "admin",
    },
    {
      name: "University College Hospital School of Nursing",
      shortName: "UCH SON",
      location: "Ibadan",
      type: "federal",
      verified: true,
      addedBy: "admin",
    },
    {
      name: "Lagos University Teaching Hospital School of Nursing",
      shortName: "LUTH SON",
      location: "Lagos",
      type: "federal",
      verified: true,
      addedBy: "admin",
    },
    {
      name: "National Hospital School of Nursing",
      shortName: "NHSON",
      location: "Abuja",
      type: "federal",
      verified: true,
      addedBy: "admin",
    },
    {
      name: "Ahmadu Bello University Teaching Hospital School of Nursing",
      shortName: "ABUTH SON",
      location: "Zaria",
      type: "federal",
      verified: true,
      addedBy: "admin",
    },
  ];

  async initializeUniversities(): Promise<void> {
    try {
      // Check if universities are already initialized
      const universitiesRef = collection(db, "universities");
      const snapshot = await getDocs(query(universitiesRef, limit(1)));

      if (snapshot.empty) {
        console.log("Initializing university database...");

        for (const uni of this.defaultUniversities) {
          const id = uni.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
          await setDoc(doc(db, "universities", id), {
            ...uni,
            id,
            createdAt: new Date(),
            studentCount: 0,
          });
        }

        console.log("University database initialized successfully");
      }
    } catch (error) {
      console.error("Error initializing universities:", error);
    }
  }

  async searchUniversities(searchTerm: string): Promise<University[]> {
    if (!searchTerm || searchTerm.length < 2) return [];

    try {
      // Check cache first
      if (
        Date.now() - this.lastFetch < this.CACHE_DURATION &&
        this.universities.length > 0
      ) {
        return this.filterUniversities(searchTerm);
      }

      // Fetch from Firestore
      const universitiesRef = collection(db, "universities");
      const q = query(universitiesRef, orderBy("name"));
      const snapshot = await getDocs(q);

      this.universities = snapshot.docs.map(
        (doc) => ({ ...doc.data(), id: doc.id } as University)
      );
      this.lastFetch = Date.now();

      return this.filterUniversities(searchTerm);
    } catch (error) {
      console.error("Error searching universities:", error);
      return [];
    }
  }

  private filterUniversities(searchTerm: string): University[] {
    const term = searchTerm.toLowerCase();
    return this.universities
      .filter(
        (uni) =>
          uni.name.toLowerCase().includes(term) ||
          uni.shortName?.toLowerCase().includes(term) ||
          uni.location?.toLowerCase().includes(term)
      )
      .sort((a, b) => {
        // Prioritize verified universities
        if (a.verified && !b.verified) return -1;
        if (!a.verified && b.verified) return 1;

        // Then by exact match
        if (a.name.toLowerCase().startsWith(term)) return -1;
        if (b.name.toLowerCase().startsWith(term)) return 1;

        return 0;
      })
      .slice(0, 10); // Limit to 10 results
  }

  async addNewUniversity(
    name: string,
    userId: string
  ): Promise<University | null> {
    try {
      // Check if university already exists
      const existing = this.universities.find(
        (uni) => uni.name.toLowerCase() === name.toLowerCase()
      );

      if (existing) {
        return existing;
      }

      const id = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const newUniversity: University = {
        id,
        name: name.trim(),
        type: "private", // Default to private, admin can change later
        verified: false,
        addedBy: "user",
        createdAt: new Date(),
        studentCount: 1,
      };

      await setDoc(doc(db, "universities", id), newUniversity);

      // Add to local cache
      this.universities.push(newUniversity);

      // Log the addition for admin review
      await setDoc(doc(db, "universityRequests", `${id}_${Date.now()}`), {
        universityId: id,
        universityName: name,
        requestedBy: userId,
        requestedAt: new Date(),
        status: "pending",
      });

      return newUniversity;
    } catch (error) {
      console.error("Error adding new university:", error);
      return null;
    }
  }

  async getAllUniversities(): Promise<University[]> {
    try {
      const universitiesRef = collection(db, "universities");
      const q = query(universitiesRef, orderBy("name"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(
        (doc) => ({ ...doc.data(), id: doc.id } as University)
      );
    } catch (error) {
      console.error("Error getting all universities:", error);
      return [];
    }
  }

  async updateUniversityStudentCount(universityName: string): Promise<void> {
    try {
      const id = universityName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const docRef = doc(db, "universities", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const currentCount = docSnap.data().studentCount || 0;
        await setDoc(
          docRef,
          { studentCount: currentCount + 1 },
          { merge: true }
        );
      }
    } catch (error) {
      console.error("Error updating student count:", error);
    }
  }
}

export const universityManager = UniversityManager.getInstance();
export type { University };
