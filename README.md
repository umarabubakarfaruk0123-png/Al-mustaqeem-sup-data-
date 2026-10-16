# Al-mustaqeem-sup-data-

Al Mustaqeem Sup Data - Minimal full-stack prototype for mobile data, airtime and bill payments (Nigeria).

This repository now contains a small Node.js + Express backend and a Vite + React frontend configured to use Paystack sandbox (mocked by default) and a mocked VTU provider.

Quick start (development)

1. Clone the repo and install dependencies:

   - Backend
     ```bash
     cd backend
     npm install
     ```

   - Frontend
     ```bash
     cd frontend
     npm install
     ```

2. Create environment file for backend. From the `backend` folder copy `.env.example` to `.env` and adjust values if needed. Do NOT put real production keys here.

3. Run backend and frontend in separate terminals:

   - Backend (API)
     ```bash
     cd backend
     npm run dev
     ```

   - Frontend (UI)
     ```bash
     cd frontend
     npm run dev
     ```

4. Open the frontend in your browser (default Vite URL: http://localhost:5173). Use the UI to create orders, simulate payments, and see mocked topup responses.

Notes

- The app uses a mocked payment and VTU flow by default. If you want to integrate Paystack sandbox later, add PAYSTACK_SECRET and PAYSTACK_PUBLIC in `backend/.env` and follow Paystack docs; the README will be updated to include integration steps.
- Database: a local SQLite file is used for quick development. The DB file is ignored by Git.

Next steps (suggested):
- Hook real Paystack sandbox keys and test webhooks with ngrok.
- Replace mocked VTU with a real provider (Africa's Talking, Termii, or your preferred VTU API).
- Add authentication, rate limiting, and production-grade DB (Postgres).
