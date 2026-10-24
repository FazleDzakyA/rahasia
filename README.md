# 💬 fazaaChat — Apple iOS 16 Realtime Messages

**fazaaChat** adalah aplikasi web chat realtime modern bergaya **Apple iOS 16 Liquid Gray Glass** (terinspirasi dari iMessage, WhatsApp, dan Telegram).

Aplikasi ini dibangun menggunakan **Next.js 15 App Router**, **TypeScript**, **TailwindCSS**, dan **Framer Motion**, dengan backend penuh dari **fazaaDB Cloud** (Personal Backend-as-a-Service).

![Apple Glassmorphism UI](public/icon.svg)

---

## 🌟 Fitur Utama

- **Apple iOS 16 Liquid Gray Glass Design**: Background `#111111`, frosted glass `rgba(255, 255, 255, 0.08)`, sudut melengkung 24px, speech bubble iMessage khas Apple, dan transisi mulus.
- **100% Realtime via fazaaDB WebSocket**: Pesan masuk, pengiriman media, dan penghapusan pesan tersinkronisasi live seketika ke seluruh perangkat tanpa reload/refresh.
- **Private & Group Chat**: Buat percakapan 1-on-1 atau grup obrolan tim dengan banyak anggota.
- **Multi-Device Test Simulator**: Switcher instan di header sidebar untuk menguji obrolan antara **Device A (Faza)** dan **Device B (Sarah)** dalam hitungan detik.
- **Media & File Storage**: Kirim foto, video, dan dokumen melalui storage engine fazaaDB dengan instant preview.
- **Pesan Balasan (Reply Quote) & Hapus Pesan**: Kutip pesan yang dibalas dan hapus pesan secara realtime.
- **Read Receipts & Delivery**: Indikator status pesan terkirim (`✓`), terkirim ke server (`✓✓`), dan dibaca (`✓✓` biru).
- **Online Presence & Typing Indicator**: Indikator user sedang online dan deteksi *"sedang mengetik..."*.
- **Progressive Web App (PWA)**: Dapat diinstal langsung ke layar utama smartphone (*Add to Home Screen*) dengan icon native.

---

## 🚀 Cara Menjalankan Lokal

### 1. Prasyarat
Pastikan **fazaaDB Cloud Server** sudah berjalan di `http://localhost:4000`.

### 2. Jalankan Aplikasi
```bash
# Clone repository
git clone https://github.com/USERNAME/fazaaChat.git
cd fazaaChat

# Install dependencies
npm install

# Jalankan server development
npm run dev
```

Buka browser di **`http://localhost:3001`**.

---

## 🌐 Deploy ke Vercel

1. Push repository ini ke akun GitHub Anda.
2. Buka dashboard [Vercel](https://vercel.com/) dan import repository `fazaaChat`.
3. Tambahkan Environment Variable di Vercel:
   ```env
   NEXT_PUBLIC_FAZAA_URL=https://your-fazaadb-server-domain.com
   NEXT_PUBLIC_FAZAA_KEY=fza_srv_xxxxxxxxxxxxxx
   ```
4. Klik **Deploy**. Selesai!

---

## 📄 Lisensi
MIT License © 2026 fazaaChat Team.
