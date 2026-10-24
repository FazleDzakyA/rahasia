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
  setAllUsers: (users: ChatUser[]) => void;
  conversations: ConversationItem[];
  setConversations: (convs: ConversationItem[]) => void;
  activeConversation: ConversationItem | null;
  setActiveConversation: (conv: ConversationItem | null) => void;
  activeMembers: ChatUser[];
  setActiveMembers: (members: ChatUser[]) => void;
  messages: MessageItem[];
  setMessages: (messages: MessageItem[]) => void;
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
  setAllUsers: (users) => set({ allUsers: users }),
  conversations: [],
  setConversations: (convs) => set({ conversations: convs }),
  activeConversation: null,
  setActiveConversation: (conv) => set({ activeConversation: conv, replyMessage: null }),
  activeMembers: [],
  setActiveMembers: (members) => set({ activeMembers: members }),
  messages: [],
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => {
      if (!message || !message.id) return state;
      // Check if already exists to prevent duplicate
      if (state.messages.some((m) => m && m.id === message.id)) {
        return state;
      }
      return { messages: [...state.messages, message] };
    }),
  deleteMessageFromState: (id) =>
    set((state) => ({ messages: state.messages.filter((m) => m.id !== id) })),
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
  showProfilePanel: true,
  setShowProfilePanel: (show) => set({ showProfilePanel: show }),
  toggleProfilePanel: () =>
    set((state) => ({ showProfilePanel: !state.showProfilePanel })),
}));
