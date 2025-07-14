'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, doc as firestoreDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { signOutUser } from '@/lib/firebase';

export default function UserProfile() {
  const router = useRouter();
  const { uid } = useParams();
  const userId = typeof uid === 'string' ? uid : Array.isArray(uid) ? uid[0] : '';
  const { user, loading: authLoading } = useAuth();
  const [userInfo, setUserInfo] = useState<any>(null);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    github: '', // Only keep this as a plain link
    linkedin: '',
    twitter: '',
    website: '',
  });
  // Remove all GitHub linking/unlinking state and handlers
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [urlParams, setUrlParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    // Check for URL parameters (like github_linked=true)
    const params = new URLSearchParams(window.location.search);
    setUrlParams(params);
    
    if (params.get('github_linked') === 'true') {
      setSuccess('GitHub account linked successfully!');
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh the profile data to show GitHub info
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch user info (assuming you store user info in a 'users' collection)
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          setUserInfo(userDoc.data());
          setForm({
            displayName: userDoc.data().displayName || '',
            github: userDoc.data().github || '',
            linkedin: userDoc.data().linkedin || '',
            twitter: userDoc.data().twitter || '',
            website: userDoc.data().website || '',
          });
        } else {
          setError('User not found');
        }
        // Fetch user's ideas
        const q = query(collection(db, 'ideas'), where('authorId', '==', userId));
        const querySnapshot = await getDocs(q);
        const ideasList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setIdeas(ideasList);
      } catch (err: any) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    if (uid) fetchProfile();
  }, [uid]);

  const handleEdit = () => setEditing(true);
  const handleCancel = () => setEditing(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      // Update user profile in Firebase Auth if it's the current user
      if (isOwnProfile && user) {
        await updateProfile(user, { displayName: form.displayName });
        // Force reload of user in context
        await user.reload();
      }
      // Update user profile in Firestore
      await updateDoc(firestoreDoc(db, 'users', userId), {
        displayName: form.displayName,
        github: form.github,
        linkedin: form.linkedin,
        twitter: form.twitter,
        website: form.website,
      });
      setUserInfo((u: any) => ({ ...u, ...form }));
      setEditing(false);
      setSuccess('Profile updated successfully!');
      // Update all ideas authored by this user with new authorName
      const ideasQuery = query(collection(db, 'ideas'), where('authorId', '==', userId));
      const ideasSnapshot = await getDocs(ideasQuery);
      const batchUpdates = ideasSnapshot.docs.map(ideaDoc =>
        updateDoc(ideaDoc.ref, { authorName: form.displayName })
      );
      await Promise.all(batchUpdates);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOutUser();
    if (!error) {
      router.push('/auth');
    }
  };

  // Remove handleLinkGitHub and handleUnlinkGitHub functions

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  if (!userInfo) return null;

  // Determine if this is the current user's profile (only if user.uid === userId)
  const isOwnProfile = user && user.uid === userId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100">
      <div className="max-w-4xl mx-auto pt-16 pb-12 px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8 border-b border-gray-200 pb-8 mb-10">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
              {userInfo.displayName ? userInfo.displayName.charAt(0).toUpperCase() : userInfo.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                {userInfo.displayName || userInfo.email || 'User'}
                {isOwnProfile && !editing && (
                  <button onClick={handleEdit} className="ml-2 px-3 py-1.5 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-150">Edit</button>
                )}
              </h1>
              <p className="text-gray-500 text-lg mb-2">{userInfo.email}</p>
              <div className="flex flex-wrap gap-4 mt-2">
                {userInfo.github && <a href={userInfo.github} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline font-medium">GitHub</a>}
                {userInfo.linkedin && <a href={userInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline font-medium">LinkedIn</a>}
                {userInfo.twitter && <a href={userInfo.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline font-medium">Twitter</a>}
                {userInfo.website && <a href={userInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline font-medium">Website</a>}
              </div>
            </div>
          </div>
          {isOwnProfile && (
            <button
              onClick={handleSignOut}
              className="mt-6 md:mt-0 px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
            >
              Sign Out
            </button>
          )}
        </div>

        {/* Social Profile Cards: GitHub & LinkedIn side by side */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GitHub Card */}
          <div className="bg-white/90 rounded-2xl p-6 border border-gray-200 shadow">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub Profile
            </h3>
            {userInfo.github ? (
              <a
                href={userInfo.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline mt-2 block"
              >
                {userInfo.github}
              </a>
            ) : (
              <p className="text-gray-500 mt-2">No GitHub profile link provided.</p>
            )}
          </div>
          {/* LinkedIn Card */}
          <div className="bg-white/90 rounded-2xl p-6 border border-gray-200 shadow">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm13.5 10.28h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.39v4.58h-3v-9h2.89v1.23h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v4.72z"/>
              </svg>
              LinkedIn Profile
            </h3>
            {userInfo.linkedin ? (
              <a
                href={userInfo.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline mt-2 block"
              >
                {userInfo.linkedin}
              </a>
            ) : (
              <p className="text-gray-500 mt-2">No LinkedIn profile link provided.</p>
            )}
          </div>
        </div>

        {/* Edit Form */}
        {editing && isOwnProfile && (
          <form onSubmit={handleSave} className="space-y-6 bg-white/90 rounded-2xl p-8 border border-gray-200 shadow mb-12 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="displayName"
                  value={form.displayName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  required
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={userInfo.email}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">GitHub</label>
                <input
                  type="url"
                  name="github"
                  value={form.github}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  placeholder="https://github.com/yourusername"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">LinkedIn</label>
                <input
                  type="url"
                  name="linkedin"
                  value={form.linkedin}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  placeholder="https://linkedin.com/in/yourusername"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Twitter</label>
                <input
                  type="url"
                  name="twitter"
                  value={form.twitter}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  placeholder="https://twitter.com/yourusername"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                  placeholder="https://yourwebsite.com"
                  disabled={saving}
                />
              </div>
            </div>
            {error && <div className="text-red-600 text-sm font-semibold mt-2">{error}</div>}
            {success && <div className="text-green-600 text-sm font-semibold mt-2">{success}</div>}
            <div className="flex gap-3 mt-4">
              <button type="submit" disabled={saving} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg font-bold shadow hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all disabled:opacity-50">{saving ? 'Saving...' : 'Save Changes'}</button>
              <button type="button" onClick={handleCancel} disabled={saving} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-bold shadow hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all disabled:opacity-50">Cancel</button>
            </div>
          </form>
        )}
        {/* User's Ideas */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{isOwnProfile ? 'Your Ideas' : `${userInfo.displayName || 'User'}'s Ideas`}</h2>
          {ideas.length === 0 ? (
            <div className="text-gray-500 mb-8">No ideas yet.</div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {ideas.map(idea => (
                <li key={idea.id} className="">
                  <div className="bg-white rounded-xl shadow border border-gray-100 p-6 h-full flex flex-col justify-between">
                    <Link href={`/idea/${idea.id}`} className="text-blue-700 hover:underline font-semibold text-lg mb-2 block">{idea.title}</Link>
                    <p className="text-gray-500 text-sm mb-1">{idea.category}</p>
                    <p className="text-gray-700 text-base line-clamp-3 mb-2">{idea.description}</p>
                    <div className="flex flex-wrap gap-2 mt-auto">
                      {idea.tags && idea.tags.slice(0, 3).map((tag: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">#{tag}</span>
                      ))}
                      {idea.tags && idea.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full">+{idea.tags.length - 3} more</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
} 