// Cloudflare tunnel URL - active public endpoint for fazaaDB Cloud
const FAZAA_CLOUD_URL = 'https://cooking-arising-trucks-standings.trycloudflare.com';

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // 1. Check URL query param ?server=https://...
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const serverParam = urlParams.get('server');
      if (serverParam && serverParam.startsWith('http')) {
        const clean = serverParam.replace(/\/+$/, '');
        localStorage.setItem('fazaadb_api_url', clean);
        return clean;
      }
    } catch {}

    // 2. Check localStorage custom URL
    try {
      const custom = localStorage.getItem('fazaadb_api_url');
      if (custom && custom.startsWith('http')) {
        return custom.replace(/\/+$/, '');
      }
    } catch {}
  }

  // 3. Environment Variable (ignore old expired trout-antibody tunnel)
  const envUrl = process.env.NEXT_PUBLIC_FAZAA_URL;
  if (envUrl && !envUrl.includes('trout-antibody')) {
    return envUrl.replace(/\/+$/, '');
  }

  // 4. Default active cloud tunnel
  return FAZAA_CLOUD_URL;
};

const getWsUrl = () => {
  if (process.env.NEXT_PUBLIC_FAZAA_WS_URL) {
    return process.env.NEXT_PUBLIC_FAZAA_WS_URL;
  }
  const base = getBaseUrl();
  try {
    const u = new URL(base);
    const wsProtocol = u.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${u.host}/realtime`;
  } catch {}
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
      const errJson = await res.json();
      errorMsg = errJson.error || errJson.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
}

export const fazaaChatApi = {
  getBaseUrl,
  getWsUrl,
  getServerUrl: getBaseUrl,
  setServerUrl: (url: string) => {
    if (typeof window !== 'undefined') {
      if (!url || !url.trim()) {
        localStorage.removeItem('fazaadb_api_url');
      } else {
        localStorage.setItem('fazaadb_api_url', url.trim().replace(/\/+$/, ''));
      }
      window.location.reload();
    }
  },

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
        avatar: params.avatar || defaultAvatar,
        status: params.status || 'Active on fazaaChat',
        is_online: 1,
        last_seen: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }),
    });

    return newUser.data;
  },

  getUsers: async () => {
    try {
      const res = await request('/tables/chat_users/records?limit=100');
      return Array.isArray(res?.data) ? res.data : [];
    } catch (err) {
      console.warn('Failed to get users:', err);
      return [];
    }
  },

  getUserById: async (id: string) => {
    try {
      const res = await request(`/tables/chat_users/records/${id}`);
      return res?.data || null;
    } catch {
      return null;
    }
  },

  updateUser: async (
    id: string,
    data: { is_online?: number | boolean; last_seen?: string; status?: string }
  ) => {
    try {
      const payload: Record<string, any> = { ...data };
      if (typeof payload.is_online === 'boolean') {
        payload.is_online = payload.is_online ? 1 : 0;
      }
      return await request(`/tables/chat_users/records/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.warn('Failed to update user status:', err);
    }
  },

  // Conversations
  getConversations: async (userId: string) => {
    try {
      const memberRes = await request(
        `/tables/conversation_members/records?filter=${encodeURIComponent(JSON.stringify({ user_id: userId }))}`
      );
      const memberRows = Array.isArray(memberRes?.data) ? memberRes.data : [];
      if (memberRows.length === 0) return [];

      const convIds = memberRows.map((m: any) => m.conversation_id);

      const convRes = await request(
        `/tables/conversations/records?order=${encodeURIComponent(
          JSON.stringify([{ column: 'updated_at', direction: 'desc' }])
        )}&limit=100`
      );
      const allConvs = Array.isArray(convRes?.data) ? convRes.data : [];
      return allConvs.filter((c: any) => convIds.includes(c.id));
    } catch (err) {
      console.warn('Failed to get conversations:', err);
      return [];
    }
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
    try {
      const res = await request(
        `/tables/messages/records?filter=${encodeURIComponent(
          JSON.stringify({ conversation_id: conversationId })
        )}&order=${encodeURIComponent(
          JSON.stringify([{ column: 'created_at', direction: 'asc' }])
        )}&limit=200`
      );
      return Array.isArray(res?.data) ? res.data : [];
    } catch (err) {
      console.warn('Failed to get messages:', err);
      return [];
    }
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

    const res = await fetch(`${baseUrl}/api/v1/projects/${PROJECT_SLUG}/storage/upload`, {
      method: 'POST',
      headers: {
        'x-fazaadb-key': API_KEY,
      },
      body: formData,
    });

    if (!res.ok) {
      throw new Error(`Upload gagal: status ${res.status}`);
    }

    const data = await res.json();
    return {
      path: data.data.path,
      absoluteUrl: `${baseUrl}${data.data.url}`,
    };
  },
};
