"""
She Can Foundation - Contact Form Application
============================================
Full Stack Internship Project
Tech Stack: Python Flask + SQLite + HTML/CSS/JS

Author: She Can Foundation Intern Submission
Version: 1.0.0
"""

import os
import csv
import sqlite3
import re
from datetime import datetime
from io import StringIO
from flask import (
    Flask, render_template, request,
    jsonify, redirect, url_for,
    send_file, flash, abort, session
)
from functools import wraps

# ─────────────────────────────────────────────
#  App Configuration
# ─────────────────────────────────────────────
app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "she-can-foundation-secret-2024")

BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
DB_PATH    = os.path.join(BASE_DIR, "database.db")

# Simple admin credentials (env-overridable)
ADMIN_USER = os.environ.get("ADMIN_USER", "admin")
ADMIN_PASS = os.environ.get("ADMIN_PASS", "shecan2024")


# ─────────────────────────────────────────────
#  Database Helpers
# ─────────────────────────────────────────────
def get_db():
    """Return a new SQLite connection with row_factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables if they don't exist."""
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS submissions (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                name       TEXT    NOT NULL,
                email      TEXT    NOT NULL,
                message    TEXT    NOT NULL,
                ip_address TEXT,
                created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
            )
        """)
        conn.commit()


# ─────────────────────────────────────────────
#  Input Validation
# ─────────────────────────────────────────────
EMAIL_RE = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def validate_submission(name, email, message):
    """Return (True, None) or (False, error_message)."""
    name    = (name    or "").strip()
    email   = (email   or "").strip()
    message = (message or "").strip()

    if not name or len(name) < 2:
        return False, "Name must be at least 2 characters."
    if len(name) > 100:
        return False, "Name must be under 100 characters."
    if not email or not EMAIL_RE.match(email):
        return False, "Please enter a valid email address."
    if len(email) > 200:
        return False, "Email address is too long."
    if not message or len(message) < 10:
        return False, "Message must be at least 10 characters."
    if len(message) > 2000:
        return False, "Message must be under 2000 characters."

    return True, None


# ─────────────────────────────────────────────
#  Admin Auth (session-less, simple HTTP Basic)
# ─────────────────────────────────────────────
def require_admin(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("admin_logged_in"):
            return redirect(url_for("login", next=request.url))
        return f(*args, **kwargs)
    return decorated


# ─────────────────────────────────────────────
#  Public Routes
# ─────────────────────────────────────────────
@app.route("/")
def index():
    """Landing page with contact form."""
    return render_template("index.html")


@app.route("/submit", methods=["POST"])
def submit():
    """Handle form submission via AJAX (JSON response)."""
    data    = request.get_json(silent=True) or {}
    name    = data.get("name",    "").strip()
    email   = data.get("email",   "").strip()
    message = data.get("message", "").strip()

    valid, error = validate_submission(name, email, message)
    if not valid:
        return jsonify({"success": False, "error": error}), 400

    ip = request.headers.get("X-Forwarded-For", request.remote_addr)

    try:
        with get_db() as conn:
            conn.execute(
                "INSERT INTO submissions (name, email, message, ip_address) VALUES (?, ?, ?, ?)",
                (name, email, message, ip),
            )
            conn.commit()
    except sqlite3.Error as e:
        app.logger.error("DB insert error: %s", e)
        return jsonify({"success": False, "error": "Server error. Please try again."}), 500

    return jsonify({"success": True, "message": "Thank you! We'll be in touch soon."})


# ─────────────────────────────────────────────
#  Auth Routes
# ─────────────────────────────────────────────
@app.route("/login", methods=["GET", "POST"])
def login():
    """Custom login page."""
    if session.get("admin_logged_in"):
        return redirect(url_for("admin_dashboard"))

    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if username == ADMIN_USER and password == ADMIN_PASS:
            session["admin_logged_in"] = True
            session.permanent = True  # Keep session for longer if needed
            next_page = request.args.get("next")
            return redirect(next_page or url_for("admin_dashboard"))
        else:
            flash("Invalid username or password.")

    return render_template("login.html")


@app.route("/logout")
def logout():
    """Log out and clear session."""
    session.pop("admin_logged_in", None)
    return redirect(url_for("login"))


# ─────────────────────────────────────────────
#  Admin Routes
# ─────────────────────────────────────────────
@app.route("/admin")
@require_admin
def admin_dashboard():
    """Admin dashboard – view all submissions with search."""
    search = request.args.get("q", "").strip()
    page   = max(1, int(request.args.get("page", 1)))
    per    = 10
    offset = (page - 1) * per

    with get_db() as conn:
        if search:
            pattern = f"%{search}%"
            total = conn.execute(
                "SELECT COUNT(*) FROM submissions WHERE name LIKE ? OR email LIKE ? OR message LIKE ?",
                (pattern, pattern, pattern),
            ).fetchone()[0]
            rows = conn.execute(
                "SELECT * FROM submissions WHERE name LIKE ? OR email LIKE ? OR message LIKE ? "
                "ORDER BY id DESC LIMIT ? OFFSET ?",
                (pattern, pattern, pattern, per, offset),
            ).fetchall()
        else:
            total = conn.execute("SELECT COUNT(*) FROM submissions").fetchone()[0]
            rows  = conn.execute(
                "SELECT * FROM submissions ORDER BY id DESC LIMIT ? OFFSET ?",
                (per, offset),
            ).fetchall()

        stats = {
            "total":   conn.execute("SELECT COUNT(*) FROM submissions").fetchone()[0],
            "today":   conn.execute(
                "SELECT COUNT(*) FROM submissions WHERE date(created_at)=date('now','localtime')"
            ).fetchone()[0],
            "this_week": conn.execute(
                "SELECT COUNT(*) FROM submissions WHERE created_at >= datetime('now','-7 days','localtime')"
            ).fetchone()[0],
        }

    total_pages = max(1, (total + per - 1) // per)

    return render_template(
        "admin.html",
        submissions=rows,
        stats=stats,
        search=search,
        page=page,
        total_pages=total_pages,
        total=total,
    )


@app.route("/admin/delete/<int:sub_id>", methods=["POST"])
@require_admin
def admin_delete(sub_id):
    """Delete a single submission."""
    with get_db() as conn:
        conn.execute("DELETE FROM submissions WHERE id = ?", (sub_id,))
        conn.commit()
    return jsonify({"success": True})


@app.route("/admin/export")
@require_admin
def admin_export():
    """Export all submissions to CSV download."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT id, name, email, message, ip_address, created_at FROM submissions ORDER BY id"
        ).fetchall()

    si = StringIO()
    writer = csv.writer(si)
    writer.writerow(["ID", "Name", "Email", "Message", "IP Address", "Submitted At"])
    for row in rows:
        writer.writerow(list(row))

    output = si.getvalue()
    filename = f"she_can_submissions_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

    from io import BytesIO
    mem = BytesIO()
    mem.write(output.encode("utf-8"))
    mem.seek(0)

    return send_file(
        mem,
        mimetype="text/csv",
        as_attachment=True,
        download_name=filename,
    )


# ─────────────────────────────────────────────
#  Error Handlers
# ─────────────────────────────────────────────
@app.errorhandler(404)
def not_found(e):
    return render_template("404.html"), 404

@app.errorhandler(500)
def server_error(e):
    return jsonify({"success": False, "error": "Internal server error."}), 500


# ─────────────────────────────────────────────
#  Entry Point
# ─────────────────────────────────────────────
if __name__ == "__main__":
    init_db()
    print("\n✅  She Can Foundation app is running!")
    print("    → Public form : http://127.0.0.1:5000/")
    print("    → Admin panel : http://127.0.0.1:5000/admin")
    print("      (user: admin  |  pass: shecan2024)\n")
    app.run(debug=True, host="0.0.0.0", port=5000)
