# Environment Configuration Guide

## Production Environment Variables

Create a `.env.local` file in your project root with these real keys:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
NODE_ENV=production

# Firebase Configuration (Your Real Config)
NEXT_PUBLIC_FIREBASE_API_KEY=your_real_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_real_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=prep-94ed4
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_real_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_real_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_real_app_id

# Flutterwave Configuration (Your Real Keys)
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-your_real_public_key
FLUTTERWAVE_SECRET_KEY=FLWSECK-your_real_secret_key
FLUTTERWAVE_SECRET_HASH=your_webhook_secret_hash

# OpenAI Configuration
OPENAI_API_KEY=sk-your_real_openai_key

# Admin Configuration
ADMIN_EMAIL=your_admin_email@domain.com
```

## Important Notes:

1. **Never commit real environment variables to Git**
2. **Add `.env.local` to your `.gitignore` file**
3. **Use the example file as a template only**
4. **For production deployment, set these variables in your hosting platform**

## Testing Configuration:

For development/testing, you can use test keys:
- Flutterwave test keys start with `FLWPUBK_TEST-` and `FLWSECK_TEST-`
- Firebase project should be a separate test project
- OpenAI can use the same key with proper usage limits

## Production Deployment:

When deploying to production (Vercel, Netlify, etc.), set these environment variables in your hosting platform's dashboard, not in code files.
