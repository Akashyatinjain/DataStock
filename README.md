# 📦 DataStock

> A modern cloud storage platform inspired by Google Drive where users can securely upload, organize, manage, preview, and share files.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-blue?logo=postgresql)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Live Demo

🌐 Frontend: https://data-stock.vercel.app

🔗 Backend API: https://datastock-skpb.onrender.com

---

# ✨ Features

### 🔐 Authentication

- Email & Password Login
- Google OAuth Login
- OTP Authentication
- JWT Authentication
- Secure Cookies

### 📁 File Management

- Upload Files
- Download Files
- Delete Files
- Rename Files
- Move Files into Folders
- Preview Images & PDFs
- Star Important Files
- Trash Files

### 📂 Folder Management

- Create Folder
- Rename Folder
- Delete Folder
- Nested Folder Support

### 👤 User Profile

- Profile Picture Upload
- Update Profile
- Storage Statistics

### 📊 Dashboard

- Storage Usage
- Recent Files
- Quick Access
- Recent Activity

### ☁ Cloud Storage

- Cloudinary Integration
- PostgreSQL Database
- Secure File Metadata Storage

### 📱 Responsive UI

- Desktop
- Tablet
- Mobile Friendly

---

# 🛠 Tech Stack

## Frontend

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- React Icons

## Backend

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT
- Passport.js
- Multer
- Cloudinary

## Database

- PostgreSQL (Neon)

## Deployment

- Vercel
- Render

---

# 📂 Project Structure

```
DataStock
│
├── client
│   ├── src
│   ├── components
│   ├── pages
│   ├── context
│   ├── hooks
│   ├── api
│   └── assets
│
├── server
│   ├── prisma
│   ├── controllers
│   ├── middleware
│   ├── routes
│   ├── services
│   ├── utils
│   └── uploads
│
└── README.md
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/Akashyatinjain/DataStock.git
```

```bash
cd DataStock
```

---

## Install Client

```bash
cd client
npm install
```

---

## Install Server

```bash
cd ../server
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside the **server** directory.

```env
DATABASE_URL=

JWT_SECRET=

SESSION_SECRET=

GOOGLE_CLIENT_ID=

GOOGLE_CLIENT_SECRET=

CLOUDINARY_CLOUD_NAME=

CLOUDINARY_API_KEY=

CLOUDINARY_API_SECRET=

EMAIL_USER=

EMAIL_PASS=

FRONTEND_URL=

PORT=5000
```

For the client:

```env
VITE_BASE_URL=http://localhost:5000
```

---

# 🗄 Database

Generate Prisma Client

```bash
npx prisma generate
```

Run Migrations

```bash
npx prisma migrate dev
```

Open Prisma Studio

```bash
npx prisma studio
```

---

# ▶ Run Project

Backend

```bash
npm run dev
```

Frontend

```bash
npm run dev
```

---

# 📸 Screenshots

> Add screenshots here.

- Login Page
- Dashboard
- File Upload
- Folder View
- Profile Page
- Storage Statistics

---

# 🔒 Security

- JWT Authentication
- Password Hashing
- Protected Routes
- CORS Protection
- Cookie-based Authentication
- Input Validation

---

# 📈 Future Improvements

- File Sharing
- Public Links
- Real-time Notifications
- Activity Timeline
- Version History
- Payment Integration
- Team Workspaces
- Drag & Drop Upload
- Search & Filters
- Dark Mode
- WebSocket Support

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature-name
```

3. Commit your changes

```bash
git commit -m "Added new feature"
```

4. Push

```bash
git push origin feature-name
```

5. Open a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Akash Jain**

GitHub:
https://github.com/Akashyatinjain

---

## ⭐ Support

If you like this project,

⭐ Star the repository

🍴 Fork it

🐛 Report issues

💡 Suggest new features

---

## 💙 Built with

- React
- Express
- Prisma
- PostgreSQL
- Cloudinary
- Tailwind CSS
- Node.js
