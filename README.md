# PostUp ✍️

**PostUp** is an AI-powered LinkedIn post writer that transforms raw notes about your daily work and learnings into polished, highly engaging LinkedIn posts.

## 🚀 Tech Stack

### Backend
- **Java 21**
- **Spring Boot 3.5.3** (REST API, JPA/Hibernate)
- **MySQL 8.0** (Database)
- **Maven** (Build Tool)
- **Google Gemini AI API** (Content Generation)

### Frontend
- **React 18**
- **Vite** (Build Tool)
- **Tailwind CSS v4** (Styling)
- **React Router** (Navigation)

## 🛠️ Setup & Installation

### Prerequisites
- JDK 21+
- MySQL 8.0+
- Node.js 18+
- A Google Gemini API Key (Get one free at [Google AI Studio](https://aistudio.google.com/))

### 1. Database Setup
Create a MySQL database named `postup_db`. The application will automatically create the tables on startup.
```sql
CREATE DATABASE postup_db;
```

### 2. Backend Setup
Navigate to the `backend` directory and configure your properties:
1. Update `backend/src/main/resources/application.properties` with your MySQL credentials and Gemini API Key.
2. Run the application:
```bash
cd backend
./mvnw spring-boot:run
```
The API will start at `http://localhost:8080/api`.

### 3. Frontend Setup
Navigate to the `frontend` directory, install dependencies, and start the development server:
```bash
cd frontend
npm install
npm run dev
```
The app will be available at `http://localhost:5173`.

## 📂 Project Structure

- `backend/` - Spring Boot REST API
  - `src/main/java/com/postup`
    - `controller/` - REST Endpoints
    - `service/` - Business Logic & Gemini AI Integration
    - `repository/` - Database Access (JPA)
    - `entity/` - Database Models
    - `dto/` - Data Transfer Objects
- `frontend/` - React SPA
  - `src/`
    - `api/` - API Client connecting to Spring Boot
    - `components/` - Reusable UI Components
    - `pages/` - Application Views
    - `index.css` - Tailwind CSS Configuration

## 🌟 Features
- **Project Tracking**: Group your learnings by specific projects or goals.
- **Daily Logs**: Write raw, unformatted notes about what you accomplished each day.
- **AI Post Generation**: Select a tone (Professional, Casual, Storytelling, Motivational) and let Gemini AI craft the perfect LinkedIn post.
- **Project Overview**: Generate a comprehensive LinkedIn post summarizing an entire project's journey.
- **Iterative Refinement**: Provide feedback to the AI to tweak and adjust the generated post until it's perfect.

---
*Built with focus on creating authentic, engaging professional content.*
