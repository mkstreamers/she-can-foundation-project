# She Can Foundation — Contact Form Web App

> **Full Stack Development Internship Project**
> A production-ready contact form application built with Python Flask, SQLite, and a modern animated UI.

---

## 🌟 Project Overview

This project delivers a polished, internship-level web application for **She Can Foundation** — an NGO dedicated to empowering women through education, mentorship, and opportunity.

It goes well beyond a basic form submission by including:
- A branded, animated hero section with live statistics counters
- Glassmorphism card design with animated gradient background
- Full admin dashboard with search, pagination, delete, and CSV export
- Complete client-side *and* server-side validation
- Accessible, responsive layout (mobile → desktop)

---

## ✨ Features

### 🎨 Public Form (`/`)
| Feature | Details |
|---|---|
| Animated background | Canvas-based particle system + floating gradient orbs |
| Hero section | Animated stat counters (Women Supported, Countries, Success Rate) |
| Contact form | Name · Email · Message with real-time validation |
| Loading state | Spinner replaces submit text during AJAX call |
| Success modal | Animated SVG checkmark + contextual confirmation |
| Responsive | Works on 320 px phones through 4K desktops |
| Accessibility | Semantic HTML, ARIA labels, keyboard navigation |

### 🔒 Admin Dashboard (`/admin`)
| Feature | Details |
|---|---|
| HTTP Basic Auth | Configurable via environment variables |
| Statistics | Total · Today · This Week submission counts |
| Data table | Paginated (10/page), sortable by latest first |
| Search | Server-side full-text search across name/email/message |
| Delete | Animated row removal with confirmation modal |
| CSV Export | One-click download with timestamped filename |
| Mobile sidebar | Collapsible sidebar for small screens |

---

## 🛠 Tech Stack

```
Backend   → Python 3.10+, Flask 3.x, SQLite 3
Frontend  → HTML5, CSS3 (custom design system), Vanilla JS (ES2020+)
Fonts     → Playfair Display (headings) + DM Sans (body) — via Google Fonts
Icons     → Inline SVG (no external dependency)
```

---

## 📁 Project Structure

```
she-can-foundation/
│
├── app.py                  # Flask application (routes, DB, validation)
├── database.db             # SQLite database (auto-created on first run)
├── requirements.txt        # Python dependencies
├── README.md
│
├── templates/
│   ├── index.html          # Public contact form page
│   ├── admin.html          # Admin dashboard
│   └── 404.html            # Custom 404 page
│
└── static/
    ├── css/
    │   ├── style.css       # Public site styles
    │   └── admin.css       # Admin dashboard styles
    └── js/
        ├── main.js         # Public page: canvas, counters, form logic
        └── admin.js        # Admin: delete modal, toast, sidebar
```

---

## 🗄 Database Schema

```sql
CREATE TABLE submissions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT    NOT NULL,
    email      TEXT    NOT NULL,
    message    TEXT    NOT NULL,
    ip_address TEXT,
    created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
);
```

---

## ⚙️ Setup & Run Locally

### Prerequisites
- Python 3.10 or higher
- pip

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/your-username/she-can-foundation.git
cd she-can-foundation

# 2. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the app
python app.py
```

The database is created automatically on first launch.

| URL | Description |
|---|---|
| `http://127.0.0.1:5000/` | Public contact form |
| `http://127.0.0.1:5000/admin` | Admin dashboard |

**Default admin credentials:**
- Username: `admin`
- Password: `shecan2024`

---

## 🔐 Environment Variables

Override defaults by setting these before running:

```bash
export SECRET_KEY="your-secret-key-here"
export ADMIN_USER="your-admin-username"
export ADMIN_PASS="your-secure-password"
python app.py
```

---

## 🚀 Deployment (Production)

### Option A — Gunicorn + Nginx (Linux VPS)

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Option B — Railway / Render (Free tier)

1. Push to GitHub
2. Connect repo on [Railway](https://railway.app) or [Render](https://render.com)
3. Set environment variables in the dashboard
4. Deploy — zero additional config needed

### Option C — Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:5000", "app:app"]
```

---

## 📸 Screenshots

> _Add screenshots to `/static/img/` and update paths below._

| Public Form | Success Modal | Admin Dashboard |
|---|---|---|
| ![Form](static/img/screenshot-form.png) | ![Modal](static/img/screenshot-modal.png) | ![Admin](static/img/screenshot-admin.png) |

---

## 🔮 Future Enhancements

| Feature | Effort | Impact |
|---|---|---|
| Email notifications (Flask-Mail) on new submission | Low | High |
| reCAPTCHA v3 integration | Low | High |
| Reply-to-submitter from admin panel | Medium | High |
| Dark/light theme toggle | Low | Medium |
| Chart.js analytics (submissions over time) | Medium | Medium |
| PostgreSQL swap-out for production scale | Medium | High |
| JWT-based admin auth (replace HTTP Basic) | Medium | High |
| Slack / webhook notification on submission | Low | Medium |

---

## 📋 Resume Description

> **She Can Foundation — Full Stack Web Application** | Python · Flask · SQLite · HTML/CSS · JavaScript
>
> Built a production-ready contact form web application for an NGO, featuring an animated glassmorphism UI, real-time form validation, AJAX submission with loading states, and a secure admin dashboard. The admin panel includes server-side search, paginated data table, one-click CSV export, and submission management with confirmation modals. Applied clean architecture with input sanitisation, HTTP Basic Auth, environment-based configuration, and accessible semantic HTML.

---

## 🌐 GitHub Description

> Full-stack NGO contact form app — Python Flask · SQLite · animated glassmorphism UI · admin dashboard with search, pagination, CSV export, and delete. Mobile-responsive, accessible, and production-ready.

**Topics:** `python` `flask` `sqlite` `html` `css` `javascript` `glassmorphism` `ngo` `contact-form` `admin-dashboard` `full-stack` `internship-project`

---

## 📄 License

MIT — free to use, modify, and distribute.

---

<p align="center">Built with ♥ for She Can Foundation · Empowering Women Worldwide</p>
