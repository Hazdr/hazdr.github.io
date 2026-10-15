/**
 * main.js: interaksi landing page KulturBaik.
 * Semua data katalog diambil dari src/data/products.json; tidak ada data yang di-hardcode di HTML.
 */

// Catatan: nilai di bawah masih PLACEHOLDER. Ganti sebelum publikasi (lihat badge di section kontak & footer).
const SITE = {
  brand: "KulturBaik",
  email: "halo@contoh-kultur.id",
  whatsapp: "", // kosong = tombol WhatsApp disembunyikan, karena nomor asli belum ada
  placeholder: true,
};

const PRODUCTS_URL = "./src/data/products.json";

/* ------------------------------------------------------------------ *
 * Mobile navigation
 * ------------------------------------------------------------------ */
function init_mobile_nav() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const menu = document.querySelector("[data-nav-menu]");
  if (!toggle || !menu) return;

  const is_open = () => !menu.classList.contains("hidden");
  const open = () => {
    menu.classList.remove("hidden");
    toggle.setAttribute("aria-expanded", "true");
    toggle.querySelector("[data-icon-open]").classList.add("hidden");
    toggle.querySelector("[data-icon-close]").classList.remove("hidden");
  };
  const close = () => {
    menu.classList.add("hidden");
    toggle.setAttribute("aria-expanded", "false");
    toggle.querySelector("[data-icon-open]").classList.remove("hidden");
    toggle.querySelector("[data-icon-close]").classList.add("hidden");
  };

  toggle.addEventListener("click", () => {
    is_open() ? close() : open();
  });

  // Tutup saat link diklik (navigasi ke anchor) dan saat Escape ditekan.
  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && is_open()) {
      close();
      toggle.focus();
    }
  });

  // Kembali ke layout desktop: pastikan state bersih.
  window.matchMedia("(min-width: 768px)").addEventListener("change", (event) => {
    if (event.matches) close();
  });

  close();
}

/* ------------------------------------------------------------------ *
 * Katalog kultur: filter, render, plus empty / loading / error state
 * ------------------------------------------------------------------ */
const CATEGORY_ACCENT = {
  yogurt: "#3A8449",
  kefir: "#2C6B3A",
  kombucha: "#5FA36A",
  tempe: "#B96F1C",
  tape: "#D98A2B",
  acar: "#24552F",
};

function colony_icon(color) {
  // Ikon relevan: cawan petri dengan koloni, bukan ikon generik dari library.
  return `<svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true" focusable="false">
    <circle cx="24" cy="24" r="20" fill="none" stroke="${color}" stroke-width="2.5"/>
    <circle cx="18" cy="20" r="4.2" fill="${color}"/>
    <circle cx="29" cy="17" r="3.2" fill="${color}" opacity="0.75"/>
    <circle cx="27" cy="30" r="5" fill="${color}" opacity="0.9"/>
    <circle cx="16" cy="31" r="2.6" fill="${color}" opacity="0.6"/>
    <circle cx="34" cy="26" r="2.2" fill="${color}" opacity="0.6"/>
  </svg>`;
}

function product_card(item) {
  const accent = CATEGORY_ACCENT[item.category] || "#2C6B3A";
  const id = `produk-${item.id}`;
  return `
    <article id="${id}" class="flex h-full flex-col rounded-card border border-leaf-200 bg-white p-5">
      <div class="flex items-start gap-3">
        ${colony_icon(accent)}
        <div>
          <p class="font-body text-xs font-semibold text-leaf-800">${item.category_label}</p>
          <h3 class="mt-1 font-display text-lg font-semibold leading-snug text-ink">${item.name}</h3>
        </div>
      </div>
      <p class="mt-3 font-body text-sm italic text-muted">${item.strain}</p>
      <p class="mt-3 font-body text-[15px] leading-relaxed text-ink">${item.use}</p>
      <dl class="mt-4 space-y-1.5 border-t border-leaf-100 pt-4 font-body text-sm">
        <div class="flex gap-2"><dt class="w-24 shrink-0 font-semibold text-ink">Kemasan</dt><dd class="text-muted">${item.packaging}</dd></div>
        <div class="flex gap-2"><dt class="w-24 shrink-0 font-semibold text-ink">Penyimpanan</dt><dd class="text-muted">${item.storage}</dd></div>
        <div class="flex gap-2"><dt class="w-24 shrink-0 font-semibold text-ink">Masa pakai</dt><dd class="text-muted">${item.shelf_life}</dd></div>
      </dl>
      <a href="#kontak" data-preselect="${item.id}" class="mt-5 inline-flex min-h-[44px] items-center justify-center self-start rounded-card border-2 border-leaf-700 px-5 py-2 font-display text-sm font-semibold text-leaf-800 transition-colors hover:bg-leaf-100">
        Pesan atau tanya kultur ini
      </a>
    </article>`;
}

