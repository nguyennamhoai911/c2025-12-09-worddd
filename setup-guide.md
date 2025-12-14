

# 📘 Project Documentation: English Vocabulary Learning Ecosystem

Đây là tài liệu hướng dẫn khởi động dự án **Full-stack English Learning App**. Hệ thống bao gồm 3 thành phần chính: **Backend (NestJS)**, **Frontend (Next.js)**, và **Browser Extension**.

## 1\. Tech Stack Overview (Công nghệ sử dụng)

Người mới cần nắm rõ các công nghệ sau để maintain dự án:

### 🛠 Core System

  * [cite_start]**Monorepo Structure:** Dự án chia thành `apps/backend`, `apps/frontend`, `apps/extension`[cite: 1].
  * [cite_start]**Containerization:** **Docker & Docker Compose** dùng để chạy Database (PostgreSQL) và Redis[cite: 23].

### 🔙 Backend (`apps/backend`)

  * [cite_start]**Framework:** **NestJS** (Node.js framework)[cite: 46].
  * **Database:** **PostgreSQL** (chạy qua Docker).
  * [cite_start]**ORM:** **Prisma** để tương tác với Database[cite: 70].
  * [cite_start]**Authentication:** **Passport** (JWT, Google OAuth2, Local Strategy)[cite: 102].
  * [cite_start]**Features:** CSV Import (stream processing), Pronunciation Scoring (lưu array điểm số)[cite: 72, 171].

### 🎨 Frontend (`apps/frontend`)

  * [cite_start]**Framework:** **Next.js 15+** (App Router)[cite: 583].
  * **Language:** TypeScript.
  * [cite_start]**Styling:** **Tailwind CSS**[cite: 597].
  * **Data Fetching:** Axios & Custom Hooks (`useVocabData`, `useVocabModals`).
  * **Deployment:** Config sẵn sàng cho Vercel.

### 🧩 Extension (`apps/extension`)

  * [cite_start]**Manifest V3:** Chuẩn mới nhất của Chrome Extension[cite: 240].
  * [cite_start]**Architecture:** Sử dụng **Iframe Injection** để hiển thị giao diện React của Frontend ngay trên trang web bất kỳ[cite: 555].
  * **External APIs:** Azure Speech Services (Pronunciation), Google Custom Search (Image), Google Translate, Free Dictionary API.

-----

## 2\. Prerequisites (Cài đặt trước khi chạy)

Trước khi start project, hãy đảm bảo máy tính đã install:

1.  **Node.js** (Version 18+ recommended).
2.  **Docker Desktop** (để chạy Database).
3.  **Mkcert** (Công cụ tạo SSL certificate để chạy HTTPS trên localhost - **Bắt buộc** vì Extension yêu cầu HTTPS để dùng Mic/Iframe).

-----

## 3\. Step-by-Step Installation Guide

### Bước 1: Setup Infrastructure (Docker)

[cite_start]File `docker-compose.yml` đã config sẵn PostgreSQL chạy ở port **5433** (để tránh conflict với port 5432 mặc định nếu máy bạn đã có Postgres)[cite: 36].

1.  Mở terminal tại root folder.
2.  Run command:
    ```bash
    docker-compose up -d
    ```
    [cite_start]*Lưu ý:* Database name là `vocab_db`, user `myuser`, pass `mypassword`[cite: 32].

### Bước 2: Setup Certificates (HTTPS)

Vì Extension dùng Iframe và Microphone, browser bắt buộc phải có HTTPS.

1.  Cài đặt `mkcert` trên máy (Google "how to install mkcert").
2.  Run lệnh tạo cert (hoặc dùng file có sẵn trong `apps/frontend/certificates` nếu key còn hạn):
    ```bash
    mkcert -install
    mkcert localhost
    ```
3.  [cite_start]Đảm bảo file `localhost-key.pem` và `localhost.pem` nằm đúng chỗ để Backend và Frontend load được[cite: 19].

### Bước 3: Backend Setup (Port 5001)

[cite_start]Source code backend đang default port 5000 [cite: 94][cite_start], nhưng Frontend gọi API qua `https://localhost:5001`[cite: 426]. Bạn cần config lại port.

