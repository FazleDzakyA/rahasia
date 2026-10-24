const FAZAA_URL = process.env.NEXT_PUBLIC_FAZAA_URL || 'http://localhost:4000';
const PROJECT_SLUG = 'fazaachat';
const API_KEY = process.env.NEXT_PUBLIC_FAZAA_KEY || 'fza_srv_d9401b81f7fb73ca0e45f760084df08ccf52490269ef0f3a';

async function request(endpoint: string, options: RequestInit = {}) {
  const url = `${FAZAA_URL}/api/v1/projects/${PROJECT_SLUG}${endpoint}`;
  const headers: Record<string, string> = {
    'x-fazaadb-key': API_KEY,
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}`;
    try {
      const err = await res.json();
      errorMsg = err.error || err.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return res.text();
}

export const fazaaChatApi = {
  baseUrl: FAZAA_URL,

  // Users
  getUsers: async () => {
    const res = await request('/tables/chat_users/records?limit=100');
    return res.data || [];
  },
  getUserById: async (id: string) => {
    const res = await request(`/tables/chat_users/records/${id}`);
    return res.data;
  },
  createUser: async (user: {
    id?: string;
    username: string;
    email: string;
    password?: string;
    full_name: string;
    avatar?: string;
    status?: string;
  }) => {
    const res = await request('/tables/chat_users/records', {
      method: 'POST',
      body: JSON.stringify({
        ...user,
        is_online: 1,
        last_seen: new Date().toISOString(),
      }),
    });
    return res.data;
  },
  updateUser: async (id: string, patch: Record<string, any>) => {
    const res = await request(`/tables/chat_users/records/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patch),
    });
    return res.data;
  },

  // Conversations
  getConversations: async (userId: string) => {
    // 1. Get member rows for this user
    const memberRes = await request(
      `/tables/conversation_members/records?filter=${encodeURIComponent(JSON.stringify({ user_id: userId }))}`
    );
    const memberRows = memberRes.data || [];
    if (memberRows.length === 0) return [];

    const convIds = memberRows.map((m: any) => m.conversation_id);

    // 2. Fetch conversations
    const convRes = await request(
      `/tables/conversations/records?order=${encodeURIComponent(JSON.stringify([{ column: 'updated_at', direction: 'desc' }]))}&limit=100`
    );
    const allConvs = convRes.data || [];
    return allConvs.filter((c: any) => convIds.includes(c.id));
  },
  getConversationMembers: async (conversationId: string) => {
    const res = await request(
      `/tables/conversation_members/records?filter=${encodeURIComponent(
        JSON.stringify({ conversation_id: conversationId })
      )}`
    );
    return res.data || [];
  },
  createConversation: async (
    type: 'private' | 'group',
    name: string | null,
    memberUserIds: string[],
    avatar?: string
  ) => {
    const convId = `conv-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Create conversation record
    const conv = await request('/tables/conversations/records', {
      method: 'POST',
      body: JSON.stringify({
        id: convId,
        type,
        name: name || undefined,
        avatar: avatar || undefined,
        last_message: 'Conversation started',
        last_message_time: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });

    // Add members
    for (const uid of memberUserIds) {
      await request('/tables/conversation_members/records', {
        method: 'POST',
        body: JSON.stringify({
          conversation_id: convId,
          user_id: uid,
          role: uid === memberUserIds[0] ? 'admin' : 'member',
          joined_at: new Date().toISOString(),
        }),
      });
    }

    return conv.data;
  },

  // Messages
  getMessages: async (conversationId: string) => {
    const res = await request(
      `/tables/messages/records?filter=${encodeURIComponent(
        JSON.stringify({ conversation_id: conversationId })
      )}&order=${encodeURIComponent(JSON.stringify([{ column: 'created_at', direction: 'asc' }]))}&limit=200`
    );
    return res.data || [];
  },
  sendMessage: async (params: {
    conversationId: string;
    senderId: string;
    message: string;
    type?: 'text' | 'image' | 'video' | 'file';
    fileUrl?: string;
    replyToId?: string;
    replyPreview?: string;
  }) => {
    const now = new Date().toISOString();

    const created = await request('/tables/messages/records', {
      method: 'POST',
      body: JSON.stringify({
        conversation_id: params.conversationId,
        sender_id: params.senderId,
        message: params.message,
        type: params.type || 'text',
        file_url: params.fileUrl || undefined,
        reply_to_id: params.replyToId || undefined,
        reply_preview: params.replyPreview || undefined,
        status: 'sent',
        created_at: now,
        updated_at: now,
      }),
    });

    // Update conversation last_message
    await request(`/tables/conversations/records/${params.conversationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        last_message: params.type === 'image' ? '📷 Photo' : params.message,
        last_message_time: now,
        updated_at: now,
      }),
    });

    return created.data;
  },
  deleteMessage: async (messageId: string) => {
    return request(`/tables/messages/records/${messageId}`, {
      method: 'DELETE',
    });
  },

  // File Upload via Storage Engine
  uploadMedia: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'chat_media');
    formData.append('folder', 'attachments');

    const res = await fetch(`${FAZAA_URL}/api/v1/storage/upload`, {
      method: 'POST',
      headers: {
        'x-project-id': PROJECT_SLUG,
        'x-fazaadb-key': API_KEY,
      },
      body: formData,
    });

    if (!res.ok) throw new Error('File upload failed');
    const data = await res.json();
    return {
      ...data.data,
      absoluteUrl: `${FAZAA_URL}${data.data.publicUrl}`,
    };
  },
};
