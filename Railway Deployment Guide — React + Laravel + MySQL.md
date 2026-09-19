# Deploying React + Laravel + MySQL to Railway

This guide explains how to deploy the application to Railway with the following architecture:

```text
┌─────────────────────┐
│   React / Vite      │
│     Frontend        │
└──────────┬──────────┘
           │ HTTPS / API
           ▼
┌─────────────────────┐
│   Laravel API       │
│      Backend        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│       MySQL         │
│      Database       │
└─────────────────────┘
```

The React frontend and Laravel backend are deployed as separate Railway services.

The Railway MySQL database starts empty. Laravel migrations are used to create the database structure.

---

## 1. Prerequisites

Before starting, make sure you have:

- A GitHub account
- A Railway account
- The project pushed to GitHub
- Laravel backend working locally
- React/Vite frontend working locally
- MySQL database working locally

Recommended repository structure:

```text
project/
├── backend/
│   ├── app/
│   ├── config/
│   ├── database/
│   ├── public/
│   ├── resources/
│   ├── routes/
│   ├── artisan
│   ├── composer.json
│   └── .env.example
│
└── frontend/
    ├── src/
    ├── public/
    ├── package.json
    ├── vite.config.ts
    └── .env.example
```

> If the project uses different directory names, adjust the Railway root directories accordingly.

---

# 2. Push the Project to GitHub

Make sure the project is committed and pushed:

```bash
git add .
git commit -m "Prepare project for Railway deployment"
git push origin main
```

## Important

Do **not** commit the real `.env` files.

Make sure `.gitignore` contains:

```text
.env
.env.*
!.env.example
```

The repository should contain `.env.example`, but not the real production credentials.

---

# 3. Create a Railway Project

Go to:

https://railway.com/

Create an account and connect your GitHub account.

Create a new project:

```text
New Project
    ↓
Empty Project
```

Give the project a name, for example:

```text
Client Demo
```

The Railway project will contain three services:

```text
Client Demo
│
├── React Frontend
├── Laravel API
└── MySQL
```

---

# 4. Create the MySQL Database

Inside the Railway project:

```text
+ New
  ↓
Database
  ↓
MySQL
```

Railway will create a MySQL instance.

The database will initially be empty.

Railway provides database connection variables such as:

```text
MYSQLHOST
MYSQLPORT
MYSQLDATABASE
MYSQLUSER
MYSQLPASSWORD
MYSQL_URL
```

The exact available variables can be checked in the MySQL service's **Variables** section.

---

# 5. Deploy the Laravel API

Inside the Railway project:

```text
+ New
  ↓
GitHub Repo
```

Select the GitHub repository containing the project.

Rename the service:

```text
Laravel API
```

## Set the Root Directory

Because Laravel is located inside `backend/`, configure the service to use:

```text
/backend
```

as its root directory.

This is important because Railway needs to find:

```text
backend/composer.json
backend/artisan
```

instead of looking for them in the repository root.

---

# 6. Configure Laravel Environment Variables

Open:

```text
Laravel API
    ↓
Variables
```

Add the required production variables.

Example:

```env
APP_NAME="Client Demo"
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:YOUR_APPLICATION_KEY
APP_URL=https://YOUR-LARAVEL-DOMAIN.up.railway.app

DB_CONNECTION=mysql
DB_HOST=...
DB_PORT=3306
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...
```

## APP_KEY

If the application already has an `APP_KEY`, use the existing key.

If the application does not have one, generate one locally:

```bash
php artisan key:generate --show
```

Then add the generated value to Railway:

```env
APP_KEY=base64:...
```

Do not commit the production `.env` file to GitHub.

---

# 7. Connect Laravel to Railway MySQL

The Laravel service needs to use the MySQL service created in Step 4.

Railway supports referencing variables from another service.

For example, the database configuration can use the MySQL service variables:

```env
DB_CONNECTION=mysql
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
```

Replace `MySQL` with the exact name of your Railway MySQL service if you renamed it.

For example, if the database service is named:

```text
client-demo-db
```

the references would use that service name.

Check Railway's **Variables** interface for the exact variable references available in your project.

---

# 8. Configure Laravel Migrations

The Railway database is empty, so Laravel needs to create the tables.

Set the Laravel service's **Pre-deploy Command** to:

```bash
php artisan migrate --force
```

This will execute the migrations before the application starts.

Do NOT use:

```bash
php artisan migrate:fresh
```

