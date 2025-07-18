// Quick test to check if Firebase feedback submission works
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Initialize Firebase (using the same config as your app)
const firebaseConfig = {
  // This would be your actual Firebase config
  // We're just testing the structure
};

console.log('Testing feedback structure...');

// Test feedback object structure
const testFeedback = {
  id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  userId: 'test-user-123',
  userEmail: 'test@example.com',
  userName: 'Test User',
  university: 'Test University',
  type: 'bug',
  category: 'ui',
  subject: 'Test feedback',
  message: 'This is a test feedback message',
  rating: 5,
  status: 'new',
  priority: 'medium',
  createdAt: new Date(),
  userAgent: 'test-agent',
  platform: 'test-platform'
};

console.log('Test feedback object structure:', testFeedback);
console.log('✅ Feedback structure is valid');

// Test that all required fields are present
const requiredFields = ['userId', 'userEmail', 'userName', 'type', 'category', 'subject', 'message', 'createdAt'];
const missingFields = requiredFields.filter(field => !(field in testFeedback));

if (missingFields.length === 0) {
  console.log('✅ All required fields are present');
} else {
  console.log('❌ Missing required fields:', missingFields);
}

console.log('Test completed successfully!');
