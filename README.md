# 🎓 Medical Exam Preparation Platform

A comprehensive Next.js application for medical exam preparation, featuring real-time exam management, payment processing, and admin dashboard capabilities.

## ⚠️ Important Disclaimer

**This project is NOT affiliated with, endorsed by, or associated with any government agency, official medical board, or educational institution.** This is an independent, open-source educational tool created for learning purposes.

**If you use this project or find it helpful, please:**
- ⭐ **Star this repository on GitHub**
- 🙏 **Give proper attribution to the original author**
- 📝 **Include credits in your implementation**

---

## 👨‍💻 Credits & Attribution

**Original Author:** [@Mbdulrohim](https://github.com/Mbdulrohim)  
**GitHub Repository:** [github.com/Mbdulrohim/prep](https://github.com/Mbdulrohim/prep)

If you use this code in your project, please include the following attribution:

```
Medical Exam Preparation Platform
Created by Mbdulrohim (https://github.com/Mbdulrohim)
Original Repository: https://github.com/Mbdulrohim/prep
```

**Please star ⭐ the repository if this project helps you!**

## ✨ Features

### 🎯 Core Functionality
- **Interactive Exam System**: Timed exams with real-time countdown and auto-submission
- **Real-time Data**: Live statistics, leaderboards, and progress tracking
- **Multi-Category Exams**: Support for RN, RM, and RPHN exam categories
- **Instant Results**: Immediate exam results with detailed analytics
- **Smart Question Bank**: Dynamic question generation and management

### 👨‍💼 Admin Features
- **Live Dashboard**: Real-time monitoring of users, exams, and system stats
- **Exam Management**: Schedule management and question bank administration
- **User Management**: Access control, university management, and user analytics
- **Payment Tracking**: Real-time payment verification and user access management
- **Feedback System**: Live feedback monitoring and management

### 💳 Payment Integration
- **Flutterwave**: Secure payment processing with webhook support
- **Paystack**: Alternative payment gateway with full integration
- **Access Codes**: Manual access code redemption system
- **Real-time Verification**: Instant payment verification and access granting

### 🔐 Security Features
- **Firebase Authentication**: Secure user authentication and authorization
- **Real-time Database**: Firestore with proper security rules
- **Environment Variables**: Secure configuration management
- **Admin Access Control**: Role-based access for admin features

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project
- Flutterwave/Paystack accounts (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd prep
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your actual values in `.env.local`:
   - Firebase configuration
   - Payment gateway credentials
   - OpenAI API key (optional)

4. **Firebase Setup**
   - Create a Firebase project
   - Enable Authentication (Email/Password)
   - Create Firestore database
   - Deploy security rules: `firebase deploy --only firestore:rules`

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── dashboard/         # User dashboard
│   ├── exam/              # Exam pages
│   └── payment/           # Payment pages
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── dashboard/        # Dashboard components
│   ├── exam/             # Exam-related components
│   ├── feedback/         # Feedback system
│   ├── layout/           # Layout components
│   ├── leaderboard/      # Leaderboard components
│   ├── profile/          # Profile components
│   └── ui/               # Reusable UI components
├── context/              # React contexts
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
├── services/             # External services
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## 🔧 Configuration

### Firebase Setup
1. Create a new Firebase project
2. Enable Authentication with Email/Password
3. Create a Firestore database
4. Download your config and add to `.env.local`

### Payment Setup
1. **Flutterwave**: Get API keys from dashboard
2. **Paystack**: Get API keys from dashboard
3. Configure webhooks for payment verification

### Admin Access
- First user to register becomes admin
- Or manually set admin role in Firestore

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## 🔒 Security Considerations

### Environment Variables
- Never commit `.env` files
- Use `.env.local` for local development
- Use platform-specific env vars for production

### Firebase Security
- Firestore rules are configured for proper access control
- Admin functions require authentication
- Real-time listeners have proper user validation

### Payment Security
- All payments use secure HTTPS webhooks
- Payment verification includes signature validation
- Sensitive payment data is never stored client-side

## 📱 Real-time Features

### Live Data Updates
- **onSnapshot listeners** for real-time data
- **Automatic UI updates** without page refresh
- **Live indicators** showing real-time status
- **Memory leak prevention** with proper cleanup

### Real-time Components
- Dashboard statistics
- Leaderboard rankings
- Admin monitoring
- Exam progress tracking
- Feedback system

## 🎯 Exam System Features

### Timer Management
- **Live countdown timer** with auto-submission
- **Time warnings** at 15 and 5 minutes
- **Auto-save functionality** every 30 seconds
- **Immediate navigation** to results

### Results System
- **Instant results** using in-memory calculations
- **Detailed analytics** with score breakdown
- **Pass/fail determination** with 70% threshold
- **No database delays** for immediate feedback

## 🔧 Development

### Adding New Exam Categories
1. Update `src/lib/examData.ts`
2. Add category to routing
3. Update admin dashboard
4. Test real-time features

### Extending Payment Gateways
1. Create new service in `src/lib/`
2. Add API routes in `src/app/api/`
3. Update payment components
4. Add webhook handling

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Add environment variables
3. Deploy automatically on push

### Other Platforms
- Ensure Node.js 18+ support
- Configure environment variables
- Set up Firebase hosting (optional)

## 🐛 Troubleshooting

### Common Issues
1. **Firebase connection**: Check environment variables
2. **Payment webhooks**: Verify webhook URLs and secrets
3. **Real-time updates**: Check Firestore security rules
4. **Timer issues**: Verify ExamProvider is properly wrapping components

### Debug Mode
- Enable Firebase debug logging
- Check browser console for errors
- Monitor Network tab for failed requests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Attribution Required:** When using this software, you must provide proper attribution to the original author [@Mbdulrohim](https://github.com/Mbdulrohim) and link to the original repository.

## 🙏 Acknowledgments

- **Original Creator:** [@Mbdulrohim](https://github.com/Mbdulrohim) - *Please star ⭐ the repository!*
- **Firebase** for backend services
- **Next.js** for the React framework
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Flutterwave & Paystack** for payment processing

## ⚠️ Legal Disclaimer

This software is provided "as is" without warranty of any kind. The authors and contributors are not responsible for any damages or issues that may arise from using this software. Users are responsible for ensuring compliance with all applicable laws and regulations in their jurisdiction.

**This project is not affiliated with any government agency or official medical board.**

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Made with ❤️ for medical education**
