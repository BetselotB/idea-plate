'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { IDEA_CATEGORIES } from '@/types/idea';
import { Idea } from '@/types/idea';
import { useClickOutside } from '@/hooks/useClickOutside';
import { addComment, getComments, deleteComment, IdeaComment, likeIdea, unlikeIdea, hasLikedIdea, getLikesCount } from '@/lib/ideas';
import { sendCollabRequest } from '@/lib/ideas';

export default function IdeaDetail() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const ideaId = params.id as string;
  
  const [idea, setIdea] = useState<Idea | null>(null);
  const [loadingIdea, setLoadingIdea] = useState(true);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [comments, setComments] = useState<IdeaComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [collabLoading, setCollabLoading] = useState(false);
  const [collabError, setCollabError] = useState('');
  const [collabSuccess, setCollabSuccess] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);

  useClickOutside(dropdownRef, () => setShowDropdown(false));

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    } else if (!loading && user && !user.emailVerified) {
      router.push('/verify-email');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user?.emailVerified && ideaId) {
      fetchIdea();
    }
  }, [ideaId, user]);

  useEffect(() => {
    if (ideaId) {
      setCommentsLoading(true);
      getComments(ideaId).then(cs => { setComments(cs); setCommentsLoading(false); });
    }
  }, [ideaId]);

  useEffect(() => {
    if (ideaId) {
      // Real-time like count
      const likesCol = collection(db, `ideas/${ideaId}/likes`);
      const unsub = onSnapshot(likesCol, (snap) => {
        setLikesCount(snap.size);
      });
      return () => unsub();
    }
  }, [ideaId]);

  useEffect(() => {
    if (user && ideaId) {
      hasLikedIdea(ideaId, user.uid).then(setHasLiked);
    }
  }, [user, ideaId, likesCount]);

  useEffect(() => {
    if (user) {
      getDoc(doc(db, 'users', user.uid)).then((snap) => {
        if (snap.exists()) setUserProfile(snap.data());
      });
    }
  }, [user]);

  const fetchIdea = async () => {
    setLoadingIdea(true);
    try {
      const ideaDoc = await getDoc(doc(db, "ideas", ideaId));
      if (ideaDoc.exists()) {
        const data = ideaDoc.data();
        const fetchedIdea: Idea = {
          id: ideaDoc.id,
          title: data.title,
          description: data.description,
          category: data.category,
          authorId: data.authorId,
          authorName: data.authorName,
          authorEmail: data.authorEmail,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          likes: data.likes || 0,
          comments: data.comments || 0,
          tags: data.tags || [],
          collaborationStatus: data.collaborationStatus,
          collaborators: data.collaborators || [],
          // @ts-ignore
          skills: data.skills || [],
        } as any;
        setIdea(fetchedIdea);
      } else {
        setError('Idea not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load idea');
    } finally {
      setLoadingIdea(false);
    }
  };

  const handleLike = async () => {
    if (!user || likeLoading) return;
    setLikeLoading(true);
    try {
      if (hasLiked) {
        await unlikeIdea(ideaId, user.uid);
        setHasLiked(false);
      } else {
        await likeIdea(ideaId, user.uid);
        setHasLiked(true);
      }
      // likesCount will update via onSnapshot
    } catch (err) {
      // Optionally show error
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = () => {
    // TODO: Implement comment functionality
    console.log('Comment on idea:', ideaId);
  };

  const handleAddComment = async () => {
    if (!user || !commentText.trim()) return;
    setCommentLoading(true);
    setCommentError('');
    try {
      await addComment(ideaId, user.uid, user.displayName || user.email || 'User', commentText.trim());
      setCommentText('');
      // Refresh comments
      const cs = await getComments(ideaId);
      setComments(cs);
    } catch (err: any) {
      setCommentError(err.message || 'Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    setCommentLoading(true);
    setCommentError('');
    try {
      await deleteComment(ideaId, commentId);
      // Refresh comments
      const cs = await getComments(ideaId);
      setComments(cs);
    } catch (err: any) {
      setCommentError(err.message || 'Failed to delete comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading || loadingIdea) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  if (!user.emailVerified) {
    return null; // Will redirect to verify-email
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Idea</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!idea) {
    return null;
  }

  const category = IDEA_CATEGORIES.find(cat => cat.value === idea.category);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Idea Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 sm:p-8">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {idea.authorName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <Link href={`/profile/${idea.authorId}`} className="hover:underline text-blue-600">
                    {idea.authorName}
                  </Link>
                  <p className="text-sm text-gray-500">{formatDate(idea.createdAt)}</p>
                </div>
              </div>
              
              {/* Category Badge */}
              {category && (
                <div className="flex items-center space-x-1 px-3 py-1 bg-gray-100 rounded-full">
                  <span className="text-sm">{category.icon}</span>
                  <span className="text-xs font-medium text-gray-700">{category.label}</span>
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{idea.title}</h1>

            {/* Tags */}
            {idea.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {idea.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <div className="prose max-w-none mb-6">
              <p className="text-gray-700 leading-relaxed text-base sm:text-lg whitespace-pre-wrap">
                {idea.description}
              </p>
            </div>

            {/* Collaborators */}
            {Array.isArray(idea.collaborators) && idea.collaborators.length > 0 ? (
              <div className="mb-4">
                <h3 className="text-md font-semibold text-gray-800 mb-1">Collaborators:</h3>
                <ul className="flex flex-wrap gap-2">
                  {idea.collaborators.map((c, idx) => (
                    <li key={c.userId || idx} className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full flex items-center gap-2">
                      {c.name}
                      {c.github && <a href={c.github} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 underline">GitHub</a>}
                      {c.linkedin && <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 underline">LinkedIn</a>}
                    </li>
                  ))} 
                </ul>
              </div>
            ) : (
              <div className="mb-4 text-gray-400 text-sm">No collaborators yet.</div>
            )}
            {/* Required Skills */}
            {Array.isArray((idea as any).skills) && ((idea as any).skills || []).length > 0 ? (
              <div className="mb-4">
                <h3 className="text-md font-semibold text-gray-800 mb-1">Required Skills:</h3>
                <ul className="flex flex-wrap gap-2">
                  {((idea as any).skills || []).map((skill: string, idx: number) => (
                    <li key={idx} className="px-3 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full">{skill}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mb-4 text-gray-400 text-sm">No specific skills required.</div>
            )}

            {/* Collaboration Status */}
            {idea.collaborationStatus && (
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${idea.collaborationStatus === 'lfp' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {idea.collaborationStatus === 'lfp' ? 'Looking for collaborators' : 'Giving up (take it!)'}
                </span>
              </div>
            )}
            {/* Let's Work Together Button */}
            {user && user.uid !== idea.authorId && idea.collaborationStatus === 'lfp' && (
              <button
                className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-2 px-6 rounded-lg hover:shadow-lg transition-all"
                onClick={() => setShowCollabModal(true)}
              >
                {`Let's Work Together`}
              </button>
            )}
            {/* Collaboration Modal */}
            {showCollabModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fadeIn">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative border border-gray-100 animate-modalPop">
                  <button aria-label="Close" className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl font-bold focus:outline-none" onClick={() => setShowCollabModal(false)}>&times;</button>
                  <h2 className="text-2xl font-bold mb-4 text-center text-blue-700">Let's Work Together</h2>
                  {Array.isArray((idea as any).skills) && ((idea as any).skills || []).length > 0 ? (
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-1">Required Skills for this project:</h3>
                      <ul className="flex flex-wrap gap-2">
                        {((idea as any).skills || []).map((skill: string, idx: number) => (
                          <li key={idx} className="px-3 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-full border border-yellow-100">{skill}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="mb-4 text-gray-400 text-sm text-center">No specific skills required.</div>
                  )}
                  {(!userProfile?.github && !userProfile?.linkedin) ? (
                    <div className="text-center">
                      <p className="mb-4 text-gray-700">To request collaboration, please link your GitHub or LinkedIn in your <a href={`/profile/${user.uid}`} className="text-blue-600 underline">profile</a>.</p>
                      <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform" onClick={() => { setShowCollabModal(false); window.location.href = `/profile/${user.uid}`; }}>Go to Profile</button>
                    </div>
                  ) : (
                    <form className="text-center" onSubmit={async (e) => {
                      e.preventDefault();
                      setCollabLoading(true);
                      setCollabError('');
                      setCollabSuccess('');
                      try {
                        const res = await sendCollabRequest({
                          ideaId: idea.id,
                          requesterId: user.uid,
                          requesterName: user.displayName || user.email || 'User',
                          requesterEmail: user.email || '',
                          requesterGithub: userProfile?.github,
                          requesterLinkedin: userProfile?.linkedin,
                        });
                        if (res.error) setCollabError(res.error);
                        else setCollabSuccess('Request sent!');
                      } catch (err: any) {
                        setCollabError(err.message || 'Failed to send request');
                      } finally {
                        setCollabLoading(false);
                      }
                    }}>
                      {collabError && <div className="text-red-600 mb-2 font-medium">{collabError}</div>}
                      {collabSuccess ? (
                        <div className="text-green-600 mb-4 font-medium">{collabSuccess}</div>
                      ) : (
                        <button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:scale-105 transition-transform disabled:opacity-50" disabled={collabLoading}>
                          {collabLoading ? 'Sending...' : 'Send Request'}
                        </button>
                      )}
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Stats and Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-100">
              <div className="flex items-center space-x-6">
                <button
                  onClick={handleLike}
                  disabled={likeLoading}
                  className={`flex items-center space-x-2 transition-colors ${hasLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'} ${likeLoading ? 'opacity-50' : ''}`}
                >
                  <svg className="w-6 h-6" fill={hasLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="font-medium">{likesCount}</span>
                </button>
                
                <button
                  onClick={handleComment}
                  className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="font-medium">{idea.comments}</span>
                </button>
              </div>
              
              <div className="text-xs text-gray-400">
                ID: {idea.id.slice(-6)}
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Comments ({comments.length})</h2>
            {/* Comment Input */}
            <div className="mb-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-xs">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <textarea
                    placeholder="Add a comment..."
                    rows={3}
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={commentLoading}
                  />
                  {commentError && <div className="text-red-600 text-sm mt-1">{commentError}</div>}
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleAddComment}
                      disabled={commentLoading || !commentText.trim()}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 text-sm disabled:opacity-50"
                    >
                      {commentLoading ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* Comments List */}
            <div className="space-y-4">
              {commentsLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  </svg>
                  <p className="text-lg font-medium">Loading comments...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-lg font-medium">No comments yet</p>
                  <p className="text-sm">Be the first to share your thoughts!</p>
                </div>
              ) : (
                comments.map(comment => (
                  <div key={comment.id} className="flex items-start space-x-3 bg-gray-50 rounded-lg p-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-xs">
                        {comment.authorName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{comment.authorName}</span>
                        <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                        {user && comment.authorId === user.uid && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={commentLoading}
                            className="ml-2 text-xs text-red-500 hover:underline disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 mt-1 whitespace-pre-line">{comment.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 