1.  Di chuyển vào folder backend:
    ```bash
    cd apps/backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Database Migration:** Đồng bộ schema Prisma vào DB Docker:
    ```bash
    npx prisma generate
    npx prisma migrate dev --name init
    ```
4.  **Environment Variables (.env):** Tạo file `.env` trong `apps/backend` với nội dung tương tự:
    ```env
    DATABASE_URL="postgresql://myuser:mypassword@localhost:5433/vocab_db?schema=public"
    JWT_SECRET="your-secret-key"
    GOOGLE_CLIENT_ID="your-google-id"
    GOOGLE_CLIENT_SECRET="your-google-secret"
    # Port config nếu code hỗ trợ env, hoặc sửa cứng trong main.ts
    PORT=5001
    ```
5.  **Start Server:**
      * Sửa file `src/main.ts`: Đổi `app.listen(5000)` thành `app.listen(5001)` và thêm config HTTPS (đọc file key/cert từ Bước 2) nếu chạy local HTTPS trực tiếp từ Node.
      * Run:
    <!-- end list -->
    ```bash
    npm run start:dev
    ```
    [cite_start]*Check:* Truy cập `https://localhost:5001` (hoặc http nếu chưa setup https ở backend layer, nhưng khuyến khích https để cookie `SameSite=None; Secure` hoạt động [cite: 918]).

### Bước 4: Frontend Setup (Port 3001)

[cite_start]Frontend cần chạy ở port **3001** vì Extension được hardcode để trỏ Iframe vào `https://localhost:3001`[cite: 555].

1.  Mở terminal mới, vào folder frontend:
    ```bash
    cd apps/frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  **Environment Variables:** Tạo `.env.local`:
    ```env
    NEXT_PUBLIC_API_URL=https://localhost:5001
    ```
4.  **Start Server with HTTPS:**
    Để chạy Next.js với HTTPS port 3001, bạn dùng command:
    ```bash
    # Cần cài server https cho local hoặc dùng flag experimental của Next.js
    next dev -p 3001 --experimental-https
    ```
    *(Hoặc sử dụng `local-ssl-proxy` để map port 3001 https sang 3000 http).*

### Bước 5: Load Extension

1.  Mở Chrome, gõ `chrome://extensions`.
2.  Bật **Developer mode** (góc phải trên).
3.  Bấm **Load unpacked**.
4.  Chọn folder `apps/extension`.
5.  **Important:** Vào `Details` của extension, đảm bảo pin nó ra ngoài.

-----

## 4\. How to Use & Verify (Cách kiểm tra chạy ổn)

### 1\. Kiểm tra kết nối Backend - Database

  * [cite_start]Backend log phải hiện: `✅ DB Connected via Prisma`[cite: 233].
  * Backend log chạy ở port 5001: `🚀 Backend running on https://localhost:5001` (sau khi sửa `main.ts`).

### 2\. Kiểm tra Extension Flow

  * Ra một trang web bất kỳ (ví dụ: Medium, CNN).
  * [cite_start]Bôi đen một từ tiếng Anh -\> Nhấn `Shift` -\> **Popup từ vựng** phải hiện ra[cite: 409].
  * [cite_start]Nhấn **Ctrl + Q** (hoặc Double Space tùy config cũ): **Iframe Quick Search** phải trượt ra từ màn hình[cite: 570].
      * *Lưu ý:* Nếu Iframe trắng xóa, kiểm tra Console xem có lỗi `Refused to frame 'https://localhost:3001/'` không. Nếu có, nghĩa là cert HTTPS chưa được trình duyệt tin tưởng. Hãy mở tab `https://localhost:3001` và chọn "Advanced -\> Proceed to localhost (unsafe)" để trust cert.

### 3\. Setup API Keys (Trong Extension Popup)

  * Bấm vào icon Extension trên thanh browser.
  * [cite_start]Nhập **Google API Key** và **Search Engine ID (CX)** để tính năng tìm ảnh hoạt động[cite: 350].
  * [cite_start]Nhập **Azure Speech Key** & **Region** để tính năng chấm điểm phát âm hoạt động[cite: 371].

-----

## 5\. Troubleshooting (Các lỗi thường gặp)

1.  **Lỗi CORS:**

      * Nếu Frontend (3001) không gọi được Backend (5001), kiểm tra file `apps/backend/src/main.ts`.
      * [cite_start]Đảm bảo `app.enableCors` cho phép origin là `https://localhost:3001` và `chrome-extension://<ID-EXTENSION-CUA-BAN>`[cite: 92].

2.  **Lỗi Audio/Microphone trong Iframe:**

      * [cite_start]Iframe cần thuộc tính `allow="microphone; camera"`[cite: 555]. Code hiện tại đã có, nhưng phải chạy trên **HTTPS** mới hoạt động.

3.  **Cookie không lưu được (Lỗi Login):**

      * Do chạy Cross-domain (Extension -\> Backend), Backend phải set cookie với `SameSite=None; Secure`. [cite_start]Code auth đã xử lý việc này[cite: 918], nhưng nó yêu cầu Backend phải serve qua HTTPS.