function init_catalog() {
  const grid = document.querySelector("[data-product-grid]");
  const filter_bar = document.querySelector("[data-product-filters]");
  const status = document.querySelector("[data-product-status]");
  const select = document.querySelector("[data-product-select]");
  if (!grid) return;

  let all_items = [];
  let active_category = "semua";

  const set_status = (message, kind) => {
    if (!status) return;
    if (!message) {
      status.hidden = true;
      status.textContent = "";
      status.className = "mt-8 hidden";
      return;
    }
    status.hidden = false;
    status.textContent = message;
    status.className =
      kind === "error"
        ? "mt-8 rounded-card border-2 border-red-300 bg-red-50 px-5 py-6 font-body text-red-800"
        : "mt-8 rounded-card border border-leaf-200 bg-cream-100 px-5 py-6 font-body text-muted";
  };

  const render = () => {
    const items = all_items.filter((item) => active_category === "semua" || item.category === active_category);
    if (items.length === 0) {
      grid.innerHTML = "";
      set_status("Belum ada kultur di kategori ini. Pilih kategori lain atau kirim kebutuhan khusus lewat formulir kontak.", "empty");
      return;
    }
    set_status(null);
    grid.innerHTML = items.map(product_card).join("");
  };

  const build_filters = (categories) => {
    if (!filter_bar) return;
    filter_bar.innerHTML = categories
      .map(
        (cat) => `<button type="button" role="tab" data-category="${cat.id}"
          aria-selected="${cat.id === "semua"}"
          class="min-h-[44px] rounded-card border-2 px-4 py-2 font-body text-sm font-semibold transition-colors
          aria-selected:border-leaf-700 aria-selected:bg-leaf-700 aria-selected:text-cream-50
          border-leaf-200 bg-white text-ink hover:border-leaf-400">${cat.label}</button>`
      )
      .join("");
    filter_bar.addEventListener("click", (event) => {
      const button = event.target.closest("[data-category]");
      if (!button) return;
      active_category = button.dataset.category;
      filter_bar.querySelectorAll("[data-category]").forEach((el) => {
        el.setAttribute("aria-selected", String(el === button));
      });
      render();
    });
  };

  const build_select = (items) => {
    if (!select) return;
    // Dropdown formulir diisi dari products.json supaya konsisten dengan katalog.
    const options = items
      .map((item) => `<option value="${item.name}">${item.name} (${item.category_label})</option>`)
      .join("");
    select.insertAdjacentHTML("beforeend", options);
  };

  set_status("Memuat katalog kultur...", "loading");
  fetch(PRODUCTS_URL)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      all_items = Array.isArray(data.items) ? data.items : [];
      build_filters(data.categories || [{ id: "semua", label: "Semua kultur" }]);
      build_select(all_items);
      render();
    })
    .catch((error) => {
      console.error("Gagal memuat katalog:", error);
      set_status(
        "Katalog kultur gagal dimuat. Muat ulang halaman, atau hubungi kami langsung lewat kontak di bagian bawah.",
        "error"
      );
    });
}

/* ------------------------------------------------------------------ *
 * FAQ accordion (aria-expanded + keyboard native via <button>)
 * ------------------------------------------------------------------ */
function init_faq() {
  document.querySelectorAll("[data-faq-item]").forEach((item) => {
    const button = item.querySelector("button");
    const panel = item.querySelector("[data-faq-panel]");
    if (!button || !panel) return;

    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!expanded));
      panel.hidden = expanded;
      item.querySelector("[data-faq-marker]").textContent = expanded ? "+" : "\u2212";
    });
  });
}

