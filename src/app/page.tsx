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
import { ErrorBoundary } from '../components/ErrorBoundary';

function MainChatLayout({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const {
    activeConversation,
    setActiveConversation,
    showProfilePanel,
  } = useChatStore();

  const [isNewChatOpen, setIsNewChatOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [mobileView, setMobileView] = React.useState<'list' | 'chat'>('list');

  const goBackToList = React.useCallback(() => {
    setMobileView('list');
    setActiveConversation(null);
  }, [setActiveConversation]);

  // Intercept hardware/browser back button on mobile
  // When entering chat view, push a history entry so back button goes to list, not exits app
  React.useEffect(() => {
    if (mobileView === 'chat') {
      // Push dummy history state to capture back button
      window.history.pushState({ fazaaChat: 'chat' }, '');

      const handlePopState = (e: PopStateEvent) => {
        // Back pressed — go to list instead of leaving the page
        goBackToList();
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [mobileView, goBackToList]);

  return (
    <div className="flex w-full h-[100dvh] overflow-hidden bg-[#111111]">
      {/* Left Sidebar (Desktop always visible, Mobile conditionally) */}
      <div
        className={`h-full ${
          mobileView === 'chat' ? 'hidden md:flex' : 'flex w-full md:w-auto'
        }`}
      >
        <Sidebar
          onOpenNewChat={() => setIsNewChatOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onLogout={onLogout}
          onSelectConversation={(conv) => {
            setActiveConversation(conv);
            setMobileView('chat');
          }}
        />
      </div>

      {/* Center Conversation Area */}
      <div
        className={`flex-1 h-full flex flex-col min-w-0 ${
          mobileView === 'list' ? 'hidden md:flex' : 'flex w-full'
        }`}
      >
        <ConversationArea onBackMobile={goBackToList} />
      </div>

      {/* Right Details Profile Panel (Desktop only) */}
      {showProfilePanel && activeConversation && (
        <div className="hidden lg:flex h-full">
          <ProfilePanel onLogout={onLogout} />
        </div>
      )}

      {/* Modals */}
      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
        onCreated={() => setMobileView('chat')}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onLogout={onLogout}
      />
    </div>
  );
}

export default function ChatApp() {
  const {
    currentUser,
    setCurrentUser,
    allUsers,
    setAllUsers,
    setConversations,
    activeConversation,
    setActiveConversation,
    setActiveMembers,
    setMessages,
    addMessage,
    deleteMessageFromState,
    setIsWsConnected,
  } = useChatStore();

  const [authChecked, setAuthChecked] = React.useState(false);

  // 1. Check local session and load users on mount
  React.useEffect(() => {
    async function initAuthAndUsers() {
      try {
        await fazaaChatApi.autoDiscoverServerUrl();
        const users = await fazaaChatApi.getUsers();
        setAllUsers(Array.isArray(users) ? users : []);

        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('fazaachat_user');
          if (stored) {
            try {
              const savedUser = JSON.parse(stored);
              const matched = (Array.isArray(users) ? users : []).find(
                (u: any) => u && u.id === savedUser.id
              );
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
        const safeList = Array.isArray(convList) ? convList : [];
        setConversations(safeList);

        if (safeList.length > 0 && !activeConversation) {
          setActiveConversation(safeList[0]);
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
    const currentConvId = activeConversation.id;

    async function loadMessages() {
      try {
        const msgList = await fazaaChatApi.getMessages(currentConvId);
        setMessages(Array.isArray(msgList) ? msgList : []);

        if (activeConversation.type === 'group') {
          const memberRows = await fazaaChatApi.getConversationMembers(currentConvId);
          const memberUserIds = (memberRows || []).map((m: any) => m.user_id);
          const matchedMembers = (allUsers || []).filter((u) => u && memberUserIds.includes(u.id));
          setActiveMembers(matchedMembers);
        } else {
          setActiveMembers([]);
        }
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
                  (Array.isArray(prev) ? prev : []).map((c) =>
                    c && c.id === newMsg.conversation_id
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
                setConversations((prev) => {
                  const arr = Array.isArray(prev) ? prev : [];
                  if (arr.some((c) => c && c.id === data.record.id)) return arr;
                  return [data.record, ...arr];
                });
              } else if (data.action === 'updated' && data.record) {
                setConversations((prev) =>
                  (Array.isArray(prev) ? prev : []).map((c) =>
                    c && c.id === data.record.id ? { ...c, ...data.record } : c
                  )
                );
              }
            } else if (data.table === 'chat_users') {
              if (data.record) {
                setAllUsers((prev) =>
                  (Array.isArray(prev) ? prev : []).map((u) =>
                    u && u.id === data.record.id ? { ...u, ...data.record } : u
                  )
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
    <ErrorBoundary>
      <MainChatLayout onLogout={handleLogout} />
    </ErrorBoundary>
  );
}
