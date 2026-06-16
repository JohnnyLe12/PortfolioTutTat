import { useState, useEffect, useRef } from "react";
import { Send, Loader2, MessageSquare } from "lucide-react";

import { apiGet, apiPost } from "../lib/api";
import { Button } from "./ui/button";

/**
 * ChatPanel component for 1-on-1 messaging between Buddy and Mentee.
 *
 * Props:
 * - portfolioContextId: The project ID used as the messaging context
 * - currentUserId: The current logged-in user's ID
 * - receiverId: The other participant's user ID (optional, resolved from messages if null)
 */
export default function ChatPanel({ portfolioContextId, currentUserId, receiverId }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!portfolioContextId) return;
    fetchMessages();
  }, [portfolioContextId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function fetchMessages() {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet(`/messages/${portfolioContextId}`);
      setMessages(result.data || []);
    } catch (err) {
      setError(err.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const content = inputValue.trim();
    if (!content || content.length === 0 || content.length > 2000) return;

    // Determine receiver from messages if not provided
    let targetReceiverId = receiverId;
    if (!targetReceiverId && messages.length > 0) {
      const otherMessage = messages.find((m) => m.senderId !== currentUserId);
      if (otherMessage) {
        targetReceiverId = otherMessage.senderId;
      }
    }

    if (!targetReceiverId) {
      setError("Unable to determine message recipient");
      return;
    }

    setSending(true);
    setError(null);
    try {
      await apiPost("/messages", {
        receiverId: targetReceiverId,
        content,
        portfolioContextId,
      });
      setInputValue("");
      // Refresh messages to include the new one
      await fetchMessages();
    } catch (err) {
      setError(err.message || "Failed to send message");
      // Keep the input value so user can retry
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
        <span className="ml-2 text-sm text-gray-600">Loading chat...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-gray-50 rounded-lg border">
      {/* Chat Header */}
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-white rounded-t-lg">
        <MessageSquare className="w-4 h-4 text-indigo-600" />
        <span className="text-sm font-medium text-gray-700">Review Chat</span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 max-h-80 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-6">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${
                    isMine
                      ? "bg-indigo-600 text-white"
                      : "bg-white border text-gray-800"
                  }`}
                >
                  <p className="break-words">{msg.content}</p>
                  <p
                    className={`text-xs mt-1 ${
                      isMine ? "text-indigo-200" : "text-gray-400"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-red-600 text-xs">
          {error}
        </div>
      )}

      {/* Input Area */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 p-3 border-t bg-white rounded-b-lg"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type a message..."
          maxLength={2000}
          className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          disabled={sending}
        />
        <Button
          type="submit"
          size="sm"
          disabled={sending || !inputValue.trim()}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
