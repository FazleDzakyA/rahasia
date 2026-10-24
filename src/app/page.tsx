'use client';

import React from 'react';
import { useChatStore } from '../store/useChatStore';
import { fazaaChatApi } from '../lib/fazaadb';

// Components
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

  // 1. Initial Load of Users and Current User
  React.useEffect(() => {
    async function initUsers() {
      try {
        const users = await fazaaChatApi.getUsers();
        setAllUsers(users);

        if (users && users.length > 0 && !currentUser) {
          // Default to Faza
          const defaultUser = users.find((u: any) => u.username === 'faza') || users[0];
          setCurrentUser(defaultUser);
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      }
    }

    initUsers();
  }, [currentUser, setAllUsers, setCurrentUser]);

  // 2. Load conversations whenever currentUser changes
  React.useEffect(() => {
    if (!currentUser) return;

    async function loadConvs() {
      try {
        const convList = await fazaaChatApi.getConversations(currentUser.id);
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
    let ws: WebSocket;
    const wsUrl = `ws://localhost:4000/realtime?key=fza_srv_d9401b81f7fb73ca0e45f760084df08ccf52490269ef0f3a&project=fazaachat`;

    try {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsWsConnected(true);
        // Subscribe to messages table mutations
        ws.send(JSON.stringify({ action: 'subscribe', table: 'messages' }));
        ws.send(JSON.stringify({ action: 'subscribe', table: 'conversations' }));
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
  }, [activeConversation, addMessage, deleteMessageFromState, setConversations, setIsWsConnected]);

  // Handle Mobile View State
  const handleSelectConvMobile = (conv: any) => {
    setActiveConversation(conv);
    setMobileView('chat');
  };

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
          <ProfilePanel onLogout={() => alert('Logged out demo')} />
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
      />
    </div>
  );
}
