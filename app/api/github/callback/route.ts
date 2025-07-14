import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const GITHUB_CLIENT_ID = 'Ov23limjjxSGui4e8xzD';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

// Debug logging
console.log('GitHub Client Secret exists:', !!GITHUB_CLIENT_SECRET);
console.log('Environment:', process.env.NODE_ENV);
const REDIRECT_URI = process.env.NODE_ENV === 'production' 
  ? 'https://your-domain.com/api/github/callback'
  : 'http://localhost:3000/api/github/callback';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // This should contain the user's UID
  const error = searchParams.get('error');

  console.log('GitHub callback received:', { code: !!code, state, error });

  if (error) {
    console.log('GitHub OAuth error:', error);
    return NextResponse.redirect(new URL(`/profile?error=github_denied`, req.url));
  }

  if (!code || !state) {
    console.log('Missing params:', { code: !!code, state });
    return NextResponse.redirect(new URL(`/profile?error=missing_params`, req.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      console.error('GitHub OAuth error:', tokenData);
      return NextResponse.redirect(new URL(`/profile?error=token_exchange_failed`, req.url));
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(new URL(`/profile?error=no_access_token`, req.url));
    }

    // Fetch GitHub user profile
    const profileResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const githubProfile = await profileResponse.json();

    if (profileResponse.status !== 200) {
      console.error('GitHub API error:', githubProfile);
      return NextResponse.redirect(new URL(`/profile?error=profile_fetch_failed`, req.url));
    }

    // Fetch additional GitHub data
    const [reposResponse, starredResponse] = await Promise.all([
      fetch(`https://api.github.com/users/${githubProfile.login}/repos?sort=updated&per_page=5`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }),
      fetch(`https://api.github.com/users/${githubProfile.login}/starred?per_page=5`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      })
    ]);

    const repos = await reposResponse.json();
    const starred = await starredResponse.json();

    // Prepare GitHub data to store
    const githubData = {
      githubUsername: githubProfile.login,
      githubName: githubProfile.name,
      githubBio: githubProfile.bio,
      githubAvatar: githubProfile.avatar_url,
      githubUrl: githubProfile.html_url,
      githubLocation: githubProfile.location,
      githubCompany: githubProfile.company,
      githubBlog: githubProfile.blog,
      githubTwitter: githubProfile.twitter_username,
      githubFollowers: githubProfile.followers,
      githubFollowing: githubProfile.following,
      githubPublicRepos: githubProfile.public_repos,
      githubPublicGists: githubProfile.public_gists,
      githubCreatedAt: githubProfile.created_at,
      githubUpdatedAt: githubProfile.updated_at,
      githubRepos: repos.slice(0, 5).map((repo: any) => ({
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        updatedAt: repo.updated_at,
      })),
      githubStarred: starred.slice(0, 5).map((repo: any) => ({
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,
        stars: repo.stargazers_count,
        owner: repo.owner.login,
      })),
      githubLinkedAt: new Date().toISOString(),
    };

    // Update user's Firestore document with GitHub data
    const userRef = doc(db, 'users', state);
    await updateDoc(userRef, githubData);

    return NextResponse.redirect(new URL(`/profile/${state}?github_linked=true`, req.url));

  } catch (error) {
    console.error('GitHub OAuth error:', error);
    return NextResponse.redirect(new URL(`/profile?error=oauth_failed`, req.url));
  }
} 