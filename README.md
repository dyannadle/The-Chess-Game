# ♟️ GrandMaster Chess 2.0

![Chess Banner](https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&q=80&w=1200)

**GrandMaster 2.0** is a professional-grade, full-stack multiplayer chess platform. Built with a focus on real-time competition, secure user progression, and an integrated AI engine, it transforms a classic game into a modern, high-performance experience.

---

## 🚀 Key Features

*   **🏆 Global Multiplayer**: Real-time room-based matchmaking using WebSockets.
*   **🤖 Integrated AI Engine**: Challenge the computer with **Easy, Medium, and Hard** difficulty levels.
*   **🔒 Secure Accounts**: Full authentication system with **BCrypt** password hashing and **PostgreSQL** persistence.
*   **📜 Complete Match History**: Every move from every game is recorded and stored chronologically.
*   **🎨 Elite Visuals**: A stunning **Glassmorphism UI** with interactive move-possibility indicators (Dots).
*   **📱 Mobile Responsive**: Play on desktop or mobile with a seamless, adaptive layout.

---

## 🛠️ Tech Stack

### **Backend**
*   **Java 17 / Spring Boot**: Core game logic and API layer.
*   **Spring Security**: Robust user authentication and CORS management.
*   **PostgreSQL**: High-reliability permanent data storage.
*   **WebSockets (STOMP)**: Real-time bi-directional move synchronization.

### **Frontend**
*   **React / Vite**: Ultra-fast component-based UI.
*   **chess.js**: Advanced chess engine validation.
*   **react-chessboard**: Premium interactive board rendering.
*   **Lucide React**: Modern, consistent iconography.
*   **Vanilla CSS**: High-performance, tailored glassmorphic styling.

---

## 💻 Local Setup

### **Prerequisites**
*   Java 17 JDK
*   Node.js (v18+)
*   Maven

### **1. Backend Setup**
```bash
cd backend
# Optional: Set environment variables for PostgreSQL
# Default uses local H2 if DB_URL is not provided
mvn clean compile
mvn spring-boot:run
```

### **2. Frontend Setup**
```bash
cd frontend
npm install
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** to start playing!

---

## 🌐 Deployment

### **Backend (Render)**
1.  Connect your repo to **Render**.
2.  Set `DB_URL`, `DB_USER`, and `DB_PASSWORD` in Environment Variables.
3.  Deploy using the provided `pom.xml`.

### **Frontend (Vercel)**
1.  Connect your repo to **Vercel**.
2.  Set `VITE_BACKEND_URL` to your Render backend URL.
3.  Deploy automatically with every push!

---

## 📈 Future Roadmap
- [ ] **ELO Rating System**: Compete for your place on the global leaderboard.
- [ ] **Instant Replay**: Rewatch your greatest games move-by-move.
- [ ] **Daily Puzzles**: Sharpen your tactics with curated chess challenges.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for more information.

---

**Crafted with ❤️ by [Deepak Yannadle](https://github.com/dyannadle)**
