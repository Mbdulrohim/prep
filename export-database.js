const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin SDK
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountKey) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT_KEY not found in environment variables');
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountKey);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'prep-94ed4'
  });
}

const db = admin.firestore();

async function exportCollection(collectionName) {
  console.log(`📦 Exporting collection: ${collectionName}...`);
  
  try {
    const snapshot = await db.collection(collectionName).get();
    const data = {};
    
    snapshot.forEach(doc => {
      data[doc.id] = doc.data();
    });
    
    // Create exports directory if it doesn't exist
    const exportsDir = path.join(__dirname, 'database-exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir);
    }
    
    // Write to JSON file
    const filename = path.join(exportsDir, `${collectionName}.json`);
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    
    console.log(`✅ Exported ${snapshot.size} documents from ${collectionName} to ${filename}`);
    return { collection: collectionName, count: snapshot.size, filename };
  } catch (error) {
    console.error(`❌ Error exporting ${collectionName}:`, error.message);
    return { collection: collectionName, error: error.message };
  }
}

async function exportDatabase() {
  console.log('🚀 Starting database export...\n');
  
  // List of collections to export
  const collections = [
    'users',
    'examResults', 
    'questions',
    'rmQuestions',
    'weeklyAssessmentQuestions',
    'rmUserAccess',
    'userAccess',
    'payments',
    'examAttempts',
    'rmExamAttempts',
    'weeklyAssessmentAttempts',
    'universities',
    'accessCodes',
    'groups'
  ];
  
  const results = [];
  
  for (const collection of collections) {
    const result = await exportCollection(collection);
    results.push(result);
    
    // Small delay to avoid hitting rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Create summary
  const summary = {
    exportDate: new Date().toISOString(),
    totalCollections: collections.length,
    successfulExports: results.filter(r => !r.error).length,
    failedExports: results.filter(r => r.error).length,
    results: results
  };
  
  // Save summary
  const summaryFile = path.join(__dirname, 'database-exports', 'export-summary.json');
  fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
  
  console.log('\n📊 Export Summary:');
  console.log(`✅ Successful: ${summary.successfulExports}/${summary.totalCollections} collections`);
  console.log(`❌ Failed: ${summary.failedExports}/${summary.totalCollections} collections`);
  console.log(`📁 Files saved to: ./database-exports/`);
  
  if (summary.failedExports > 0) {
    console.log('\n❌ Failed exports:');
    results.filter(r => r.error).forEach(r => {
      console.log(`   - ${r.collection}: ${r.error}`);
    });
  }
  
  console.log(`\n📄 Full summary saved to: ${summaryFile}`);
}

// Run the export
exportDatabase().catch(console.error);
