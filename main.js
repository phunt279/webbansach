function getBasePath() {
  return "";
}

function getIndexPath() {
  const path = window.location.pathname;
  if (path.includes("/admin/") || path.includes("/pages/"))
    return "../index.html";
  return "index.html";
}

// ===== CONFIG =====
const API = "http://localhost:3000";

// ===== AUTH =====
const Auth = {
  getUser() {
    const u = localStorage.getItem("bookstore_user");
    return u ? JSON.parse(u) : null;
  },
  setUser(user) {
    localStorage.setItem("bookstore_user", JSON.stringify(user));
  },
  logout() {
    localStorage.removeItem("bookstore_user");
    Cart.clear();
    window.location.href = getIndexPath();
  },
  isAdmin() {
    const u = this.getUser();
    return u && u.role === "admin";
  },
  isLoggedIn() {
    return !!this.getUser();
  },
};

// ===== CART =====
const Cart = {
  get() {
    const c = localStorage.getItem("bookstore_cart");
    return c ? JSON.parse(c) : [];
  },
  save(cart) {
    localStorage.setItem("bookstore_cart", JSON.stringify(cart));
    this.updateBadge();
  },
  add(book, qty = 1) {
    const cart = this.get();
    const idx = cart.findIndex((i) => i.bookId === book.id);
    if (idx >= 0) {
      cart[idx].quantity += qty;
    } else {
      cart.push({
        bookId: book.id,
        title: book.title,
        author: book.author,
        price: book.price,
        image: book.image,
        quantity: qty,
      });
    }
    this.save(cart);
    Toast.show("Đã thêm vào giỏ hàng! ", "success");
  },
  remove(bookId) {
    const cart = this.get().filter((i) => i.bookId !== bookId);
    this.save(cart);
  },
  updateQty(bookId, qty) {
    const cart = this.get();
    const idx = cart.findIndex((i) => String(i.bookId) === String(bookId));
    if (idx >= 0) {
      if (qty <= 0) cart.splice(idx, 1);
      else cart[idx].quantity = qty;
    }
    this.save(cart);
  },
  total() {
    return this.get().reduce((s, i) => s + i.price * i.quantity, 0);
  },
  count() {
    return this.get().reduce((s, i) => s + i.quantity, 0);
  },
  clear() {
    localStorage.removeItem("bookstore_cart");
    this.updateBadge();
  },
  updateBadge() {
    const badges = document.querySelectorAll(".cart-badge");
    const count = this.count();
    badges.forEach((b) => {
      b.textContent = count;
      b.style.display = count > 0 ? "flex" : "none";
    });
  },
};

// ===== TOAST =====
const Toast = {
  show(msg, type = "info") {
    let container = document.querySelector(".toast-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      document.body.appendChild(container);
    }
    const icons = { success: "✅", error: "❌", info: "ℹ️" };
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || "•"}</span><span>${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },
};

// ===== FORMAT =====
const fmt = {
  price(n) {
    return n.toLocaleString("vi-VN") + "₫";
  },
  discount(orig, curr) {
    return Math.round((1 - curr / orig) * 100) + "%";
  },
  date(d) {
    return new Date(d).toLocaleDateString("vi-VN");
  },
  stars(r) {
    const full = Math.floor(r);
    const half = r % 1 >= 0.5;
    let s = "★".repeat(full);
    if (half) s += "☆";
    return s;
  },
};