for the production/demo database because it drops existing tables.

---

# 9. Deploy Laravel

Once the variables are configured, Railway should automatically deploy the Laravel service.

Check:

```text
Laravel API
    ↓
Deployments
```

Look at the deployment logs.

A successful deployment should finish without errors.

If you see errors related to:

```text
APP_KEY
Database connection
Composer
PHP extensions
Migrations
```

check the deployment logs before continuing.

---

# 10. Generate a Public Laravel URL

The Laravel service needs a public URL so that the React application can communicate with it.

Open:

```text
Laravel API
    ↓
Settings
    ↓
Networking
    ↓
Generate Domain
```

Railway will generate a domain similar to:

```text
https://laravel-api-production.up.railway.app
```

Save this URL.

We will call it:

```text
LARAVEL_API_URL
```

For example:

```text
LARAVEL_API_URL=https://laravel-api-production.up.railway.app
```

---

# 11. Test the Laravel API

Open the Laravel URL in your browser.

For example:

```text
https://laravel-api-production.up.railway.app
```

If the application has an API health endpoint, use that instead.

For example:

```text
https://laravel-api-production.up.railway.app/api/health
```

Also test an endpoint that requires database access.

This confirms:

```text
Internet
   ↓
Laravel
   ↓
MySQL
```

is working.

---

# 12. Configure Laravel CORS

The React application will be hosted on a different domain from Laravel.

For example:

```text
React:
https://react-frontend-production.up.railway.app

Laravel:
https://laravel-api-production.up.railway.app
```

Laravel must therefore allow requests from the React domain.

Configure Laravel's CORS settings to allow:

```text
https://react-frontend-production.up.railway.app
```

For example, depending on the Laravel version:

```php
'allowed_origins' => [
    'https://react-frontend-production.up.railway.app',
],
```

Do not use:

```php
'allowed_origins' => ['*'],
```

when the application uses authenticated requests/cookies.

After changing CORS configuration, deploy Laravel again.

---

# 13. Deploy the React Frontend

Inside the same Railway project:

```text
+ New
  ↓
GitHub Repo
```

Select the same GitHub repository.

Rename the service:

```text
React Frontend
```

## Set the Root Directory

Because the React application is inside `frontend/`, configure:

```text
/frontend
```

as the root directory.

Railway should now find:

```text
frontend/package.json
```

---

# 14. Configure React Environment Variables

Open:

```text
React Frontend
    ↓
Variables
```

Add:

```env
VITE_API_URL=https://YOUR-LARAVEL-DOMAIN.up.railway.app
```

For example:

```env
VITE_API_URL=https://laravel-api-production.up.railway.app
```

If the existing application expects `/api` in the variable, use:

```env
VITE_API_URL=https://laravel-api-production.up.railway.app/api
```

Check how the existing React code constructs API URLs.

For example, if the code contains:

```typescript
axios.get(`${import.meta.env.VITE_API_URL}/users`)
```

then:

```env
VITE_API_URL=https://laravel-api-production.up.railway.app/api
```

would produce:

```text
https://laravel-api-production.up.railway.app/api/users
```

---

# 15. Configure the React Build

The frontend should have a build script in `package.json`.

For example:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

Railway should automatically install dependencies and run the build.

The normal Vite output directory is:

```text
dist/
```

---

# 16. Configure React SPA Routing

If the application uses React Router, direct navigation to routes such as:

```text
/login
/dashboard
/users
/settings
```

must be handled by the web server.

For example, opening:

```text
https://your-frontend.up.railway.app/dashboard
```

should return the React `index.html` instead of a server 404.

If Railway's default React deployment does not handle this correctly, configure the frontend with a small web server setup using Caddy.

A typical configuration is:

```text
try_files {path} /index.html
```

If this issue occurs, add the required Caddy configuration to the frontend deployment.

---

# 17. Generate the React Public URL

Open:

```text
React Frontend
    ↓
Settings
    ↓
Networking
    ↓
Generate Domain
```

Railway will generate something similar to:

```text
https://react-frontend-production.up.railway.app
```

Save this URL.

---

# 18. Update Laravel CORS With the Final React URL

Now that the final React URL is known, make sure Laravel allows it:

```text
https://react-frontend-production.up.railway.app
```

Then redeploy Laravel.

The final communication should be:

```text
Browser
   │
   │ HTTPS
   ▼
React Frontend
   │
   │ HTTPS API requests
   ▼
Laravel API
   │
   │ MySQL connection
   ▼
MySQL
```

