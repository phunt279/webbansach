// Admin shared utilities
const AdminAuth = {
  check() {
    const user = Auth.getUser();
    if (!user || user.role !== "admin") {
      alert("Bạn không có quyền truy cập trang Admin!");
      window.location.href = "index.html";
      return false;
    }
    return true;
  },
  getUser() {
    return Auth.getUser();
  },
};

function renderAdminLayout(activePage) {
  if (!AdminAuth.check()) return;
  const user = AdminAuth.getUser();

  document.querySelector(".admin-user-avatar").textContent = user.name
    .charAt(0)
    .toUpperCase();
  document.querySelector(".admin-user-info .name").textContent = user.name;

  document.querySelectorAll(".admin-nav-item").forEach((item) => {
    item.classList.remove("active");
    if (item.dataset.page === activePage) item.classList.add("active");
  });
}

function confirmDelete(msg) {
  return confirm(msg || "Bạn có chắc muốn xóa không?");
}

function adminModal(id, show) {
  const el = document.getElementById(id);
  if (!el) return;
  if (show) el.classList.remove("hidden");
  else el.classList.add("hidden");
}
