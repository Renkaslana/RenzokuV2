# 🎬 Renzoku - Website Streaming Anime

<div align="center">

![Renzoku Logo](https://via.placeholder.com/150?text=Renzoku)

**Website streaming anime modern dengan fitur lengkap**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

[Demo](#) • [Fitur](#-fitur) • [Instalasi](#-instalasi) • [Dokumentasi](#-dokumentasi-api)

</div>

---

## 📖 Deskripsi

**Renzoku** adalah website streaming anime yang dibangun dengan vanilla HTML, CSS, dan JavaScript. Website ini menggunakan REST API dari [Sanka Vollerei](https://www.sankavollerei.com) untuk menampilkan berbagai anime ongoing, completed, serta fitur pencarian dan jadwal rilis.

### ✨ Highlight
- 🎯 **Pure Vanilla JavaScript** - Tidak menggunakan framework, ringan dan cepat
- 🎨 **Dark Theme Modern** - Desain elegan dengan tema gelap
- 📱 **Fully Responsive** - Optimal di semua perangkat
- ⚡ **Quality Selector** - Pilih kualitas streaming (360p - 1080p)
- 🔍 **Smart Search** - Pencarian anime dengan auto-suggestions
- 📅 **Schedule Tracker** - Jadwal rilis anime per hari
- ⌨️ **Keyboard Shortcuts** - Navigasi cepat dengan keyboard

---

## 🎯 Fitur

### 🏠 Halaman Utama
- ✅ Daftar anime **ongoing** (sedang tayang)
- ✅ Daftar anime **completed** (sudah selesai)
- ✅ Grid layout responsif dengan hover effects
- ✅ Hero section dengan banner selamat datang
- ✅ Loading state dan error handling
- ✅ Lazy loading untuk gambar

### 🔍 Pencarian Anime
- ✅ **Global search** dari semua halaman
- ✅ **Auto-suggestions** saat mengetik
- ✅ Hasil pencarian dengan grid layout
- ✅ Filter dan sorting hasil pencarian
- ✅ **Smart search** dengan debouncing

### 📅 Jadwal Rilis
- ✅ Jadwal anime per hari (Senin - Minggu)
- ✅ Informasi waktu rilis
- ✅ Tab navigation per hari
- ✅ Quick access ke detail anime

### 📄 Detail Anime
- ✅ Informasi lengkap (rating, studio, genre, status)
- ✅ Hero backdrop dengan blur effect
- ✅ Synopsis lengkap
- ✅ Daftar episode dalam grid layout
- ✅ **Batch download** (jika tersedia)
- ✅ **Rekomendasi anime** serupa

### 🎬 Episode Streaming
- ✅ **Video player responsif** (16:9 ratio)
- ✅ **Quality selector** (360p, 480p, 720p, 1080p)
- ✅ **Default quality 480p** untuk streaming optimal
- ✅ **Download episode** dengan berbagai resolusi
- ✅ Multiple download providers (ODFiles, Mega, GoFile)
- ✅ Support format **MP4** dan **MKV**
- ✅ **Navigasi episode** (previous/next)
- ✅ **Keyboard shortcuts** (Arrow keys)
- ✅ Active quality indicator
- ✅ Episode information dan metadata

### 🎨 User Interface
- ✅ **Modern dark theme** dengan gradient accents
- ✅ **Smooth animations** dan transitions
- ✅ **Loading spinners** untuk feedback visual
- ✅ **Error messages** yang informatif
- ✅ **Responsive navigation** dengan mobile menu
- ✅ **Card-based design** untuk konten
- ✅ **Badge indicators** untuk status dan kualitas

---

## 🚀 Instalasi

### 📋 Prasyarat

Pastikan Anda memiliki salah satu dari berikut terinstall:
- **Python 3.6+** (untuk HTTP server) - [Download Python](https://www.python.org/downloads/)
- **Node.js 14+** (opsional, untuk npm scripts) - [Download Node.js](https://nodejs.org/)
- **Web Browser** modern (Chrome, Firefox, Edge, Safari)

### 📥 Clone Repository

```bash
# Clone repository
git clone https://github.com/your-username/renzoku.git

# Masuk ke direktori project
cd renzoku

# (Opsional) Install dependencies jika menggunakan Node.js
npm install
```

### 🎯 Cara Menjalankan - Pilih Metode Favorit Anda!

#### **Metode 1: Double Click Launcher (Tercepat!)** ⚡

<details>
<summary><b>🪟 Windows - Batch File</b></summary>

1. **Double-click** file `launchers/start-renzoku.bat`
2. Server akan otomatis berjalan di `http://localhost:8000`
3. Browser akan terbuka secara otomatis
4. ✅ Selesai! Website siap digunakan

**Atau jalankan via Command Prompt:**
```cmd
launchers\start-renzoku.bat
```

</details>

<details>
<summary><b>🪟 Windows - PowerShell</b></summary>

1. **Right-click** file `launchers/start-renzoku.ps1`
2. Pilih **"Run with PowerShell"**
3. Server akan otomatis berjalan dan browser terbuka
4. ✅ Selesai!

**Atau jalankan via PowerShell:**
```powershell
.\launchers\start-renzoku.ps1
```

**Note:** Jika ada error execution policy, jalankan:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

</details>

<details>
<summary><b>🐧 Linux / 🍎 Mac - Shell Script</b></summary>

**Pertama kali, beri permission execute:**
```bash
chmod +x launchers/start-renzoku.sh
```

**Kemudian double-click atau jalankan:**
```bash
./launchers/start-renzoku.sh
```

Server akan berjalan dan browser terbuka otomatis!

</details>

---

#### **Metode 2: NPM Scripts** 📦

Jika Anda sudah install Node.js:

```bash
# Jalankan development server
npm start
# atau
npm run dev

# Jalankan server + buka browser
npm run run

# Testing
npm test
```

Server akan berjalan di: `http://localhost:8000`

---

#### **Metode 3: Python HTTP Server (Manual)** 🐍

```bash
# Python 3
python -m http.server 8000

# Atau Python 2 (jika masih menggunakan)
python -m SimpleHTTPServer 8000
```

Kemudian buka browser dan akses: `http://localhost:8000`

---

#### **Metode 4: Live Server (VS Code Extension)** 💻

1. Install extension [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) di VS Code
2. Buka project folder di VS Code
3. **Right-click** pada `index.html`
4. Pilih **"Open with Live Server"**
5. ✅ Website otomatis terbuka dengan live reload!

---

## 📖 Cara Menggunakan

### 1️⃣ **Menjelajahi Anime**
   - Buka halaman utama untuk melihat anime ongoing dan completed
   - Klik pada card anime untuk melihat detail lengkap
   - Scroll untuk melihat lebih banyak anime

### 2️⃣ **Mencari Anime**
   - Klik icon search (🔍) di navigation bar
   - Ketik judul anime yang ingin dicari
   - Auto-suggestions akan muncul saat mengetik
   - Klik pada hasil pencarian untuk melihat detail

### 3️⃣ **Cek Jadwal Rilis**
   - Klik menu "Schedule" di navigation
   - Pilih hari untuk melihat anime yang tayang
   - Klik pada anime untuk melihat detail

### 4️⃣ **Streaming Anime**
   - Dari halaman detail, klik pada episode yang ingin ditonton
   - Video player akan otomatis loading dengan kualitas default (480p)
   - Pilih kualitas streaming yang diinginkan:
     - **360p** - Hemat bandwidth, untuk koneksi lambat
     - **480p** - Balance kualitas dan kecepatan (Recommended)
     - **720p** - HD quality
     - **1080p** - Full HD quality
   - Gunakan tombol navigasi atau keyboard shortcuts:
     - **← (Arrow Left)** - Episode sebelumnya
     - **→ (Arrow Right)** - Episode selanjutnya

### 5️⃣ **Download Anime**
   - Di halaman episode, scroll ke bagian download
   - Pilih format (MP4 atau MKV)
   - Pilih resolusi yang diinginkan
   - Pilih provider download (ODFiles, Mega, GoFile, dll)
   - Klik link download untuk mulai mengunduh

### 6️⃣ **Batch Download**
   - Di halaman detail anime, cari section "Batch Download"
   - Klik pada link batch untuk download semua episode sekaligus
   - Pilih provider dan format yang diinginkan

---

## 📁 Struktur Project

```
Renzoku/
├── 📄 index.html                    # Redirect ke pages/index.html
├── 📦 package.json                  # NPM scripts dan project info
├── 📚 README.md                     # Dokumentasi (file ini)
├── 📚 DIRECTORY_STRUCTURE_FINAL.md  # Dokumentasi struktur lengkap
│
├── 📁 pages/                        # 🌐 HTML Pages
│   ├── index.html                   # Homepage - Anime ongoing & completed
│   ├── detail.html                  # Detail anime & episode list
│   ├── episode.html                 # Episode player & download
│   ├── search.html                  # Hasil pencarian anime
│   └── schedule.html                # Jadwal rilis per hari
│
├── 📁 styles/                       # 🎨 CSS Stylesheets
│   ├── style.css                    # Main global styles
│   ├── hero-section.css             # Hero section styles
│   ├── detail.css                   # Detail page styles
│   ├── episode.css                  # Episode page styles
│   ├── episode-improved.css         # Episode improvements
│   ├── search.css                   # Search page styles
│   └── schedule.css                 # Schedule page styles
│
├── 📁 scripts/                      # ⚡ JavaScript Files
│   ├── script.js                    # Main script (homepage)
│   ├── detail.js                    # Detail page logic
│   ├── episode.js                   # Episode page logic
│   ├── episode-optimized.js         # Optimized episode script
│   ├── episode-debug.js             # Debug version episode
│   ├── search.js                    # Search page logic
│   ├── schedule.js                  # Schedule page logic
│   ├── safe-search.js               # Full search dengan suggestions
│   └── light-search.js              # Light search tanpa suggestions
│
├── 📁 launchers/                    # 🚀 Launcher Scripts
│   ├── start-renzoku.bat            # Windows batch launcher
│   ├── start-renzoku.ps1            # PowerShell launcher
│   └── start-renzoku.sh             # Linux/Mac bash launcher
│
├── 🔧 safe-search.js                # Backward compatibility
├── 🔧 search.js                     # Backward compatibility
├── 🔧 sw-episode.js                 # Service Worker (experimental)
└── 🦇 start-renzoku.bat             # Root launcher (backward compat)
```

### 📊 Project Statistics
- **Total Files**: ~25 files
- **HTML Pages**: 5 halaman
- **CSS Files**: 7 stylesheets
- **JavaScript Files**: 10+ scripts
- **Launchers**: 3 platform scripts
- **Lines of Code**: ~5000+ LOC

---

## 🔧 Teknologi yang Digunakan

### Frontend
- ![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white) **HTML5** - Struktur dan semantic markup
- ![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white) **CSS3** - Styling dengan Flexbox, Grid, dan Animations
- ![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) **Vanilla JavaScript (ES6+)** - Logic dan DOM manipulation

### API & Data
- 🔗 **Sanka Vollerei REST API** - Sumber data anime
- 🌐 **Fetch API** - HTTP requests
- 📊 **JSON** - Data format

### Tools & Development
- 🐍 **Python HTTP Server** - Development server
- 📦 **NPM Scripts** - Task automation
- 🔄 **Git** - Version control
- 🚀 **Bash/PowerShell Scripts** - Easy launchers

### Design Principles
- 📱 **Mobile-First Design** - Responsive untuk semua device
- 🎨 **CSS Grid & Flexbox** - Modern layout
- ⚡ **Lazy Loading** - Optimasi performa gambar
- 🎭 **Progressive Enhancement** - Berfungsi di semua browser
- ♿ **Accessibility** - Semantic HTML dan ARIA labels

---

## 📖 Dokumentasi API

Website ini menggunakan REST API dari **Sanka Vollerei**. Berikut adalah endpoint yang digunakan:

### 🏠 **Home - Daftar Anime**
```
GET https://www.sankavollerei.com/anime/home
```

**Response:**
```json
{
  "status": "success",
  "creator": "Sanka Vollerei",
  "data": {
    "ongoing_anime": [
      {
        "title": "Nama Anime",
        "slug": "nama-anime",
        "poster": "https://...",
        "current_episode": "Episode 12",
        "release_day": "Sabtu",
        "newest_release_date": "2024-01-20"
      }
    ],
    "complete_anime": [...]
  }
}
```

---

### 🔍 **Search - Pencarian Anime**
```
GET https://www.sankavollerei.com/anime/search?keyword={query}
```

**Parameter:**
- `keyword` (string) - Kata kunci pencarian

**Response:**
```json
{
  "status": "success",
  "creator": "Sanka Vollerei",
  "data": [
    {
      "title": "Nama Anime",
      "slug": "nama-anime",
      "poster": "https://...",
      "status": "Ongoing",
      "rating": "8.5"
    }
  ]
}
```

---

### 📅 **Schedule - Jadwal Rilis**
```
GET https://www.sankavollerei.com/anime/schedule?filter={day}
```

**Parameter:**
- `filter` (string) - Hari (senin, selasa, rabu, kamis, jumat, sabtu, minggu)

**Response:**
```json
{
  "status": "success",
  "creator": "Sanka Vollerei",
  "data": [
    {
      "title": "Nama Anime",
      "slug": "nama-anime",
      "poster": "https://...",
      "newest_release_date": "2024-01-20",
      "release_time": "22:00"
    }
  ]
}
```

---

### 📄 **Detail Anime**
```
GET https://www.sankavollerei.com/anime/anime/{slug}
```

**Response:**
```json
{
  "status": "success",
  "creator": "Sanka Vollerei",
  "data": {
    "title": "Nama Anime",
    "poster": "https://...",
    "rating": "8.5",
    "status": "Ongoing",
    "total_episode": "24",
    "duration": "24 min",
    "release_date": "2024",
    "studio": "Studio Name",
    "genres": ["Action", "Adventure"],
    "synopsis": "...",
    "episode_lists": [
      {
        "episode": "Episode 1",
        "slug": "nama-anime-episode-1"
      }
    ],
    "batch_link": "https://...",
    "recommendations": [...]
  }
}
```

---

### 🎬 **Episode Detail**
```
GET https://www.sankavollerei.com/anime/episode/{episode-slug}
```

**Response:**
```json
{
  "status": "success",
  "creator": "Sanka Vollerei",
  "data": {
    "episode": "Episode 1",
    "anime_id": "nama-anime",
    "stream_url": "https://...",
    "server_code": "desustream-xxxxx",
    "has_next_episode": true,
    "next_episode": {
      "episode": "Episode 2",
      "slug": "nama-anime-episode-2"
    },
    "has_previous_episode": false,
    "previous_episode": null,
    "download_urls": {
      "mp4": [
        {
          "resolution": "360p",
          "provider": "ODFiles",
          "url": "https://..."
        }
      ],
      "mkv": [...]
    }
  }
}
```

---

### ⚙️ **Server Quality Options**
```
GET https://www.sankavollerei.com/anime/server/{server-code}
```

**Response:**
```json
{
  "status": "success",
  "creator": "Sanka Vollerei",
  "data": {
    "server_name": "Desustream",
    "quality_options": [
      {
        "resolution": "360p",
        "stream_url": "https://..."
      },
      {
        "resolution": "480p",
        "stream_url": "https://..."
      },
      {
        "resolution": "720p",
        "stream_url": "https://..."
      },
      {
        "resolution": "1080p",
        "stream_url": "https://..."
      }
    ]
  }
}
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Halaman |
|----------|--------|---------|
| `←` (Arrow Left) | Episode sebelumnya | Episode |
| `→` (Arrow Right) | Episode selanjutnya | Episode |
| `Ctrl + K` atau `/` | Fokus ke search bar | Semua halaman |
| `Esc` | Tutup search suggestions | Semua halaman |

---

## 🎨 Theme & Customization

### Color Palette
```css
/* Primary Colors */
--primary-bg: #0f0f1e;        /* Background utama */
--secondary-bg: #1a1a2e;      /* Background card */
--accent-color: #6c5ce7;      /* Accent purple */
--hover-color: #a29bfe;       /* Hover state */

/* Text Colors */
--text-primary: #ffffff;      /* Text utama */
--text-secondary: #a0a0a0;    /* Text secondary */

/* Gradient */
--gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--gradient-hover: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
```

### Customizing Styles
Semua style bisa di-customize di folder `styles/`. Edit file yang sesuai:
- `style.css` - Global styles
- `detail.css` - Detail page
- `episode.css` - Episode page
- dll.

---

## 🐛 Troubleshooting

### ❌ **Server tidak berjalan**
**Solusi:**
1. Pastikan Python atau Node.js terinstall
2. Cek port 8000 tidak digunakan aplikasi lain
3. Coba ganti port: `python -m http.server 3000`

### ❌ **Gambar tidak muncul**
**Solusi:**
1. Cek koneksi internet
2. API Sanka Vollerei mungkin sedang down
3. Buka Developer Console (F12) untuk cek error

### ❌ **Video tidak bisa diputar**
**Solusi:**
1. Coba ganti kualitas streaming
2. Refresh halaman
3. Cek apakah browser support iframe embedding
4. Disable ad blocker atau browser extension yang memblokir video

### ❌ **CORS Error**
**Solusi:**
1. Jalankan dengan HTTP server (jangan buka file HTML langsung)
2. Install browser extension untuk bypass CORS (development only)
3. Atau gunakan proxy server

### ❌ **Launcher tidak berfungsi di Windows**
**Solusi PowerShell:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### ❌ **Launcher tidak berfungsi di Linux/Mac**
**Solusi:**
```bash
chmod +x launchers/start-renzoku.sh
```

---

## 📱 Responsive Breakpoints

Website ini dioptimalkan untuk berbagai ukuran layar:

| Device | Width | Layout |
|--------|-------|--------|
| 📱 **Mobile Small** | < 480px | 1 kolom |
| 📱 **Mobile** | 480px - 767px | 1-2 kolom |
| 📱 **Tablet** | 768px - 1023px | 2-3 kolom |
| 💻 **Desktop** | 1024px - 1399px | 3-4 kolom |
| 🖥️ **Desktop Large** | ≥ 1400px | 4-5 kolom |

---

## 🚧 Roadmap & Future Features

### 🔮 Planned Features
- [ ] **User Authentication** - Login dan watchlist pribadi
- [ ] **Comment System** - Diskusi per episode
- [ ] **Rating System** - User dapat rate anime
- [ ] **Watch History** - Track anime yang sudah ditonton
- [ ] **Notification** - Alert untuk episode baru
- [ ] **Dark/Light Theme Toggle** - Switch theme
- [ ] **Multiple Language** - Support bahasa lain
- [ ] **Offline Mode** - Service Worker untuk offline access
- [ ] **PWA** - Install sebagai Progressive Web App
- [ ] **Share Feature** - Share anime ke social media

### 🎯 Improvements
- [ ] Optimize image loading dengan WebP
- [ ] Implement infinite scroll
- [ ] Add skeleton loading screens
- [ ] Improve SEO dan meta tags
- [ ] Add analytics tracking
- [ ] Better error handling
- [ ] Cache API responses

---

## 🤝 Kontribusi

Kontribusi sangat diterima! Ikuti langkah berikut:

### 1️⃣ Fork Repository
```bash
# Klik tombol "Fork" di GitHub
```

### 2️⃣ Clone Fork Anda
```bash
git clone https://github.com/your-username/renzoku.git
cd renzoku
```

### 3️⃣ Buat Branch Baru
```bash
git checkout -b feature/nama-fitur-anda
```

### 4️⃣ Buat Perubahan
```bash
# Edit file yang diperlukan
# Test perubahan Anda
```

### 5️⃣ Commit Perubahan
```bash
git add .
git commit -m "feat: menambahkan fitur xyz"
```

**Commit Message Convention:**
- `feat:` - Fitur baru
- `fix:` - Bug fix
- `docs:` - Dokumentasi
- `style:` - Formatting, styling
- `refactor:` - Refactoring code
- `test:` - Testing
- `chore:` - Maintenance

### 6️⃣ Push ke GitHub
```bash
git push origin feature/nama-fitur-anda
```

### 7️⃣ Buat Pull Request
1. Buka repository Anda di GitHub
2. Klik tombol "Pull Request"
3. Isi deskripsi perubahan Anda
4. Submit PR

---

## 📄 License

Project ini menggunakan **MIT License**.

```
MIT License

Copyright (c) 2024 Renzoku Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👥 Author & Credits

### 👨‍💻 Developer
- **Renzoku Team**
- GitHub: [@your-username](https://github.com/your-username)

### 🙏 Credits
- **API Provider:** [Sanka Vollerei](https://www.sankavollerei.com) - Terima kasih untuk API yang luar biasa!
- **Icons:** Emoji icons dari sistem
- **Fonts:** System fonts untuk performa optimal

---

## 📞 Contact & Support

### 💬 Butuh Bantuan?
- 📧 Email: support@renzoku.com
- 🐛 [Report Bug](https://github.com/your-username/renzoku/issues)
- 💡 [Request Feature](https://github.com/your-username/renzoku/issues)
- 📖 [Documentation](https://github.com/your-username/renzoku/wiki)

### 🌟 Support Project
Jika project ini bermanfaat, berikan ⭐ star di GitHub!

---

## 📊 Statistics

![GitHub stars](https://img.shields.io/github/stars/your-username/renzoku?style=social)
![GitHub forks](https://img.shields.io/github/forks/your-username/renzoku?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/your-username/renzoku?style=social)

![GitHub issues](https://img.shields.io/github/issues/your-username/renzoku)
![GitHub pull requests](https://img.shields.io/github/issues-pr/your-username/renzoku)
![GitHub last commit](https://img.shields.io/github/last-commit/your-username/renzoku)

---

## ⚠️ Disclaimer

Project ini dibuat untuk **tujuan edukasi** dan **testing REST API**. 

- Website ini **TIDAK** menyimpan atau menghost file video anime
- Semua konten (video, gambar, informasi) berasal dari API pihak ketiga
- Developer tidak bertanggung jawab atas konten yang ditampilkan
- Gunakan dengan bijak dan hormati hak cipta

**Disclaimer API:**
> Data anime dan streaming links disediakan oleh [Sanka Vollerei API](https://www.sankavollerei.com). 
> Renzoku hanya bertindak sebagai client interface untuk mengakses API tersebut.

---

## 🎉 Acknowledgments

Terima kasih kepada:
- 🙏 **Sanka Vollerei** - untuk API yang amazing
- 🌟 Semua **contributors** yang membantu project ini
- 💙 **Open source community** untuk inspirasi dan tools
- 🎨 **Design community** untuk inspirasi UI/UX

---

<div align="center">

**Dibuat dengan ❤️ untuk komunitas anime Indonesia**

![Made with Love](https://img.shields.io/badge/Made%20with-%E2%9D%A4%EF%B8%8F-red.svg)
![Indonesia](https://img.shields.io/badge/Made%20in-Indonesia-red)

[⬆ Back to Top](#-renzoku---website-streaming-anime)

</div>

---

**Last Updated:** Oktober 2024  
**Version:** 1.0.0  
**Status:** 🟢 Active Development
