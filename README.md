# Samgan EyeCare – Full-Stack Demo (Stage 1)
React + Vite · Node.js + Express · MySQL 8 · JWT · bcrypt. All data is **fictional demo data**.

## What works in Stage 1 (tested)
Login/logout (JWT, bcrypt, backend role checks) · multi-hospital data model with tenant taken from the login (never from the browser) · patient registration with unique UHID and duplicate-mobile warning · search by name/UHID/mobile · appointment booking (separate from check-in) · check-in with per-doctor daily tokens · dashboard from MySQL · audit log · 10 automated API tests (`npm test`) including hospital-isolation tests.

## Not built yet (next stages)
Optometrist panel, doctor panel and digital case paper, prescription, investigations/attachments, billing/payments, follow-ups, print/PDF documents, user management. Until then use the separate browser demo for those screens.

## Windows setup (PowerShell)
Install Node.js LTS and MySQL 8 first.
```powershell
Expand-Archive Samgan_EyeCare_Full_Stack_Demo.zip -DestinationPath C:\Samgan ; cd C:\Samgan\samgan-eyecare
# 1. Create a MySQL user (enter the MySQL root password when asked)
mysql -u root -p -e "CREATE USER IF NOT EXISTS 'samgan'@'localhost' IDENTIFIED BY 'ChooseAStrongPassword'; GRANT ALL ON samgan_eyecare.* TO 'samgan'@'localhost'; GRANT CREATE ON *.* TO 'samgan'@'localhost';"
# 2. Backend settings
cd backend ; copy .env.example .env      # now open .env: set DB_PASSWORD and a long random JWT_SECRET
npm install
npm run db:setup      # creates database + tables (database\schema.sql)
npm run db:seed       # fictional demo data
npm start             # API on http://localhost:5000
# For auto-restart during backend development: npm run dev
# 3. In a second PowerShell window
cd C:\Samgan\samgan-eyecare\frontend ; npm install ; npm run dev     # open http://localhost:5173
# Optional: npm test (in backend) runs the automated checks
```
Login: hospital code `DDH`, users `admin`, `reception`, `optometrist`, `doctor`, `doctor2`, `billing`, password `demo123`. Second hospital for the isolation test: code `DEMO2`, user `reception`.

Remote MySQL hosts (including TiDB Cloud) use TLS with certificate verification enabled. Local MySQL hosts (`localhost`, `127.0.0.1`, or `::1`) connect without TLS.

The Vercel frontend at `https://samgan-eyecare-full-stack-demo.vercel.app` calls the Render API directly. Set `VITE_API_URL` in Vercel only if the API URL changes. The backend's `CORS_ORIGIN` may be set to a comma-separated list of additional allowed origins; the current Vercel frontend is always allowed.

## Before real patient data
Needs a security and privacy review (DPDP), HTTPS hosting, backups with a tested restore, MFA for admins, full audit coverage and file-upload hardening. This demo makes no compliance claim.
