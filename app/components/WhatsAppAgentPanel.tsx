'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Phone, MessageSquare, Pause, Play, Clock } from 'lucide-react';

export default function WhatsAppAgentPanel() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  // ... rest of your code

  useEffect(() => {
    if (authenticated) {
      fetchConversations();
      const interval = setInterval(fetchConversations, 5000);
      return () => clearInterval(interval);
    }
  }, [authenticated]);

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  const handleAuth = () => {
    if (password === 'ilabs2024') {
      setAuthenticated(true);
    } else {
      alert('Invalid password');
    }
  };

  const toggleControl = async (phoneNumber: string, currentStatus: string) => {
    setLoading(true);
    try {
      await fetch('/api/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          action: currentStatus === 'ai' ? 'takeover' : 'resume'
        })
      });
      await fetchConversations();
    } catch (error) {
      console.error('Failed to toggle control:', error);
    }
    setLoading(false);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="flex items-center justify-center mb-6">
            <MessageSquare className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">iLabs WhatsApp Agent</h1>
          <p className="text-gray-600 text-center mb-6">Control Panel Access</p>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
              placeholder="Enter password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <button
              onClick={handleAuth}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Access Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-green-600" />
              <div>
                <h1 className="text-2xl font-bold">iLabs WhatsApp Agent</h1>
                <p className="text-gray-600">Control Panel</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-green-100 px-4 py-2 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-700 font-medium">Active</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h2 className="text-xl font-bold mb-4">Active Conversations</h2>
          
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No active conversations</p>
            </div>
          ) : (
            <div className="space-y-4">
              {conversations.map((conv) => (
                <div
                  key={conv.phoneNumber}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold text-lg">{conv.customerName || conv.phoneNumber}</span>
                        {conv.needsReview && (
                          <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Needs Review
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-600 mb-3">
                        <p className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Last message: {new Date(conv.lastMessageTime).toLocaleString()}
                        </p>
                        {conv.lastMessage && (
                          <p className="text-gray-500 italic">"{conv.lastMessage.substring(0, 100)}..."</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          conv.controlMode === 'ai' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {conv.controlMode === 'ai' ? '🤖 AI Mode' : '👤 Manual Mode'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {conv.messageCount} messages
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleControl(conv.phoneNumber, conv.controlMode)}
                      disabled={loading}
                      className={`ml-4 px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition ${
                        conv.controlMode === 'ai'
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {conv.controlMode === 'ai' ? (
                        <>
                          <Pause className="w-4 h-4" />
                          Take Over
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Resume AI
                        </>
                      )}
                    </button>
                  </div>

                  {conv.reviewReason && (
                    <div className="mt-3 bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-sm text-orange-800">
                        <strong>Review Reason:</strong> {conv.reviewReason}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-md p-4">
          <h3 className="font-semibold mb-2">Quick Guide</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>AI Mode:</strong> Claude handles all responses automatically</li>
            <li>• <strong>Manual Mode:</strong> You respond directly on WhatsApp, AI is paused</li>
            <li>• <strong>Take Over:</strong> Click to pause AI and handle conversation manually</li>
            <li>• <strong>Resume AI:</strong> Click to let AI take over again</li>
            <li>• <strong>Needs Review:</strong> AI detected a complex query requiring human attention</li>
          </ul>
        </div>
      </div>
    </div>
  );
}