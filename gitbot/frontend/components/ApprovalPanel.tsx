'use client';

import { useState } from 'react';
import { ThumbsUp, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';

interface ApprovalPanelProps {
  onApprove: () => void;
  onRequestChanges: () => void;
  currentStatus: 'pending' | 'approved' | 'rejected';
}

export function ApprovalPanel({
  onApprove,
  onRequestChanges,
  currentStatus,
}: ApprovalPanelProps) {
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 md:left-64 bg-slate-900 border-t border-slate-800 p-4 space-y-4">
      <div className="max-w-7xl mx-auto">
        {/* Status display */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentStatus === 'approved' ? (
              <>
                <CheckCircle size={20} className="text-green-500" />
                <span className="text-green-300 font-medium">Approved</span>
              </>
            ) : currentStatus === 'rejected' ? (
              <>
                <AlertCircle size={20} className="text-red-500" />
                <span className="text-red-300 font-medium">Changes Requested</span>
              </>
            ) : (
              <>
                <MessageSquare size={20} className="text-slate-400" />
                <span className="text-slate-400 font-medium">Awaiting Review</span>
              </>
            )}
          </div>
          <p className="text-xs text-slate-500">Last updated: 2 minutes ago</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={onApprove}
            disabled={currentStatus === 'approved'}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors"
          >
            <ThumbsUp size={18} />
            Approve PR
          </button>
          <button
            onClick={() => setShowFeedback(!showFeedback)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium rounded-lg transition-colors"
          >
            <MessageSquare size={18} />
            Request Changes
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium rounded-lg transition-colors">
            Share Feedback
          </button>
        </div>

        {/* Feedback form */}
        {showFeedback && (
          <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700 space-y-3">
            <p className="text-sm font-medium text-slate-300">Add your feedback</p>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Explain what needs to be changed..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 resize-none"
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowFeedback(false)}
                className="px-3 py-2 text-slate-300 hover:bg-slate-700 rounded-lg text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRequestChanges();
                  setFeedback('');
                  setShowFeedback(false);
                }}
                className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
