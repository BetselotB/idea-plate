![IdeaPlate Logo](public/globe.svg "IdeaPlate Logo")

# Idea Plate 💡

Welcome to Idea Plate! This is a fun little platform where you can share your app, website, or business ideas that you just can't build yourself. Maybe someone else will pick them up and run with them!

## What It Does

- ✨ **Glassmorphic UI** – Everything looks shiny and modern, with glassy cards and smooth transitions.
- 🚀 **Onboarding Flow** – New here? You'll get a quick intro before you even need to sign up.
- 💡 **Idea Sharing** – Post your ideas with details, categories, and tags.
- 🔍 **Smart Filtering** – Search and filter ideas by category or keyword.
- 📱 **Responsive** – Works on your phone, tablet, or desktop.
- 🔐 **Firebase Auth** – Sign up, sign in, and email verification (no spam, promise).
- ☁️ **Firestore** – All ideas are saved in the cloud.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Firebase (Auth + Firestore)**

## Getting Started

1. Clone this repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the dev server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000)

## Project Structure (for the curious)

```
app/
  ├─ globals.css         # Global styles (glassmorphic, of course)
  ├─ layout.tsx          # App layout and metadata
  ├─ page.tsx            # Handles onboarding/auth redirects
  ├─ onboarding/         # Onboarding page
  ├─ auth/               # Login/signup/password reset
  ├─ verify-email/       # Email verification
  ├─ dashboard/          # Main feed (ideas list)
  ├─ share-idea/         # Submit a new idea
  ├─ idea/[id]/          # View a single idea
  ├─ edit-idea/[id]/     # Edit your idea
  ├─ my-ideas/           # Your ideas & requests
  └─ profile/            # User profiles
components/
  ├─ IdeaCard.tsx        # Idea display
  ├─ IdeaFilters.tsx     # Filtering/search
  ├─ MyIdeaCard.tsx      # Your ideas
  └─ Navbar.tsx          # Top navigation
contexts/
  └─ AuthContext.tsx     # Auth state
lib/
  ├─ firebase.ts         # Firebase config
  └─ ideas.ts            # Firestore logic
```

## Design Features

- Glassy cards, gradients, and subtle animations
- Custom scrollbars and smooth transitions
- Mobile-friendly, always

## Next Steps

- [x] Firebase integration for data persistence
- [x] User authentication (with email verification)
- [x] Idea upvoting and commenting
- [ ] Email notifications
- [ ] Advanced search and filtering
- [ ] Idea collaboration features

## Contributing

PRs and ideas welcome! If you spot a bug or want to add something, go for it.

## License

MIT – use it, remix it, have fun!
