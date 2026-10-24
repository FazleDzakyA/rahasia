const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_FAZAA_URL) {
    return process.env.NEXT_PUBLIC_FAZAA_URL;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }
  return 'http://localhost:4000';
};

const getWsUrl = () => {
  if (process.env.NEXT_PUBLIC_FAZAA_WS_URL) {
    return process.env.NEXT_PUBLIC_FAZAA_WS_URL;
  }
  if (process.env.NEXT_PUBLIC_FAZAA_URL) {
    try {
      const u = new URL(process.env.NEXT_PUBLIC_FAZAA_URL);
      const wsProtocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${wsProtocol}//${u.host}/realtime`;
    } catch {}
  }
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.hostname}:4000/realtime`;
  }
  return 'ws://localhost:4000/realtime';
};

const PROJECT_SLUG = 'fazaachat';
const API_KEY = process.env.NEXT_PUBLIC_FAZAA_KEY || 'fza_srv_d9401b81f7fb73ca0e45f760084df08ccf52490269ef0f3a';

async function request(endpoint: string, options: RequestInit = {}) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/api/v1/projects/${PROJECT_SLUG}${endpoint}`;
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
  getBaseUrl,
  getWsUrl,

  // Authentication & Users
  login: async (usernameOrEmail: string, password: string) => {
    const users = await fazaaChatApi.getUsers();
    const found = users.find(
      (u: any) =>
        (u.username.toLowerCase() === usernameOrEmail.toLowerCase() ||
          u.email.toLowerCase() === usernameOrEmail.toLowerCase()) &&
        u.password === password
    );

    if (!found) {
      throw new Error('Username/email atau password salah!');
    }

    // Set user online
    await fazaaChatApi.updateUser(found.id, {
      is_online: 1,
      last_seen: new Date().toISOString(),
    });

    return found;
  },

  register: async (params: {
    username: string;
    email: string;
    password: string;
    full_name: string;
    avatar?: string;
    status?: string;
  }) => {
    const existing = await fazaaChatApi.getUsers();
    if (existing.some((u: any) => u.username.toLowerCase() === params.username.toLowerCase())) {
      throw new Error('Username sudah digunakan, silakan pilih username lain!');
    }
    if (existing.some((u: any) => u.email.toLowerCase() === params.email.toLowerCase())) {
      throw new Error('Email sudah terdaftar!');
    }

    const defaultAvatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(
      params.username
    )}`;

    const newUser = await request('/tables/chat_users/records', {
      method: 'POST',
      body: JSON.stringify({
        username: params.username.trim().toLowerCase(),
        email: params.email.trim().toLowerCase(),
        password: params.password,
        full_name: params.full_name.trim(),
        avatar: params.avatar?.trim() || defaultAvatar,
        status: params.status?.trim() || 'Hey there! I am using fazaaChat.',
        is_online: 1,
        last_seen: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }),
    });

    return newUser.data;
  },

  getUsers: async () => {
    const res = await request('/tables/chat_users/records?limit=100');
    return res.data || [];
  },

  getUserById: async (id: string) => {
    const res = await request(`/tables/chat_users/records/${id}`);
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
    const memberRes = await request(
      `/tables/conversation_members/records?filter=${encodeURIComponent(JSON.stringify({ user_id: userId }))}`
    );
    const memberRows = memberRes.data || [];
    if (memberRows.length === 0) return [];

    const convIds = memberRows.map((m: any) => m.conversation_id);

    const convRes = await request(
      `/tables/conversations/records?order=${encodeURIComponent(
        JSON.stringify([{ column: 'updated_at', direction: 'desc' }])
      )}&limit=100`
    );
    const allConvs = convRes.data || [];
    return allConvs.filter((c: any) => convIds.includes(c.id));
  },

  createConversation: async (
    type: 'private' | 'group',
    name: string | null,
    memberUserIds: string[],
    avatar?: string
  ) => {
    const convId = `conv-${Date.now()}-${Math.random().toString(36).substring(7)}`;

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
      )}&order=${encodeURIComponent(JSON.stringify([{ column: 'created_at', direction: 'asc' }]))}&limit=300`
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

  uploadMedia: async (file: File) => {
    const baseUrl = getBaseUrl();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'chat_media');
    formData.append('folder', 'attachments');

    const res = await fetch(`${baseUrl}/api/v1/storage/upload`, {
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
      absoluteUrl: `${baseUrl}${data.data.publicUrl}`,
    };
  },
};
