# Project1
# 🎙️ Secure Full-Stack Speech to Text Application

A robust web application that allows users to securely authenticate, record vocal notes or upload existing audio file streams, and convert them to text using AI-driven transcription infrastructure.

## 🚀 Core Architectural Features
* **Secure User Sessions:** Built-in email/password registration infrastructure managed by Supabase.
* **Granular Route Protection:** Automatic context wrapper intercepting unauthenticated attempts.
* **AI Transcription Engine:** Powered by Groq's low-latency `whisper-large-v3` infrastructure.
* **Cloud Storage Sync:** Direct data-table pipelines saving text assets atomically per unique user ID.
* **Resilient Validation Framework:** Interactive client-side simulations testing device and API exceptions.

## 🛠️ Technological Framework
* **Frontend:** React, Tailwind CSS v4, Axios
* **Backend:** Node.js, Express, Multer, Groq Cloud SDK
* **Database & Security:** Supabase Auth, PostgreSQL (with Row-Level Security)

## 📦 Local Installation Guide

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org) installed.

### 2. Backend Environment Setup
Navigate to the `backend` folder, install dependencies, create a `.env` file, and append your credentials:
```bash
cd backend
npm install
```
Add to your `.env` configuration file:
```env
PORT=5000
GROQ_API_KEY=your_groq_api_key_here
```
Launch the server:
```bash
node index.js
```

### 3. Frontend Environment Setup
Navigate to the root/frontend folder, install packages, and initialize your client server:
```bash
npm install
npm run dev
```

## 🔒 Security Specifications (Row Level Security)
Database protection rules are locked tightly so users can exclusively read and write their own data entries:
```sql
alter table transcriptions enable row level security;
create policy "Users can handle their own data" on transcriptions 
  using (auth.uid() = user_id);
```