---

# 19. Test the Complete Application

Open the React URL:

```text
https://react-frontend-production.up.railway.app
```

Test the complete application.

## Frontend

Check:

- [ ] Homepage loads
- [ ] React routing works
- [ ] Login works
- [ ] Navigation works
- [ ] Forms work

## API

Open browser DevTools:

```text
F12
    ↓
Network
```

Make sure requests go to:

```text
https://laravel-api-production.up.railway.app
```

and NOT:

```text
http://localhost:8000
```

or:

```text
http://127.0.0.1:8000
```

## Database

Test operations that require MySQL:

- [ ] Login
- [ ] Read data
- [ ] Create record
- [ ] Update record
- [ ] Delete record
- [ ] Reload page and verify persistence

## CORS

If the browser shows:

```text
Access to XMLHttpRequest has been blocked by CORS policy
```

check the Laravel CORS configuration and make sure the exact React domain is allowed.

---

# 20. Final Deployment Structure

The finished Railway project should look like:

```text
Railway
│
└── Client Demo
    │
    ├── React Frontend
    │   │
    │   └── https://react-frontend-production.up.railway.app
    │
    ├── Laravel API
    │   │
    │   └── https://laravel-api-production.up.railway.app
    │
    └── MySQL
```

The client only needs to know the React URL:

```text
https://react-frontend-production.up.railway.app
```

They do not need to access the Laravel or MySQL services directly.

---

# 21. Optional: Custom Domain

For a more professional client presentation, you can later configure a custom domain.

For example:

```text
https://demo.example.com
```

The architecture becomes:

```text
demo.example.com
       │
       ▼
 React Frontend
       │
       │ HTTPS
       ▼
api.example.com
       │
       ▼
 Laravel API
       │
       ▼
    MySQL
```

This is optional for the initial demo.

---

# 22. Troubleshooting

## Laravel cannot connect to MySQL

Check:

```env
DB_CONNECTION=mysql
DB_HOST=...
DB_PORT=3306
DB_DATABASE=...
DB_USERNAME=...
DB_PASSWORD=...
```

Make sure the values reference the Railway MySQL service.

---

## `APP_KEY` error

Generate a key:

```bash
php artisan key:generate --show
```

Add it to Railway:

```env
APP_KEY=base64:...
```

---

## React still calls localhost

Check the Railway React variables:

```env
VITE_API_URL=https://your-laravel-api.up.railway.app
```

Remember that Vite environment variables are embedded into the frontend during the build.

After changing `VITE_API_URL`, trigger a new deployment.

---

## CORS error

Verify that Laravel allows the exact React origin:

```text
https://your-react-domain.up.railway.app
```

Do not accidentally include a trailing path such as:

```text
https://your-react-domain.up.railway.app/dashboard
```

The origin should be the domain only.

---

## React routes return 404

The frontend server needs an SPA fallback to:

```text
index.html
```

Configure the Railway frontend server accordingly.

---

## Database tables do not exist

Check the Laravel deployment logs and make sure:

```bash
php artisan migrate --force
```

runs successfully.

You can also run migrations manually through a Railway shell if necessary.

---

# 23. Deployment Checklist

Before sending the URL to the client:

```text
Infrastructure
────────────────────────────────
[ ] Railway project created
[ ] MySQL service created
[ ] Laravel service deployed
[ ] React service deployed
[ ] Public Laravel domain generated
[ ] Public React domain generated


Laravel
────────────────────────────────
[ ] APP_ENV=production
[ ] APP_DEBUG=false
[ ] APP_KEY configured
[ ] MySQL credentials configured
[ ] Migrations completed
[ ] CORS configured
[ ] API accessible


React
────────────────────────────────
[ ] VITE_API_URL configured
[ ] Production build successful
[ ] React routes work
[ ] No localhost API URLs
[ ] SPA fallback configured if necessary


Application
────────────────────────────────
[ ] Login tested
[ ] API requests tested
[ ] Database operations tested
[ ] Create/update/delete tested
[ ] Browser console checked
[ ] Network requests checked


Client
────────────────────────────────
[ ] Final React URL tested in incognito/private browser
[ ] Client URL shared
```

---

## Final URLs

After deployment, record these:

```text
Frontend:
https://____________________________

Laravel API:
https://____________________________

Database:
Railway internal service — not publicly exposed
```

Only share the **Frontend** URL with the client.