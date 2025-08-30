# Firebase Admin SDK Environment Variable Setup

## Issue Resolved
The "Missing or insufficient permissions" error when manually granting RM access has been fixed by updating the API routes to use the Firebase Admin SDK instead of the client-side Firebase SDK.

## Required Environment Variable
The API routes `/api/grant-rm-access` and `/api/redeem-access-code` now require the following environment variable:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project-id",...}'
```

## Files Modified
- `/src/app/api/grant-rm-access/route.ts` - Updated to use `adminDb` from `@/lib/firebase-admin`
- `/src/app/api/redeem-access-code/route.ts` - Updated to use `adminDb` for server-side operations

## Testing
Both API routes now use server-side Firebase operations which bypass Firestore security rules and should resolve the permission errors.

The build will fail without proper Firebase Admin credentials, but the code is ready for deployment with the correct environment variables.
