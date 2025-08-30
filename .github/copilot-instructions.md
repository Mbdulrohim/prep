<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# PREP NMCN - Copilot Instructions

This is a comprehensive Node.js TypeScript backend for PREP NMCN (Nursing & Midwifery Council of Nigeria) with the following architecture and conventions:

Instructions:

# Development Workflow

Development server: Runs via npm run dev, but I keep it running — you DON'T need to start it yourself.

Hot reload: Development server automatically restarts on changes.

Logging: Use structured logging with appropriate levels.

use the best possible way when we writing codes

# Code Editing & Rewriting

When rewriting a file completely, always verify that the result is not empty and preserves essential logic.

Never remove unrelated code during a fix unless explicitly instructed.

When creating new files, confirm they are placed in the correct folder based on the file structure guidelines.

# Package Management

Package manager is pnpm — always use pnpm commands (never npm or yarn).

# Response Format

Before taking any action or writing code, always provide a brief summary of what you understand from my request.

The summary should confirm:

The main task you think I’m asking for.

Example:

Summary: You want me to create a new API route /users/:id that returns a user profile in JSON, with role-based access control and Swagger docs.

Proceeding with solution…

# Documentation Rules

Never create or commit a new `.md` file after adding a feature unless explicitly instructed
Always add any md file created to gitignore
Never add any test file, not even to test

# Package Management

Package manager is pnpm — always use pnpm commands (never npm or yarn).

When generating code, please follow these patterns and maintain consistency with the existing codebase. Always consider the health-focused nature of the application and implement appropriate safety measures for medical content.
