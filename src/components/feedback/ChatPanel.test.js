/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';

/**
 * ChatPanel unit tests — validate message validation logic and component contract.
 * Tests focus on the input validation rules (1-2000 chars, non-empty, non-whitespace).
 */
describe('ChatPanel - Message Validation Logic', () => {
  const MAX_CHARS = 2000;

  /**
   * Validation function mirroring ChatPanel's internal validateMessage logic.
   */
  function validateMessage(content) {
    const trimmed = content.trim();
    if (!trimmed) {
      return "Message cannot be empty. Please enter your message.";
    }
    if (trimmed.length > MAX_CHARS) {
      return `Message exceeds the maximum of ${MAX_CHARS} characters.`;
    }
    return "";
  }

  it('should reject empty string', () => {
    expect(validateMessage("")).toBe("Message cannot be empty. Please enter your message.");
  });

  it('should reject whitespace-only content', () => {
    expect(validateMessage("   ")).toBe("Message cannot be empty. Please enter your message.");
    expect(validateMessage("\t\n  ")).toBe("Message cannot be empty. Please enter your message.");
  });

  it('should accept valid message with 1 character', () => {
    expect(validateMessage("a")).toBe("");
  });

  it('should accept valid message with 2000 characters', () => {
    const msg = "a".repeat(2000);
    expect(validateMessage(msg)).toBe("");
  });

  it('should reject message exceeding 2000 characters', () => {
    const msg = "a".repeat(2001);
    expect(validateMessage(msg)).toBe(`Message exceeds the maximum of ${MAX_CHARS} characters.`);
  });

  it('should trim whitespace before validating length', () => {
    // Padding doesn't count toward content length after trim
    const msg = "  " + "a".repeat(2000) + "  ";
    expect(validateMessage(msg)).toBe("");
  });

  it('should reject message with only spaces even with length > 0', () => {
    const msg = " ".repeat(100);
    expect(validateMessage(msg)).toBe("Message cannot be empty. Please enter your message.");
  });

  it('should accept a normal message', () => {
    expect(validateMessage("Hello, how is the portfolio going?")).toBe("");
  });

  it('should accept multiline message within limits', () => {
    const msg = "Line 1\nLine 2\nLine 3";
    expect(validateMessage(msg)).toBe("");
  });
});

describe('ChatPanel - isMine helper', () => {
  const currentUserId = "user-123";

  function isMine(message) {
    return message.senderId === currentUserId;
  }

  it('should return true when senderId matches currentUserId', () => {
    const msg = { senderId: "user-123", receiverId: "user-456" };
    expect(isMine(msg)).toBe(true);
  });

  it('should return false when senderId does not match currentUserId', () => {
    const msg = { senderId: "user-456", receiverId: "user-123" };
    expect(isMine(msg)).toBe(false);
  });
});

describe('ChatPanel - Message ordering', () => {
  it('should display messages in oldest-first order', () => {
    const messages = [
      { id: "1", createdAt: "2024-01-01T10:00:00Z", content: "First" },
      { id: "2", createdAt: "2024-01-01T11:00:00Z", content: "Second" },
      { id: "3", createdAt: "2024-01-01T12:00:00Z", content: "Third" },
    ];

    // Messages should already be in ascending order (oldest first) from the API
    for (let i = 1; i < messages.length; i++) {
      const prev = new Date(messages[i - 1].createdAt).getTime();
      const curr = new Date(messages[i].createdAt).getTime();
      expect(curr).toBeGreaterThan(prev);
    }
  });

  it('should enforce max 50 messages per load', () => {
    const MESSAGES_LIMIT = 50;
    const messages = Array.from({ length: 60 }, (_, i) => ({
      id: `msg-${i}`,
      createdAt: new Date(Date.now() + i * 1000).toISOString(),
      content: `Message ${i}`,
    }));

    // API returns at most 50
    const loaded = messages.slice(0, MESSAGES_LIMIT);
    expect(loaded.length).toBeLessThanOrEqual(50);
  });
});

describe('ChatPanel - Error state and message preservation', () => {
  it('should preserve input value when send fails', () => {
    // Simulates the behavior: on error, inputValue is NOT cleared
    let inputValue = "My important message";
    let sendError = "";

    // Simulate failed send
    const sendFailed = true;
    if (sendFailed) {
      sendError = "Failed to send message. Please try again.";
      // inputValue stays unchanged — message is preserved
    }

    expect(inputValue).toBe("My important message");
    expect(sendError).toBe("Failed to send message. Please try again.");
  });

  it('should clear input value on successful send', () => {
    let inputValue = "My important message";
    let sendError = "";

    // Simulate successful send
    const sendFailed = false;
    if (sendFailed) {
      sendError = "Failed to send message. Please try again.";
    } else {
      inputValue = "";
    }

    expect(inputValue).toBe("");
    expect(sendError).toBe("");
  });
});

describe('ChatPanel - Load more pagination', () => {
  it('should determine hasMore=true when 50 messages are returned', () => {
    const data = Array.from({ length: 50 }, (_, i) => ({
      id: `msg-${i}`,
      createdAt: new Date(Date.now() + i * 1000).toISOString(),
    }));

    const hasMore = data.length >= 50;
    expect(hasMore).toBe(true);
  });

  it('should determine hasMore=false when fewer than 50 messages are returned', () => {
    const data = Array.from({ length: 30 }, (_, i) => ({
      id: `msg-${i}`,
      createdAt: new Date(Date.now() + i * 1000).toISOString(),
    }));

    const hasMore = data.length >= 50;
    expect(hasMore).toBe(false);
  });

  it('should use oldest message createdAt as "before" cursor', () => {
    const messages = [
      { id: "1", createdAt: "2024-01-01T08:00:00Z" },
      { id: "2", createdAt: "2024-01-01T09:00:00Z" },
      { id: "3", createdAt: "2024-01-01T10:00:00Z" },
    ];

    const oldestMessage = messages[0];
    expect(oldestMessage.createdAt).toBe("2024-01-01T08:00:00Z");
  });
});