/* ------------------------------------------------------------------ *
 * Form kontak: validasi sisi klien + status yang bisa dibaca
 * ------------------------------------------------------------------ */
function init_form() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;
  const status = form.querySelector("[data-form-status]");
  const submit = form.querySelector("button[type=submit]");

  const rules = {
    nama: (v) => v.trim().length >= 2 || "Isi nama minimal 2 karakter.",
    kontak: (v) =>
      /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.trim()) || /^(\+?62|0)8[0-9]{7,12}$/.test(v.replace(/[\s-]/g, ""))
        ? ""
        : "Masukkan email valid atau nomor WhatsApp Indonesia (mis. 0812xxxxxxx).",
    produk: (v) => v !== "" || "Pilih jenis kultur yang dibutuhkan.",
  };

  const validate_field = (field) => {
    const rule = rules[field.name];
    if (!rule) return true;
    const message = rule(field.value);
    const error_el = field.closest("[data-field]").querySelector("[data-field-error]");
    if (message === true || message === "") {
      field.setAttribute("aria-invalid", "false");
      if (error_el) error_el.textContent = "";
      return true;
    }
    field.setAttribute("aria-invalid", "true");
    if (error_el) error_el.textContent = message;
    return false;
  };

  Object.keys(rules).forEach((name) => {
    const field = form.elements[name];
    if (!field) return;
    field.addEventListener("blur", () => validate_field(field));
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") validate_field(field);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const invalid = Object.keys(rules)
      .map((name) => form.elements[name])
      .filter(Boolean)
      .filter((field) => !validate_field(field));

    if (invalid.length > 0) {
      status.className =
        "mt-5 rounded-card border-2 border-red-300 bg-red-50 px-4 py-3 font-body text-sm font-medium text-red-800";
      status.textContent = `Ada ${invalid.length} kolom yang belum benar. Periksa kolom yang ditandai.`;
      invalid[0].focus();
      return;
    }

    // Static site: tidak ada backend, jadi pesan disiapkan lalu dikirim lewat email pengguna.
    const data = new FormData(form);
    const body = [
      `Nama: ${data.get("nama")}`,
      `Instansi/usaha: ${data.get("instansi") || "-"}`,
      `Kontak: ${data.get("kontak")}`,
      `Kultur: ${data.get("produk")}`,
      `Volume/kebutuhan: ${data.get("volume") || "-"}`,
      "",
      `Pesan: ${data.get("pesan") || "-"}`,
    ].join("\n");
    const mailto = `mailto:${SITE.email}?subject=${encodeURIComponent(
      `Permintaan kultur: ${data.get("produk")}`
    )}&body=${encodeURIComponent(body)}`;

    status.className =
      "mt-5 rounded-card border border-leaf-300 bg-leaf-50 px-4 py-4 font-body text-sm text-ink";
    status.innerHTML = `Data sudah valid. Formulir ini belum tersambung ke server, jadi pesan belum terkirim otomatis.<br>
      <a href="${mailto}" class="mt-3 inline-flex min-h-[44px] items-center rounded-card bg-amber-400 px-5 py-2 font-display font-semibold text-ink hover:bg-amber-300">Buka email untuk mengirim pesan</a>`;
    status.focus();
    submit.blur();
  });
}

/* ------------------------------------------------------------------ *
 * Preselect kultur ketika tombol "Pesan" di kartu diklik
 * ------------------------------------------------------------------ */
function init_preselect() {
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-preselect]");
    if (!trigger) return;
    const select = document.querySelector("[data-product-select]");
    if (!select) return;
    const card = trigger.closest("article");
    const name = card ? card.querySelector("h3").textContent.trim() : "";
    [...select.options].forEach((option) => {
      if (option.value === name) select.value = option.value;
    });
  });
}

/* ------------------------------------------------------------------ *
 * Scroll-reveal + footer year
 * ------------------------------------------------------------------ */
function init_reveal() {
  const targets = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || targets.length === 0) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
  );
  targets.forEach((el) => observer.observe(el));
}

function init_footer() {
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
}

document.documentElement.classList.add("js");
init_mobile_nav();
init_catalog();
init_faq();
init_form();
init_preselect();
init_reveal();
init_footer();
