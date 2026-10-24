'use client';

import React from 'react';
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Check,
  CheckCheck,
  Reply,
  Trash2,
  Image as ImageIcon,
  FileText,
  X,
  Phone,
  Video,
  Info,
  ChevronLeft,
} from 'lucide-react';
import { useChatStore, MessageItem } from '../store/useChatStore';
import { fazaaChatApi } from '../lib/fazaadb';

export const ConversationArea: React.FC<{
  onBackMobile?: () => void;
}> = ({ onBackMobile }) => {
  const {
    currentUser,
    allUsers,
    activeConversation,
    messages,
    addMessage,
    deleteMessageFromState,
    replyMessage,
    setReplyMessage,
    typingUsers,
    showProfilePanel,
    toggleProfilePanel,
  } = useChatStore();

  const [inputMessage, setInputMessage] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [filePreview, setFilePreview] = React.useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = React.useRef<any>(null);

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Helper to get active chat participant details
  const getChatPartner = () => {
    if (!activeConversation) return null;
    if (activeConversation.type === 'group') {
      return {
        name: activeConversation.name || 'Group Chat',
        avatar: activeConversation.avatar || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop',
        status: 'Active Group',
        isOnline: true,
      };
    }

    const other = allUsers.find(
      (u) => u.id !== currentUser?.id && activeConversation.id.includes(u.username)
    ) || allUsers.find((u) => u.id !== currentUser?.id) || allUsers[0];

    return {
      name: other?.full_name || 'Chat',
      avatar: other?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
      status: other?.is_online ? 'Online' : 'Last seen recently',
      isOnline: Boolean(other?.is_online),
      username: other?.username,
    };
  };

  const partner = getChatPartner();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputMessage.trim() && !selectedFile) || !currentUser || !activeConversation || sending) {
      return;
    }

    setSending(true);

    try {
      let fileUrl = undefined;
      let msgType: 'text' | 'image' | 'video' | 'file' = 'text';

      if (selectedFile) {
        const uploadRes = await fazaaChatApi.uploadMedia(selectedFile);
        fileUrl = uploadRes.absoluteUrl;
        if (selectedFile.type.startsWith('image/')) msgType = 'image';
        else if (selectedFile.type.startsWith('video/')) msgType = 'video';
        else msgType = 'file';
      }

      const sent = await fazaaChatApi.sendMessage({
        conversationId: activeConversation.id,
        senderId: currentUser.id,
        message: inputMessage.trim() || (msgType === 'image' ? 'Image Attachment' : 'File Attachment'),
        type: msgType,
        fileUrl,
        replyToId: replyMessage?.id,
        replyPreview: replyMessage?.message,
      });

      addMessage(sent);
      setInputMessage('');
      setSelectedFile(null);
      setFilePreview(null);
      setReplyMessage(null);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      alert('Gagal mengirim pesan: ' + (err.message || 'Periksa koneksi ke server fazaaDB Cloud'));
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fazaaChatApi.deleteMessage(id);
      deleteMessageFromState(id);
    } catch (err) {
      alert('Gagal menghapus pesan.');
    }
  };

  const formatTime = (timeStr?: string | null) => {
    if (!timeStr) return '';
    try {
      const d = new Date(timeStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const quickEmojis = ['😀', '❤️', '👍', '🔥', '😂', '🎉', '🚀', '🙏'];

  if (!activeConversation) {
    return (
      <div className="flex-1 h-screen flex flex-col items-center justify-center p-8 text-center text-slate-400 select-none">
        <div className="w-16 h-16 rounded-3xl ios-glass-card flex items-center justify-center mb-4 text-[#0A84FF]">
          <Send className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white tracking-tight">Select a conversation</h3>
        <p className="text-xs max-w-sm mt-1 leading-relaxed">
          Pilih salah satu obrolan di sidebar sebelah kiri untuk mulai berkirim pesan realtime menggunakan fazaaDB Cloud.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen flex flex-col relative min-w-0 bg-[#111111]">
      {/* Conversation Top Header */}
      <header className="h-16 px-4 ios-glass border-b border-white/10 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center space-x-3">
          {onBackMobile && (
            <button
              onClick={onBackMobile}
              className="md:hidden p-1.5 rounded-full ios-glass text-slate-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div className="relative">
            <img
              src={partner?.avatar}
              alt=""
              className="w-10 h-10 rounded-full object-cover border border-white/10"
            />
            {partner?.isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#111111]" />
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-white tracking-tight leading-none">
              {partner?.name}
            </h3>
            <p className="text-[11px] text-blue-400 font-medium mt-1">
              {typingUsers.size > 0
                ? `${Array.from(typingUsers).join(', ')} sedang mengetik...`
                : partner?.status}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-slate-300">
          <button
            onClick={() => alert('Fitur panggilan audio diintegrasikan dengan WebRTC!')}
            className="w-8 h-8 rounded-full ios-glass-card flex items-center justify-center hover:text-white transition-colors"
            title="Audio Call"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            onClick={() => alert('Fitur panggilan video FaceTime diintegrasikan dengan WebRTC!')}
            className="w-8 h-8 rounded-full ios-glass-card flex items-center justify-center hover:text-white transition-colors"
            title="Video Call"
          >
            <Video className="w-4 h-4" />
          </button>
          <button
            onClick={toggleProfilePanel}
            className={`w-8 h-8 rounded-full ios-glass-card flex items-center justify-center transition-colors ${
              showProfilePanel ? 'text-blue-400 bg-white/10' : 'hover:text-white'
            }`}
            title="Detail Profile & Media"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUser?.id;
          const senderUser = allUsers.find((u) => u.id === msg.sender_id);

          return (
            <div
              key={msg.id}
              className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
            >
              {/* Group sender name */}
              {!isMe && activeConversation.type === 'group' && (
                <span className="text-[10px] font-semibold text-slate-400 mb-1 ml-3 font-mono">
                  {senderUser?.full_name || 'Member'}
                </span>
              )}

              {/* Message Bubble */}
              <div className="relative max-w-[85%] sm:max-w-[70%] group">
                {/* Reply context quote if message is reply */}
                {msg.reply_preview && (
                  <div
                    className={`text-[10px] px-3 py-1.5 rounded-t-xl mb-0.5 border-l-2 ${
                      isMe
                        ? 'bg-blue-700/40 border-white/60 text-blue-100'
                        : 'bg-white/5 border-blue-400 text-slate-300'
                    }`}
                  >
                    <span className="font-semibold block text-[9px] uppercase">Replying:</span>
                    <span className="line-clamp-1">{msg.reply_preview}</span>
                  </div>
                )}

                <div
                  className={`p-3.5 shadow-ios-bubble relative transition-all ${
                    isMe
                      ? 'bg-gradient-to-br from-[#0A84FF] to-[#0071E3] text-white rounded-[22px] rounded-br-[4px]'
                      : 'bg-white/[0.08] backdrop-blur-2xl border border-white/[0.08] text-[#F5F5F7] rounded-[22px] rounded-bl-[4px]'
                  }`}
                >
                  {/* Photo / Media Preview */}
                  {msg.type === 'image' && msg.file_url && (
                    <div className="mb-2 rounded-2xl overflow-hidden max-h-72">
                      <img
                        src={msg.file_url}
                        alt=""
                        className="w-full h-full object-cover cursor-pointer hover:scale-[1.02] transition-transform"
                        onClick={() => window.open(msg.file_url, '_blank')}
                      />
                    </div>
                  )}

                  {/* Message Text */}
                  <p className="text-xs sm:text-[13px] leading-relaxed break-words select-text">
                    {msg.message}
                  </p>

                  {/* Timestamp & Read Receipt */}
                  <div
                    className={`flex items-center justify-end space-x-1 mt-1 text-[10px] font-mono ${
                      isMe ? 'text-white/80' : 'text-slate-400'
                    }`}
                  >
                    <span>{formatTime(msg.created_at)}</span>
                    {isMe && (
                      <CheckCheck
                        className={`w-3.5 h-3.5 ${
                          msg.status === 'read' ? 'text-cyan-200' : 'text-white/70'
                        }`}
                      />
                    )}
                  </div>
                </div>

                {/* Floating Action Menu (Reply & Delete) */}
                <div
                  className={`absolute top-0 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 z-10 ${
                    isMe ? 'right-full mr-2' : 'left-full ml-2'
                  }`}
                >
                  <button
                    onClick={() => setReplyMessage(msg)}
                    className="p-1.5 rounded-full ios-glass-card text-slate-300 hover:text-white"
                    title="Reply"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(msg.id)}
                    className="p-1.5 rounded-full ios-glass-card text-slate-300 hover:text-rose-400"
                    title="Delete message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing indicator bubble */}
        {typingUsers.size > 0 && (
          <div className="flex items-center space-x-2 text-xs text-slate-400 p-2">
            <div className="flex space-x-1 bg-white/[0.08] px-3 py-2 rounded-full backdrop-blur-xl">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
            </div>
            <span className="text-[11px] font-mono">sedang mengetik...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Replying-to Preview Bar */}
      {replyMessage && (
        <div className="px-4 py-2 bg-white/[0.05] border-t border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Reply className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Replying to:</span>
            <span className="text-white truncate max-w-sm font-medium">{replyMessage.message}</span>
          </div>
          <button
            onClick={() => setReplyMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Selected File Upload Preview Bar */}
      {selectedFile && (
        <div className="px-4 py-2 bg-white/[0.05] border-t border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2.5">
            {filePreview ? (
              <img src={filePreview} alt="" className="w-8 h-8 rounded-lg object-cover" />
            ) : (
              <FileText className="w-5 h-5 text-blue-400" />
            )}
            <span className="text-white font-medium truncate max-w-xs">{selectedFile.name}</span>
          </div>
          <button
            onClick={() => {
              setSelectedFile(null);
              setFilePreview(null);
            }}
            className="text-slate-400 hover:text-rose-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Quick Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="px-4 py-2 border-t border-white/10 bg-[#161822]/90 backdrop-blur-xl flex items-center space-x-2">
          {quickEmojis.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setInputMessage((prev) => prev + emoji);
                setShowEmojiPicker(false);
              }}
              className="text-lg hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Floating Glass Input Bar (Apple Liquid Glass pill) */}
      <div className="p-3 sm:p-4 border-t border-white/10 bg-[#111111]/90 backdrop-blur-2xl shrink-0">
        <form onSubmit={handleSend} className="flex items-center space-x-2 max-w-5xl mx-auto">
          {/* File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 rounded-full ios-glass-card flex items-center justify-center text-slate-300 hover:text-white transition-colors shrink-0"
            title="Attach Media or File"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-9 h-9 rounded-full ios-glass-card flex items-center justify-center text-slate-300 hover:text-white transition-colors shrink-0"
            title="Emoji Picker"
          >
            <Smile className="w-4 h-4" />
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="iMessage • fazaaDB..."
              className="w-full px-4 py-2.5 rounded-full ios-glass-input text-xs sm:text-sm text-white"
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!inputMessage.trim() && !selectedFile) || sending}
            className="w-9 h-9 rounded-full bg-[#0A84FF] hover:bg-[#0071E3] text-white flex items-center justify-center shadow-md shadow-blue-500/25 transition-transform duration-200 hover:scale-105 disabled:opacity-40 disabled:scale-100 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
