'use client';

import { useRef, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCollabRequestsForUser, acceptCollabRequest, rejectCollabRequest } from '@/lib/ideas';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { UserIcon } from '@heroicons/react/24/solid';
import { BellIcon } from '@heroicons/react/24/outline';
import { useClickOutside } from '@/hooks/useClickOutside';

export default function RequestsPage() {
  const { user, loading } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(dropdownRef, () => setShowDropdown(false));

  useEffect(() => {
    if (user) {
      getCollabRequestsForUser(user.uid).then((reqs) => {
        setRequests(reqs);
        setLoadingReqs(false);
      });
    }
  }, [user]);

  const handleAction = async (reqId: string, action: 'accept' | 'reject') => {
    if (action === 'accept') {
      await acceptCollabRequest(reqId);
    } else {
      await rejectCollabRequest(reqId);
    }
    // Refresh requests
    if (user) {
      setLoadingReqs(true);
      const reqs = await getCollabRequestsForUser(user.uid);
      setRequests(reqs);
      setLoadingReqs(false);
    }
  };

  if (loading || loadingReqs) {
    return <div className="min-h-screen flex items-center justify-center text-lg">Loading requests...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Collaboration Requests</h1>
        {requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">This is where people request to work with you if you had an idea No collaboration requests yet.</div>
        ) : (
          <ul className="space-y-6">
            {requests.map((req) => (
              <li key={req.id} className="bg-white rounded-lg shadow p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="font-semibold text-lg text-gray-900 mb-1">{req.requesterName}</div>
                  <div className="text-gray-600 text-sm mb-1">{req.requesterEmail}</div>
                  <div className="flex gap-3 mt-1">
                    {req.requesterGithub && (
                      <a href={req.requesterGithub} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">GitHub</a>
                    )}
                    {req.requesterLinkedin && (
                      <a href={req.requesterLinkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">LinkedIn</a>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-sm text-gray-500">
                    For Idea: <Link href={`/idea/${req.ideaId}`} className="text-blue-600 underline">View Idea</Link>
                  </div>
                  {req.status === 'accepted' && <span className="text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full">Accepted</span>}
                  {req.status === 'rejected' && <span className="text-red-600 font-semibold bg-red-50 px-3 py-1 rounded-full">Rejected</span>}
                  {(!req.status || req.status === 'pending') && <span className="text-yellow-600 font-semibold bg-yellow-50 px-3 py-1 rounded-full">Pending</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
} 