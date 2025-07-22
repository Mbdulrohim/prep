# Contributing to Medical Exam Preparation Platform

Thank you for your interest in contributing to our project! We welcome contributions from everyone.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and what you expected**
- **Include screenshots if applicable**
- **Provide environment details** (OS, browser, Node.js version)

### Suggesting Enhancements

Enhancement suggestions are welcome! When submitting an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **Include mockups or examples if applicable**

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Make your changes**
4. **Add tests** if applicable
5. **Ensure all tests pass**
6. **Update documentation** as needed
7. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
8. **Push to the branch** (`git push origin feature/AmazingFeature`)
9. **Open a Pull Request**

## Development Process

### Setting Up Development Environment

1. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/prep.git
   cd prep
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Fill in your actual values
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Code Style

- **TypeScript**: Use TypeScript for all new code
- **ESLint**: Follow the existing ESLint configuration
- **Formatting**: Use Prettier for consistent code formatting
- **Naming**: Use descriptive names for variables and functions
- **Comments**: Add comments for complex logic

### Testing

- **Write tests** for new features and bug fixes
- **Run tests** before submitting PRs: `npm test`
- **Ensure tests pass** in all environments

### Commit Messages

Use clear and meaningful commit messages:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Formatting changes
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
- `feat(exam): add timer countdown functionality`
- `fix(payment): resolve webhook verification issue`
- `docs: update README with deployment instructions`

## Project Structure Guidelines

### Component Organization
```
src/components/
├── admin/          # Admin-only components
├── dashboard/      # User dashboard components
├── exam/           # Exam-related components
├── ui/             # Reusable UI components
└── layout/         # Layout components
```

### File Naming
- **Components**: PascalCase (`ExamProvider.tsx`)
- **Utilities**: camelCase (`examUtils.ts`)
- **Constants**: UPPER_SNAKE_CASE (`EXAM_CONSTANTS.ts`)

### Import Organization
```typescript
// External libraries
import React from 'react'
import { NextPage } from 'next'

// Internal modules
import { ExamProvider } from '@/components/exam/ExamProvider'
import { useAuth } from '@/hooks/useAuth'

// Types
import type { ExamType } from '@/types/exam'
```

## Security Guidelines

### Environment Variables
- **Never commit** `.env` files
- **Use descriptive names** for environment variables
- **Document all variables** in `.env.example`

### Authentication
- **Always validate** user permissions
- **Use Firebase Auth** for authentication
- **Implement proper error handling**

### Data Handling
- **Validate all inputs** on both client and server
- **Use TypeScript types** for data validation
- **Implement proper error boundaries**

## Documentation

### Code Documentation
- **Document complex functions** with JSDoc comments
- **Include examples** in documentation
- **Keep README updated** with new features

### API Documentation
- **Document all API endpoints**
- **Include request/response examples**
- **Document error codes and messages**

## Review Process

### Pull Request Reviews
- **Code quality**: Ensure code follows project standards
- **Functionality**: Verify the feature works as expected
- **Security**: Check for security implications
- **Performance**: Consider performance impact
- **Documentation**: Ensure documentation is updated

### Feedback
- **Be constructive** in feedback
- **Explain reasoning** behind suggestions
- **Be responsive** to feedback on your PRs

## Release Process

### Version Numbering
We use Semantic Versioning (SemVer):
- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backwards compatible
- **Patch** (0.0.1): Bug fixes, backwards compatible

### Release Steps
1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create release PR
4. After merge, create git tag
5. Deploy to production

## Getting Help

### Communication Channels
- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For general questions and ideas
- **Code Reviews**: For detailed technical discussions

### Resources
- **Project Wiki**: Detailed project information
- **API Documentation**: Endpoint documentation
- **Architecture Guide**: System design documentation

## Recognition

Contributors will be recognized in:
- **README.md**: Contributors section
- **Release notes**: Major contribution acknowledgments
- **GitHub**: Contributor statistics

## Questions?

If you have questions about contributing, please:
- Check existing issues and discussions
- Create a new discussion for general questions
- Create an issue for specific problems

Thank you for contributing! 🎉