// ===== API HELPERS =====
const api = {
  async get(path) {
    const r = await fetch(API + path);
    if (!r.ok) throw new Error("Lỗi tải dữ liệu");
    return r.json();
  },
  async post(path, data) {
    const r = await fetch(API + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error("Lỗi gửi dữ liệu");
    return r.json();
  },
  async put(path, data) {
    const r = await fetch(API + path, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error("Lỗi cập nhật");
    return r.json();
  },
  async patch(path, data) {
    const r = await fetch(API + path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error("Lỗi cập nhật");
    return r.json();
  },
  async delete(path) {
    const r = await fetch(API + path, { method: "DELETE" });
    if (!r.ok) throw new Error("Lỗi xóa");
    return r.json();
  },
};

// ===== BOOK CARD =====
function renderBookCard(book, categories = []) {
  const cat = categories.find((c) => String(c.id) === String(book.categoryId));
  const discount = book.originalPrice
    ? fmt.discount(book.originalPrice, book.price)
    : null;
  return `
      <div class="book-card" data-id="${book.id}">
        ${discount ? `<span class="badge">-${discount}</span>` : ""}
        <div class="book-thumb">
          <img src="${book.image}" alt="${
            book.title
          }" loading="lazy" onerror="this.src='https://via.placeholder.com/200x280?text=📚'">
          <div class="book-actions">
            <button class="action-btn" onclick="quickView(${
              book.id
            })" title="Xem nhanh">👁️</button>
            <a class="action-btn" href="${getBasePath()}product.html?id=${
              book.id
            }" title="Chi tiết">🔗</a>
            <button class="action-btn" onclick="addToCart(${
              book.id
            })" title="Thêm giỏ">🛒</button>
          </div>
        </div>
        <div class="book-info">
          <div class="book-category">${cat ? cat.name : ""}</div>
          <div class="book-title">${book.title}</div>
          <div class="book-author">${book.author}</div>
          <div class="book-rating">
            <span class="stars">${fmt.stars(book.rating || 4.5)}</span>
            <span class="rating-count">(${book.reviews || 0})</span>
          </div>
          <div class="book-price">
            <span class="price-current">${fmt.price(book.price)}</span>
            ${
              book.originalPrice
                ? `<span class="price-original">${fmt.price(
                    book.originalPrice,
                  )}</span>`
                : ""
            }
            ${
              discount ? `<span class="price-discount">-${discount}</span>` : ""
            }
          </div>
          <button class="add-to-cart-btn" onclick="addToCart(${
            book.id
          })">🛒 Thêm vào giỏ</button>
        </div>
      </div>
    `;
}

// ===== CART SIDEBAR =====
function renderCartSidebar() {
  const sidebar = document.getElementById("cartSidebar");
  if (!sidebar) return;
  const cart = Cart.get();
  const itemsEl = sidebar.querySelector(".cart-items");
  const footerEl = sidebar.querySelector(".cart-footer");

  if (cart.length === 0) {
    itemsEl.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">🛒</div>
          <p>Giỏ hàng của bạn đang trống</p>
          <a href="#" onclick="window.location.href=getBasePath()+'books.html'" class="btn-primary" style="font-size:13px;padding:10px 20px">Mua sách ngay</a>
        </div>`;
    footerEl.classList.add("hidden");
    return;
  }

  footerEl.classList.remove("hidden");
  itemsEl.innerHTML = cart
    .map(
      (item) => `
      <div class="cart-item">
        <img src="${item.image}" alt="${
          item.title
        }" class="cart-item-img" onerror="this.src='https://via.placeholder.com/64x85?text=📚'">
        <div class="cart-item-info">
          <div class="cart-item-title">${item.title}</div>
          <div class="cart-item-author">${item.author}</div>
          <div class="cart-item-price">${fmt.price(item.price)}</div>
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty(${
              item.bookId
            }, -1)">-</button>
            <span class="qty-num">${item.quantity}</span>
            <button class="qty-btn" onclick="changeQty(${
              item.bookId
            }, 1)">+</button>
          </div>
        </div>
        <button class="remove-item" onclick="removeItem(${
          item.bookId
        })">✕</button>
      </div>
    `,
    )
    .join("");

  sidebar.querySelector(".cart-total-amount").textContent = fmt.price(
    Cart.total(),
  );
}

function changeQty(bookId, delta) {
  const cart = Cart.get();
  const item = cart.find((i) => String(i.bookId) === String(bookId));
  if (item) Cart.updateQty(bookId, item.quantity + delta);
  renderCartSidebar();
}

function removeItem(bookId) {
  Cart.remove(bookId);
  renderCartSidebar();
}

// ===== HEADER RENDER =====
function renderHeader() {
  const user = Auth.getUser();
  const navInner = document.getElementById("mainNav");
  const basePath = getBasePath();
  const indexPath = getIndexPath();

  if (!navInner) return;

  // Luôn hiện đầy đủ menu cho tất cả mọi người
  let menuHTML = `
      <a href="${indexPath}" class="nav-link"> Trang chủ</a>
      <a href="${basePath}books.html" class="nav-link">Sản phẩm</a>
      <a href="javascript:void(0)" class="nav-link" onclick="openCartSidebar()"> Giỏ hàng</a>
      <a href="${basePath}checkout.html" class="nav-link"> Thanh toán</a>
      <a href="${basePath}orders.html" class="nav-link"> Lịch sử mua hàng</a>
    `;

  if (user) {
    menuHTML += `
        <a href="javascript:void(0)" class="nav-link" onclick="Auth.logout()"> Đăng xuất</a>
      `;
  } else {
    menuHTML += `
        <a href="javascript:void(0)" class="nav-link" onclick="openModal('loginModal')"> Đăng nhập</a>
        <a href="javascript:void(0)" class="nav-link" onclick="typeof switchToRegister === 'function' ? switchToRegister() : openModal('registerModal')"> Đăng ký</a>
      `;
  }

  navInner.innerHTML = menuHTML;

  const adminBtn = document.getElementById("adminBtn");
  if (adminBtn) {
    adminBtn.style.display = Auth.isAdmin() ? "flex" : "none";
  }
  Cart.updateBadge();
}

// ===== MODAL =====
function openModal(id) {
  document.getElementById(id)?.classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id)?.classList.add("hidden");
}

// ===== QUICK VIEW =====
let booksCache = [];
let catsCache = [];

async function quickView(bookId) {
  try {
    const [book, cats] = await Promise.all([
      api.get(`/books/${bookId}`),
      booksCache.length ? Promise.resolve(catsCache) : api.get("/categories"),
    ]);
    catsCache = cats;
    const cat = cats.find((c) => String(c.id) === String(book.categoryId));
    const discount = book.originalPrice
      ? fmt.discount(book.originalPrice, book.price)
      : null;

    document.getElementById("quickViewBody").innerHTML = `
        <div style="display:grid;grid-template-columns:160px 1fr;gap:24px">
          <img src="${book.image}" alt="${
            book.title
          }" style="width:100%;border-radius:8px;object-fit:cover;aspect-ratio:3/4" onerror="this.src='https://via.placeholder.com/160x213?text=📚'">
          <div>
            <div class="book-category" style="margin-bottom:8px">${
              cat ? cat.name : ""
            }</div>
            <div style="font-family:'Playfair Display',serif;font-size:20px;font-weight:700;margin-bottom:6px;line-height:1.3">${
              book.title
            }</div>
            <div style="color:var(--ink-muted);font-size:14px;margin-bottom:12px">Tác giả: ${
              book.author
            }</div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
              <span style="font-size:22px;font-weight:700;color:var(--rust)">${fmt.price(
                book.price,
              )}</span>
              ${
                book.originalPrice
                  ? `<span style="text-decoration:line-through;color:var(--ink-muted)">${fmt.price(
                      book.originalPrice,
                    )}</span>`
                  : ""
              }
              ${
                discount
                  ? `<span style="background:var(--sage);color:white;font-size:12px;padding:2px 8px;border-radius:50px">-${discount}</span>`
                  : ""
              }
            </div>
            <div style="display:flex;gap:6px;margin-bottom:12px">
              <span style="color:#F5A623">${fmt.stars(book.rating)}</span>
              <span style="color:var(--ink-muted);font-size:13px">(${
                book.reviews
              } đánh giá)</span>
            </div>
            <p style="color:var(--ink-muted);font-size:14px;line-height:1.7;margin-bottom:16px">${
              book.description
            }</p>
            <div style="display:flex;gap:12px">
              <button class="btn-primary" onclick="addToCart(${
                book.id
              });closeModal('quickViewModal')" style="flex:1;justify-content:center">🛒 Thêm vào giỏ</button>
              <a href="${getBasePath()}product.html?id=${
                book.id
              }" class="btn-secondary" style="flex:1;justify-content:center">Xem chi tiết</a>
            </div>
          </div>
        </div>`;
    openModal("quickViewModal");
  } catch (e) {
    Toast.show("Không thể tải thông tin sách", "error");
  }
}

// ===== SEARCH =====
function initSearch() {
  const form = document.getElementById("searchForm");
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const q = document.getElementById("searchInput").value.trim();
      if (q)
        window.location.href =
          getBasePath() + `books.html?q=${encodeURIComponent(q)}`;
    };
  }
}

// ===== GLOBAL ADD TO CART =====
async function addToCart(bookId) {
  try {
    const book = await api.get(`/books/${bookId}`);
    Cart.add(book);
    renderCartSidebar();
    openCartSidebar();
  } catch (e) {
    Toast.show("Không thể thêm sách vào giỏ", "error");
  }
}

function openCartSidebar() {
  document.getElementById("cartOverlay")?.classList.remove("hidden");
}

function closeCartSidebar() {
  document.getElementById("cartOverlay")?.classList.add("hidden");
}

// ===== INIT =====
document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  initSearch();
  renderCartSidebar();

  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.add("hidden");
    });
  });

  const cartOverlay = document.getElementById("cartOverlay");
  if (cartOverlay) {
    cartOverlay.addEventListener("click", (e) => {
      if (e.target === cartOverlay) closeCartSidebar();
    });
  }
});
