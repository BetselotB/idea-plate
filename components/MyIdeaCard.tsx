'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IDEA_CATEGORIES } from '@/types/idea';
import { Idea } from '@/types/idea';
import { hasLikedIdea, likeIdea, unlikeIdea, getLikesCount } from '@/lib/ideas';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

interface MyIdeaCardProps {
  idea: Idea;
  onEdit: (idea: Idea) => void;
  onDelete: (ideaId: string) => void;
}

export default function MyIdeaCard({ idea, onEdit, onDelete }: MyIdeaCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(idea.likes || 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(idea.comments || 0);

  useEffect(() => {
    let mounted = true;
    if (user) {
      hasLikedIdea(idea.id, user.uid).then(setLiked);
    }
    // Real-time likes
    const likesCol = collection(db, `ideas/${idea.id}/likes`);
    const unsubLikes = onSnapshot(likesCol, (snap) => {
      if (mounted) setLikeCount(snap.size);
    });
    // Real-time comments
    const commentsCol = collection(db, `ideas/${idea.id}/comments`);
    const unsubComments = onSnapshot(commentsCol, (snap) => {
      if (mounted) setCommentCount(snap.size);
    });
    return () => { mounted = false; unsubLikes(); unsubComments(); };
  }, [idea.id, user]);

  const handleLikeClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || likeLoading) return;
    setLikeLoading(true);
    if (liked) {
      setLiked(false); setLikeCount(c => c - 1);
      await unlikeIdea(idea.id, user.uid);
    } else {
      setLiked(true); setLikeCount(c => c + 1);
      await likeIdea(idea.id, user.uid);
    }
    setLikeLoading(false);
  };

  const category = IDEA_CATEGORIES.find(cat => cat.value === idea.category);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Add a helper to format relative time
  function formatRelative(date: Date) {
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000; // seconds
    if (diff < 10) return 'just now';
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
    return date.toLocaleDateString();
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(idea.id);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {idea.authorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">
                <Link href={`/profile/${idea.authorId}`} className="hover:underline text-blue-600" onClick={e => e.stopPropagation()}>
                  {idea.authorName}
                </Link>
              </p>
              <p className="text-sm text-gray-500">
                {formatRelative(idea.createdAt)}
                {idea.updatedAt.getTime() !== idea.createdAt.getTime() && (
                  <span> · Updated {formatRelative(idea.updatedAt)}</span>
                )}
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(idea)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
              title="Edit idea"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
              title="Delete idea"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>

            <button
              onClick={handleLikeClick}
              disabled={!user || likeLoading}
              className={`flex items-center space-x-2 ${liked ? 'text-red-500' : 'text-gray-500'} hover:text-red-500 transition-colors`}
            >
              {likeLoading ? (
                <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
              ) : liked ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
              )}
              <span className="text-sm font-medium">{likeCount}</span>
            </button>
          </div>
        </div>

        {/* Title and Category */}
        <div className="mb-4">
          <Link href={`/idea/${idea.id}`} className="block">
            <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200 mb-2">
              {idea.title}
            </h3>
          </Link>
          
          {category && (
            <div className="flex items-center space-x-1 px-3 py-1 bg-gray-100 rounded-full w-fit">
              <span className="text-sm">{category.icon}</span>
              <span className="text-xs font-medium text-gray-700">{category.label}</span>
            </div>
          )}
          {idea.collaborationStatus && (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${idea.collaborationStatus === 'lfp' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {idea.collaborationStatus === 'lfp' ? 'Looking for collaborators' : 'Giving up (take it!)'}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 line-clamp-3 mb-4">
          {idea.description}
        </p>

        {/* Tags */}
        {idea.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {idea.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{idea.likes} likes</span>
            </span>
            <span className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{commentCount} comments</span>
            </span>
          </div>
          
          <Link
            href={`/idea/${idea.id}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            View Details →
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Idea</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{idea.title}"? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 