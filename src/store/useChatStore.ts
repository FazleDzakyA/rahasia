import { create } from 'zustand';

export interface ChatUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  avatar: string;
  status: string;
  is_online: boolean;
  last_seen: string;
}

export interface MessageItem {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  type: 'text' | 'image' | 'video' | 'file';
  file_url?: string;
  reply_to_id?: string;
  reply_preview?: string;
  status: 'sent' | 'delivered' | 'read';
  created_at: string;
  updated_at?: string;
}

export interface ConversationItem {
  id: string;
  type: 'private' | 'group';
  name?: string;
  avatar?: string;
  last_message?: string;
  last_message_time?: string;
  created_at: string;
  updated_at: string;
}

interface ChatState {
  currentUser: ChatUser | null;
  setCurrentUser: (user: ChatUser | null) => void;
  allUsers: ChatUser[];
  setAllUsers: (users: ChatUser[] | ((prev: ChatUser[]) => ChatUser[])) => void;
  conversations: ConversationItem[];
  setConversations: (convs: ConversationItem[] | ((prev: ConversationItem[]) => ConversationItem[])) => void;
  activeConversation: ConversationItem | null;
  setActiveConversation: (conv: ConversationItem | null) => void;
  activeMembers: ChatUser[];
  setActiveMembers: (members: ChatUser[] | ((prev: ChatUser[]) => ChatUser[])) => void;
  messages: MessageItem[];
  setMessages: (messages: MessageItem[] | ((prev: MessageItem[]) => MessageItem[])) => void;
  addMessage: (message: MessageItem) => void;
  deleteMessageFromState: (id: string) => void;
  replyMessage: MessageItem | null;
  setReplyMessage: (msg: MessageItem | null) => void;
  typingUsers: Set<string>; // set of usernames currently typing
  setTypingUser: (username: string, isTyping: boolean) => void;
  isWsConnected: boolean;
  setIsWsConnected: (connected: boolean) => void;
  showProfilePanel: boolean;
  setShowProfilePanel: (show: boolean) => void;
  toggleProfilePanel: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  allUsers: [],
  setAllUsers: (users) =>
    set((state) => ({
      allUsers:
        typeof users === 'function'
          ? (users as any)(state.allUsers || [])
          : Array.isArray(users)
          ? users
          : [],
    })),
  conversations: [],
  setConversations: (convs) =>
    set((state) => ({
      conversations:
        typeof convs === 'function'
          ? (convs as any)(state.conversations || [])
          : Array.isArray(convs)
          ? convs
          : [],
    })),
  activeConversation: null,
  setActiveConversation: (conv) => set({ activeConversation: conv, replyMessage: null }),
  activeMembers: [],
  setActiveMembers: (members) =>
    set((state) => ({
      activeMembers:
        typeof members === 'function'
          ? (members as any)(state.activeMembers || [])
          : Array.isArray(members)
          ? members
          : [],
    })),
  messages: [],
  setMessages: (messages) =>
    set((state) => ({
      messages:
        typeof messages === 'function'
          ? (messages as any)(state.messages || [])
          : Array.isArray(messages)
          ? messages
          : [],
    })),
  addMessage: (message) =>
    set((state) => {
      if (!message || !message.id) return state;
      const currentMessages = Array.isArray(state.messages) ? state.messages : [];
      // Check if already exists to prevent duplicate
      if (currentMessages.some((m) => m && m.id === message.id)) {
        return state;
      }
      return { messages: [...currentMessages, message] };
    }),
  deleteMessageFromState: (id) =>
    set((state) => ({
      messages: (Array.isArray(state.messages) ? state.messages : []).filter((m) => m && m.id !== id),
    })),
  replyMessage: null,
  setReplyMessage: (msg) => set({ replyMessage: msg }),
  typingUsers: new Set(),
  setTypingUser: (username, isTyping) =>
    set((state) => {
      const next = new Set(state.typingUsers);
      if (isTyping) next.add(username);
      else next.delete(username);
      return { typingUsers: next };
    }),
  isWsConnected: false,
  setIsWsConnected: (connected) => set({ isWsConnected: connected }),
  showProfilePanel: false, // Default to false on mobile & clean initial load
  setShowProfilePanel: (show) => set({ showProfilePanel: show }),
  toggleProfilePanel: () =>
    set((state) => ({ showProfilePanel: !state.showProfilePanel })),
}));
