import { useState, useEffect, useRef, useCallback } from "react";
import { Send, AlertCircle, Loader2, ChevronUp } from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { apiGet, apiPost } from "../../lib/api";

/**
 * ChatPanel — Reusable 1-on-1 messaging component for portfolio-scoped conversations.
 *
 * Props:
 * - portfolioContextId: string — the portfolio/project context ID for the conversation
 * - receiverId: string — the user ID of the other participant
 * - receiverName: string — display name of the other participant
 * - currentUserId: string — the current user's ID (to determine isMine)
 * - className: string (optional) — additional CSS classes for the container
 */
export default function ChatPanel({
  portfolioContextId,
  receiverId,
  receiverName = "User",
  currentUserId,
  className = "",
}) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [sendError, setSendError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const MAX_CHARS = 2000;

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch initial messages (most recent 50)
  const fetchMessages = useCallback(async () => {
    if (!portfolioContextId) return;

    setLoading(true);
    setError("");
    try {
      const res = await apiGet(`/messages/${portfolioContextId}`);
      const data = res.data || [];
      setMessages(data);
      // If we got exactly 50 messages, there may be more
      setHasMore(data.length >= 50);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setError("Failed to load messages. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [portfolioContextId]);

  // Load older messages (pagination via "before" cursor)
  const loadMore = async () => {
    if (messages.length === 0 || loadingMore) return;

    setLoadingMore(true);
    try {
      const oldestMessage = messages[0];
      const res = await apiGet(`/messages/${portfolioContextId}`, {
        before: oldestMessage.createdAt,
      });
      const olderMessages = res.data || [];

      if (olderMessages.length > 0) {
        setMessages((prev) => [...olderMessages, ...prev]);
      }
      // If we got fewer than 50, no more messages to load
      setHasMore(olderMessages.length >= 50);
    } catch (err) {
      console.error("Failed to load more messages:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Fetch messages on mount and when portfolioContextId changes
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Scroll to bottom when messages change (initial load or new messages sent)
  useEffect(() => {
    if (!loadingMore) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom, loadingMore]);

  // Validate message content
  const validateMessage = (content) => {
    const trimmed = content.trim();
    if (!trimmed) {
      return "Message cannot be empty. Please enter your message.";
    }
    if (trimmed.length > MAX_CHARS) {
      return `Message exceeds the maximum of ${MAX_CHARS} characters.`;
    }
    return "";
  };

  // Send message
  const handleSend = async () => {
    const validationError = validateMessage(inputValue);
    if (validationError) {
      setSendError(validationError);
      return;
    }

    setSendError("");
    setSending(true);
    try {
      const res = await apiPost("/messages", {
        receiverId,
        content: inputValue.trim(),
        portfolioContextId,
      });

      const newMessage = res.data || res;
      setMessages((prev) => [...prev, newMessage]);
      setInputValue("");
    } catch (err) {
      console.error("Failed to send message:", err);
      // Preserve the message content so user can retry
      setSendError("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // Handle Enter key to send (Shift+Enter for newline)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Determine if a message is from the current user
  const isMine = (message) => message.senderId === currentUserId;

  // Format timestamp
  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get initials for avatar fallback
  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Character count display
  const charCount = inputValue.trim().length;
  const isOverLimit = charCount > MAX_CHARS;

  return (
    <div className={`flex flex-col h-full border rounded-lg bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-gray-50 rounded-t-lg">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="text-xs bg-indigo-100 text-indigo-700">
            {getInitials(receiverName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium text-gray-900">{receiverName}</p>
          <p className="text-xs text-gray-500">Direct Message</p>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[200px] max-h-[400px]"
      >
        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center pb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMore}
              disabled={loadingMore}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              {loadingMore ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <ChevronUp className="h-3 w-3 mr-1" />
              )}
              {loadingMore ? "Loading..." : "Load older messages"}
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Loading messages...</span>
          </div>
        ) : error ? (
          /* Error State */
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mb-2" />
            <p className="text-sm text-red-600">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchMessages}
              className="mt-2 text-indigo-600 hover:text-indigo-700"
            >
              Try again
            </Button>
          </div>
        ) : messages.length === 0 ? (
          /* Empty State */
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-gray-500">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          /* Message List */
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${isMine(message) ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 ${
                  isMine(message)
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    isMine(message) ? "text-indigo-200" : "text-gray-500"
                  }`}
                >
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t px-4 py-3 space-y-2">
        {/* Send Error */}
        {sendError && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{sendError}</span>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                if (sendError) setSendError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              rows={1}
              className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[40px] max-h-[120px]"
              style={{ height: "auto", overflow: "hidden" }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              disabled={sending}
              aria-label="Message input"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={sending || !inputValue.trim()}
            size="icon"
            className="h-10 w-10 bg-indigo-600 hover:bg-indigo-700 flex-shrink-0"
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Character count indicator */}
        <div className="flex justify-end">
          <span
            className={`text-xs ${
              isOverLimit ? "text-red-600 font-medium" : "text-gray-400"
            }`}
          >
            {charCount}/{MAX_CHARS}
          </span>
        </div>
      </div>
    </div>
  );
}
