# GitHub OAuth Integration Setup

This guide will help you set up the GitHub OAuth integration for your IdeaPlate app.

## 1. GitHub OAuth App Configuration

### Create GitHub OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the following details:
   - **Application name**: IdeaPlate (or your preferred name)
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: `http://localhost:3000/api/github/callback`
4. Click "Register application"
5. Copy the **Client ID** and **Client Secret**

### Environment Variables
Create a `.env.local` file in your project root and add:

```env
# GitHub OAuth Configuration
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

Replace `your_github_client_secret_here` with the Client Secret from your GitHub OAuth app.

## 2. Production Configuration

When deploying to production, update your GitHub OAuth app settings:

1. Go to your GitHub OAuth app settings
2. Update the **Homepage URL** to your production domain
3. Update the **Authorization callback URL** to `https://your-domain.com/api/github/callback`
4. Update the `REDIRECT_URI` in `app/api/github/callback/route.ts` to match your production domain

## 3. Features

The GitHub integration includes:

- **Profile Linking**: Users can link their GitHub account via OAuth
- **Profile Display**: Shows GitHub avatar, name, bio, location, company
- **Stats Display**: Shows followers, following, public repos count
- **Recent Repositories**: Displays user's 5 most recent repositories
- **Starred Repositories**: Shows user's 5 most recent starred repositories
- **Unlink Feature**: Users can unlink their GitHub account

## 4. Security Notes

- The GitHub Client Secret is stored server-side only
- Access tokens are not stored in the database (only used to fetch profile data)
- All GitHub data is fetched during the OAuth callback and stored in Firestore
- Users can unlink their GitHub account at any time

## 5. Troubleshooting

### Common Issues:

1. **"Invalid redirect URI" error**
   - Make sure the callback URL in your GitHub OAuth app matches exactly
   - Check that the `REDIRECT_URI` in the code matches your GitHub app settings

2. **"Client secret not found" error**
   - Ensure you've added `GITHUB_CLIENT_SECRET` to your `.env.local` file
   - Restart your development server after adding environment variables

3. **"User not found" error**
   - Make sure the user document exists in Firestore
   - Check that the user ID is being passed correctly in the OAuth state parameter

### Testing:
1. Start your development server: `npm run dev`
2. Navigate to your profile page
3. Click "Link GitHub" 
4. Authorize the application on GitHub
5. You should be redirected back to your profile with GitHub data displayed 