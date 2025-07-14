# Firebase Setup for IdeaPlate

## Overview
This project uses Firebase for authentication with email verification and Firestore for data storage. The setup includes email/password authentication with mandatory email verification before accessing the platform, and a complete ideas management system.

## Configuration
Firebase is configured in `lib/firebase.ts` with the following services:
- Authentication (Email/Password)
- Email Verification
- Password Reset
- Firestore Database
- Analytics (browser-only)

## Authentication Features
- Email/password sign up with automatic email verification
- Email/password sign in with verification check
- Email verification required for platform access
- Password reset functionality
- Sign out functionality
- Authentication state management via React Context
- Protected routes (dashboard requires authentication + email verification)

## Ideas System Features
- Create and share ideas with detailed forms
- Category-based organization (12 categories)
- Search functionality across titles, descriptions, and tags
- Multiple sorting options (newest, oldest, alphabetical, most-liked)
- Clickable idea cards with detailed view
- Mobile-responsive design
- Real-time data from Firestore

## Email Verification Flow
1. User signs up → verification email sent automatically
2. User visits verify-email page → clear instructions and resend option
3. User clicks email link → automatic verification and redirect to dashboard
4. Unverified users → cannot access dashboard or other protected areas
5. Password reset → available for existing users

## File Structure
```
lib/
  firebase.ts          # Firebase configuration and auth functions
  ideas.ts            # Firestore operations for ideas
contexts/
  AuthContext.tsx      # React context for auth state management
types/
  idea.ts             # TypeScript types for ideas system
components/
  IdeaCard.tsx        # Reusable idea card component
  IdeaFilters.tsx     # Search and filter component
app/
  auth/page.tsx        # Authentication page (login/signup + password reset)
  verify-email/page.tsx # Email verification page
  share-idea/page.tsx  # Create new idea page
  idea/[id]/page.tsx   # Detailed idea view page
  dashboard/page.tsx   # Main ideas feed (requires email verification)
  page.tsx            # Main page with auth-based routing
```

## Authentication Flow
1. User visits the app → redirected to onboarding if not authenticated
2. User clicks "Get Started" → redirected to auth page
3. User signs up → verification email sent → redirected to verify-email page
4. User signs in → redirected to verify-email if not verified, dashboard if verified
5. User verifies email → redirected to dashboard
6. Dashboard checks auth + verification state → redirects if needed
7. User can sign out → redirected to auth page

## Ideas System Flow
1. User creates idea → form validation → saved to Firestore
2. Ideas displayed in feed → filtering and search available
3. User clicks idea → detailed view with full description
4. Comments section ready for implementation
5. Like system ready for implementation

## Email Verification Features
- Automatic verification email on signup
- Resend verification email functionality
- Verification link handling from URL parameters
- Clear instructions and user feedback
- Password reset functionality
- Verification status checking throughout the app

## Firestore Database Structure
```
/ideas/{ideaId}
  - title: string
  - description: string
  - category: string
  - authorId: string
  - authorName: string
  - authorEmail: string
  - createdAt: timestamp
  - updatedAt: timestamp
  - likes: number
  - comments: number
  - tags: string[]
```

## Next Steps
- Implement like system with real-time updates
- Add comment functionality
- Implement user profiles
- Add real-time notifications
- Implement email templates customization
- Add additional security features

## Firebase Console Setup Required
1. Enable Email/Password authentication in Firebase Console
2. Configure authorized domains
3. Set up email templates for verification and password reset
4. Enable Firestore Database
5. Configure Firestore security rules
6. Set up Google Sign-In (when ready)

## Firestore Security Rules
The security rules are configured in `firestore.rules` and deployed via Firebase CLI:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Ideas collection rules
    match /ideas/{ideaId} {
      // Allow read access to all authenticated users
      allow read: if request.auth != null;
      
      // Allow create access to authenticated users with verified email
      allow create: if request.auth != null 
        && request.auth.token.email_verified == true
        && request.resource.data.authorId == request.auth.uid;
      
      // Allow update/delete access to the author of the idea (with verified email)
      allow update, delete: if request.auth != null 
        && request.auth.token.email_verified == true 
        && resource.data.authorId == request.auth.uid;
    }
    
    // Default rule - deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Deploying Rules
To deploy the security rules and indexes:
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## Email Templates
Firebase automatically sends verification and password reset emails. You can customize these templates in the Firebase Console under Authentication → Templates. 

## Firestore Migration: Update collaborationStatus

If you have ideas in Firestore with `collaborationStatus: 'looking-for-partners'`, run this script once to update them to `collaborationStatus: 'lfp'`:

```js
// Run this in a Node.js script with Firebase Admin SDK initialized
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

async function migrateCollabStatus() {
  const ideasSnap = await db.collection('ideas').where('collaborationStatus', '==', 'looking-for-partners').get();
  const batch = db.batch();
  ideasSnap.forEach(doc => {
    batch.update(doc.ref, { collaborationStatus: 'lfp' });
  });
  await batch.commit();
  console.log('Migration complete.');
}

migrateCollabStatus();
```

> **Note:** Make sure you have the right permissions and a backup before running migrations. 