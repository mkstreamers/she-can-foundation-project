/**
 * She Can Foundation — Admin JS
 * Handles: sidebar toggle, date display, delete modal, toast, row removal.
 */

/* ── Current date in topbar ── */
(function () {
  const el = document.getElementById("current-date");
  if (el) {
    el.textContent = new Date().toLocaleDateString("en-US", {
      weekday: "short", year: "numeric", month: "short", day: "numeric",
    });
  }
})();

/* ── Sidebar toggle (mobile) ── */
(function () {
  const btn     = document.getElementById("sidebar-toggle");
  const sidebar = document.querySelector(".sidebar");
  if (!btn || !sidebar) return;

  btn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  // Close sidebar when clicking outside
  document.addEventListener("click", e => {
    if (sidebar.classList.contains("open")
        && !sidebar.contains(e.target)
        && e.target !== btn) {
      sidebar.classList.remove("open");
    }
  });
})();

/* ================================================================
   DELETE CONFIRMATION FLOW
   ================================================================ */
(function () {
  const overlay  = document.getElementById("del-overlay");
  const nameEl   = document.getElementById("del-name");
  const cancelBtn = document.getElementById("del-cancel");
  const confirmBtn = document.getElementById("del-confirm");

  if (!overlay) return;

  let targetId   = null;
  let targetRow  = null;

  // Open modal when any delete button is clicked
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      targetId  = btn.dataset.id;
      targetRow = btn.closest(".sub-row");
      nameEl.textContent = btn.dataset.name || "this user";
      overlay.hidden = false;
      confirmBtn.focus();
    });
  });

  // Cancel
  cancelBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", e => {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !overlay.hidden) closeModal();
  });

  // Confirm delete
  confirmBtn.addEventListener("click", async () => {
    if (!targetId) return;
    confirmBtn.disabled = true;
    confirmBtn.textContent = "Deleting…";

    try {
      const res  = await fetch(`/admin/delete/${targetId}`, { method: "POST" });
      const data = await res.json();

      if (data.success) {
        closeModal();
        // Animate row out
        if (targetRow) {
          targetRow.style.transition = "opacity 0.35s, transform 0.35s";
          targetRow.style.opacity    = "0";
          targetRow.style.transform  = "translateX(-20px)";
          setTimeout(() => {
            targetRow.remove();
            updateCountDisplay(-1);
          }, 350);
        }
        showToast("Submission deleted successfully.", "success");
      } else {
        showToast("Failed to delete. Please try again.", "error");
        closeModal();
      }
    } catch {
      showToast("Network error. Please try again.", "error");
      closeModal();
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Yes, Delete";
    }
  });

  function closeModal() {
    overlay.hidden = true;
    targetId = null;
    targetRow = null;
  }

  function updateCountDisplay(delta) {
    // Update the "Total Submissions" stat card without a page reload
    const numEl = document.querySelector(".sc-total .sc-num");
    if (numEl) {
      const current = parseInt(numEl.textContent.replace(/,/g, ""), 10) || 0;
      numEl.textContent = Math.max(0, current + delta).toLocaleString();
    }
    // Update result count text
    const countEl = document.querySelector(".result-count");
    if (countEl) {
      const match = countEl.textContent.match(/\d+/);
      if (match) {
        const updated = Math.max(0, parseInt(match[0], 10) + delta);
        countEl.textContent = countEl.textContent.replace(/\d+/, updated);
      }
    }
  }
})();

/* ================================================================
   TOAST NOTIFICATION
   ================================================================ */
function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = (type === "success" ? "✓ " : "⚠ ") + msg;
  toast.className = `toast ${type}`;
  toast.hidden = false;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.hidden = true; }, 3500);
}

/* ================================================================
   SEARCH — debounce live filter hint
   (Full search uses server-side via GET form)
   ================================================================ */
(function () {
  const input = document.querySelector(".search-input");
  if (!input) return;
  // Highlight matching text in visible rows on keyup (optional visual aid)
  // Full search is server-side; this just clears stale highlights
  input.addEventListener("keyup", e => {
    if (e.key === "Enter") {
      input.closest("form").submit();
    }
  });
})();
