import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(req: NextRequest) {
  try {
    const { uid } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Remove all GitHub-related fields from user document
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      githubUsername: null,
      githubName: null,
      githubBio: null,
      githubAvatar: null,
      githubUrl: null,
      githubLocation: null,
      githubCompany: null,
      githubBlog: null,
      githubTwitter: null,
      githubFollowers: null,
      githubFollowing: null,
      githubPublicRepos: null,
      githubPublicGists: null,
      githubCreatedAt: null,
      githubUpdatedAt: null,
      githubRepos: null,
      githubStarred: null,
      githubLinkedAt: null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unlinking GitHub:', error);
    return NextResponse.json({ error: 'Failed to unlink GitHub' }, { status: 500 });
  }
} 