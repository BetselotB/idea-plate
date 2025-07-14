# Firebase Setup for Idea Plate

Hey there! Here’s how Firebase fits into Idea Plate and how you can get it working if you want to run things locally or hack on the project.

## What’s Used?
- **Authentication** (email/password, with email verification)
- **Firestore** (for storing all the ideas)
- **Password reset**
- **Analytics** (browser only, optional)

## What’s Actually Built?
- Sign up/sign in with email (and email verification)
- Password reset
- Auth state managed with React Context
- Only verified users can post ideas
- All ideas are stored in Firestore (with categories, tags, etc.)
- Upvoting and commenting on ideas

## File Structure (Firebase-y bits)
```
lib/
  firebase.ts         # Firebase config and auth helpers
  ideas.ts            # Firestore logic for ideas
contexts/
  AuthContext.tsx     # Auth state management
app/
  auth/               # Login/signup/password reset
  verify-email/       # Email verification
  share-idea/         # Create new idea
  idea/[id]/          # View idea details
  dashboard/          # Main feed (needs auth)
  page.tsx            # Handles onboarding/auth redirects
```

## How Auth Works
1. New users get a verification email when they sign up
2. You can’t post ideas until you verify your email
3. If you’re not logged in, you get sent to onboarding
4. If you’re logged in but not verified, you get sent to verify your email
5. Password reset is available if you forget

## How Ideas Work
- Only verified users can create ideas
- Ideas have title, description, category, tags, author info, timestamps, likes, and comments
- You can filter and search ideas
- Upvoting and commenting are built in

## Firestore Structure
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

## Setting Up Firebase (for local dev)
1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Email/Password authentication
3. Set up Firestore database
4. Add your Firebase config to `.env.local` (see `firebase.ts` for keys)
5. (Optional) Set up Analytics if you want
6. (Optional) Customize email templates in the Firebase Console

## Firestore Security Rules (recommended)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /ideas/{ideaId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.token.email_verified == true && request.resource.data.authorId == request.auth.uid;
      allow update, delete: if request.auth != null && request.auth.token.email_verified == true && resource.data.authorId == request.auth.uid;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Next Steps
- [x] Email/password auth with verification
- [x] Firestore for ideas
- [x] Upvoting and commenting
- [ ] Email notifications
- [ ] Real-time notifications
- [ ] Collaboration features

## That’s It!
If you want to contribute or just play around, go for it. The UI is playful and glassy, and the code’s not too scary. PRs and suggestions are always welcome! 