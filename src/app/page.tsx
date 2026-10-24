'use client';

import React from 'react';
import { useChatStore } from '../store/useChatStore';
import { fazaaChatApi } from '../lib/fazaadb';

// Components
import { AuthScreen } from '../components/AuthScreen';
import { Sidebar } from '../components/Sidebar';
import { ConversationArea } from '../components/ConversationArea';
import { ProfilePanel } from '../components/ProfilePanel';
import { NewChatModal } from '../components/NewChatModal';
import { SettingsModal } from '../components/SettingsModal';

export default function ChatApp() {
  const {
    currentUser,
    setCurrentUser,
    allUsers,
    setAllUsers,
    conversations,
    setConversations,
    activeConversation,
    setActiveConversation,
    messages,
    setMessages,
    addMessage,
    deleteMessageFromState,
    setIsWsConnected,
    showProfilePanel,
  } = useChatStore();

  const [isNewChatOpen, setIsNewChatOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [mobileView, setMobileView] = React.useState<'list' | 'chat'>('list');
  const [authChecked, setAuthChecked] = React.useState(false);

  // 1. Check local session and load users on mount
  React.useEffect(() => {
    async function initAuthAndUsers() {
      try {
        const users = await fazaaChatApi.getUsers();
        setAllUsers(users);

        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('fazaachat_user');
          if (stored) {
            try {
              const savedUser = JSON.parse(stored);
              const matched = users.find((u: any) => u.id === savedUser.id);
              if (matched) {
                setCurrentUser(matched);
                fazaaChatApi
                  .updateUser(matched.id, {
                    is_online: 1,
                    last_seen: new Date().toISOString(),
                  })
                  .catch(() => {});
              } else {
                localStorage.removeItem('fazaachat_user');
                setCurrentUser(null);
              }
            } catch {
              localStorage.removeItem('fazaachat_user');
              setCurrentUser(null);
            }
          }
        }
      } catch (err) {
        console.error('Failed to init users:', err);
      } finally {
        setAuthChecked(true);
      }
    }

    initAuthAndUsers();
  }, [setAllUsers, setCurrentUser]);

  // Handle Logout
  const handleLogout = async () => {
    if (currentUser) {
      try {
        await fazaaChatApi.updateUser(currentUser.id, {
          is_online: 0,
          last_seen: new Date().toISOString(),
        });
      } catch {}
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fazaachat_user');
    }
    setCurrentUser(null);
    setActiveConversation(null);
    setConversations([]);
    setMessages([]);
  };

  // 2. Load conversations whenever currentUser changes
  React.useEffect(() => {
    if (!currentUser) return;

    async function loadConvs() {
      try {
        const convList = await fazaaChatApi.getConversations(currentUser!.id);
        setConversations(convList);

        if (convList && convList.length > 0 && !activeConversation) {
          setActiveConversation(convList[0]);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      }
    }

    loadConvs();
  }, [currentUser, setConversations, activeConversation, setActiveConversation]);

  // 3. Load messages whenever activeConversation changes
  React.useEffect(() => {
    if (!activeConversation) return;

    async function loadMessages() {
      try {
        const msgList = await fazaaChatApi.getMessages(activeConversation.id);
        setMessages(msgList);
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    }

    loadMessages();
  }, [activeConversation, setMessages]);

  // 4. WebSocket Realtime Engine Integration
  React.useEffect(() => {
    if (!currentUser) return;

    let ws: WebSocket;
    const wsUrl = `${fazaaChatApi.getWsUrl()}?key=fza_srv_d9401b81f7fb73ca0e45f760084df08ccf52490269ef0f3a&project=fazaachat`;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsWsConnected(true);
        // Subscribe to messages, conversations, and chat_users
        ws.send(JSON.stringify({ action: 'subscribe', table: 'messages' }));
        ws.send(JSON.stringify({ action: 'subscribe', table: 'conversations' }));
        ws.send(JSON.stringify({ action: 'subscribe', table: 'chat_users' }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'broadcast') {
            if (data.table === 'messages') {
              if (data.action === 'created' && data.record) {
                const newMsg = data.record;

                // Add to current conversation if matching
                if (activeConversation && newMsg.conversation_id === activeConversation.id) {
                  addMessage(newMsg);
                }

                // Update conversation last message in sidebar
                setConversations((prev) =>
                  prev.map((c) =>
                    c.id === newMsg.conversation_id
                      ? {
                          ...c,
                          last_message: newMsg.message,
                          last_message_time: newMsg.created_at,
                        }
                      : c
                  )
                );
              } else if (data.action === 'deleted') {
                deleteMessageFromState(data.id);
              }
            } else if (data.table === 'conversations') {
              if (data.action === 'created' && data.record) {
                setConversations((prev) => [data.record, ...prev]);
              }
            } else if (data.table === 'chat_users') {
              // Update user status in list
              if (data.record) {
                setAllUsers(
                  allUsers.map((u) => (u.id === data.record.id ? { ...u, ...data.record } : u))
                );
              }
            }
          }
        } catch {}
      };

      ws.onclose = () => setIsWsConnected(false);
      ws.onerror = () => setIsWsConnected(false);
    } catch {
      setIsWsConnected(false);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [
    currentUser,
    activeConversation,
    addMessage,
    deleteMessageFromState,
    setConversations,
    setIsWsConnected,
    allUsers,
    setAllUsers,
  ]);

  if (!authChecked) {
    return (
      <div className="flex w-full h-screen items-center justify-center bg-[#111111]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Memuat fazaaChat...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

  return (
    <div className="flex w-full h-screen overflow-hidden bg-[#111111]">
      {/* Left Sidebar (Desktop always visible, Mobile conditionally) */}
      <div
        className={`h-full ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex w-full md:w-auto'
        }`}
      >
        <Sidebar
          onOpenNewChat={() => setIsNewChatOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onLogout={handleLogout}
        />
      </div>

      {/* Center Conversation Area */}
      <div
        className={`flex-1 h-full flex flex-col min-w-0 ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex w-full'
        }`}
      >
        <ConversationArea onBackMobile={() => setMobileView('list')} />
      </div>

      {/* Right Details Profile Panel (Desktop only) */}
      {showProfilePanel && activeConversation && (
        <div className="hidden lg:flex h-full">
          <ProfilePanel onLogout={handleLogout} />
        </div>
      )}

      {/* Modals */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLogout={handleLogout}
      />
    </div>
  );
}
