/**
 * Meu Confeito - Interactive Single Page Script
 * Powers navigation, responsive menu, interactive recipe pricing calculator,
 * trend filters, interactive map preview, and FAQ accordions.
 */

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initMobileNavigation();
  initRecipeCalculator();
  initTrendFilters();
  initInteractiveMap();
  initFaqAccordion();
  initSmoothScroll();
});

/**
 * Mobile Navigation Drawer Toggle
 */
function initMobileNavigation() {
  const toggleBtn = document.getElementById("mobileMenuToggle");
  const drawer = document.getElementById("mobileNavDrawer");
  const navLinks = drawer ? drawer.querySelectorAll(".nav-link") : [];

  if (!toggleBtn || !drawer) return;

  const toggleMenu = () => {
    const isOpen = drawer.classList.toggle("is-open");
    toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  };

  toggleBtn.addEventListener("click", toggleMenu);

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      drawer.classList.remove("is-open");
      toggleBtn.setAttribute("aria-expanded", "false");
    });
  });
}

/**
 * Interactive Recipe Cost & Pricing Calculator (Ficha Técnica Interativa)
 */
function initRecipeCalculator() {
  const itemsContainer = document.getElementById("calcItemsList");
  const addIngredientBtn = document.getElementById("addIngredientBtn");
  const yieldInput = document.getElementById("calcYield");
  const overheadInput = document.getElementById("calcOverhead");
  const marginInput = document.getElementById("calcMargin");

  // Display outputs
  const totalCostEl = document.getElementById("outTotalCost");
  const overheadCostEl = document.getElementById("outOverheadCost");
  const grandTotalEl = document.getElementById("outGrandTotal");
  const unitCostEl = document.getElementById("outUnitCost");
  const suggestedPriceEl = document.getElementById("outSuggestedPrice");
  const profitPerUnitEl = document.getElementById("outProfitPerUnit");
  const totalBatchProfitEl = document.getElementById("outTotalBatchProfit");

  // Default initial ingredients
  let ingredients = [
    {
      name: "Leite Condensado (395g)",
      packageCost: 7.5,
      packageQty: 395,
      usedQty: 395,
    },
    {
      name: "Creme de Leite (200g)",
      packageCost: 4.2,
      packageQty: 200,
      usedQty: 200,
    },
    {
      name: "Cacau em Pó 100% (500g)",
      packageCost: 28.0,
      packageQty: 500,
      usedQty: 50,
    },
    {
      name: "Manteiga sem Sal (200g)",
      packageCost: 12.0,
      packageQty: 200,
      usedQty: 25,
    },
    {
      name: "Confeito Belga / Granulado (500g)",
      packageCost: 35.0,
      packageQty: 500,
      usedQty: 100,
    },
    {
      name: "Embalagens Individuais (25 un)",
      packageCost: 15.0,
      packageQty: 25,
      usedQty: 25,
    },
  ];

  function formatCurrency(val) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  }

  function renderIngredients() {
    if (!itemsContainer) return;
    itemsContainer.innerHTML = "";

    ingredients.forEach((item, index) => {
      const row = document.createElement("div");
      row.className = "calc-item-row";

      const itemCost =
        (item.packageCost / (item.packageQty || 1)) * item.usedQty;

      row.innerHTML = `
        <div class="form-group form-group--name">
          <label class="form-label">Ingrediente / Insumo</label>
          <input type="text" class="form-input item-name" data-index="${index}" value="${item.name}">
        </div>
        <div class="form-group form-group--cost">
          <label class="form-label">Preço Pacote (R$)</label>
          <input type="number" step="0.01" min="0" class="form-input item-pkg-cost" data-index="${index}" value="${item.packageCost.toFixed(2)}">
        </div>
        <div class="form-group form-group--qty">
          <label class="form-label">Qtd Usada / Total</label>
          <div class="calc-qty-input-group">
            <input type="number" step="1" min="1" class="form-input item-used-qty" data-index="${index}" value="${item.usedQty}">
            <span class="calc-qty-separator">/</span>
            <input type="number" step="1" min="1" class="form-input item-pkg-qty" data-index="${index}" value="${item.packageQty}">
          </div>
        </div>
        <button type="button" class="btn-icon-delete" data-index="${index}" title="Remover item" aria-label="Remover item">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      `;

      itemsContainer.appendChild(row);
    });

    attachItemListeners();
    calculateTotals();
  }

  function attachItemListeners() {
    itemsContainer.querySelectorAll(".item-name").forEach((input) => {
      input.addEventListener("input", (e) => {
        const idx = e.target.dataset.index;
        ingredients[idx].name = e.target.value;
      });
    });

    itemsContainer.querySelectorAll(".item-pkg-cost").forEach((input) => {
      input.addEventListener("input", (e) => {
        const idx = e.target.dataset.index;
        ingredients[idx].packageCost = parseFloat(e.target.value) || 0;
        calculateTotals();
      });
    });

    itemsContainer.querySelectorAll(".item-used-qty").forEach((input) => {
      input.addEventListener("input", (e) => {
        const idx = e.target.dataset.index;
        ingredients[idx].usedQty = parseFloat(e.target.value) || 0;
        calculateTotals();
      });
    });

    itemsContainer.querySelectorAll(".item-pkg-qty").forEach((input) => {
      input.addEventListener("input", (e) => {
        const idx = e.target.dataset.index;
        ingredients[idx].packageQty = parseFloat(e.target.value) || 1;
        calculateTotals();
      });
    });

    itemsContainer.querySelectorAll(".btn-icon-delete").forEach((button) => {
      button.addEventListener("click", (e) => {
        const btn = e.currentTarget;
        const idx = parseInt(btn.dataset.index, 10);
        ingredients.splice(idx, 1);
        renderIngredients();
      });
    });
  }

  function calculateTotals() {
    const rawCost = ingredients.reduce((acc, curr) => {
      const unit = curr.packageCost / (curr.packageQty || 1);
      return acc + unit * curr.usedQty;
    }, 0);

    const yieldQty = Math.max(
      1,
      parseFloat(yieldInput ? yieldInput.value : 25) || 1,
    );
    const overheadPercent =
      Math.max(0, parseFloat(overheadInput ? overheadInput.value : 15) || 0) /
      100;
    const marginPercent =
      Math.max(0, parseFloat(marginInput ? marginInput.value : 100) || 0) / 100;

    const overheadCost = rawCost * overheadPercent;
    const grandTotal = rawCost + overheadCost;
    const unitCost = grandTotal / yieldQty;

    // Suggested sale price = unitCost * (1 + marginPercent)
    const suggestedUnitPrice = unitCost * (1 + marginPercent);
    const unitProfit = suggestedUnitPrice - unitCost;
    const totalBatchProfit = unitProfit * yieldQty;

    if (totalCostEl) totalCostEl.textContent = formatCurrency(rawCost);
    if (overheadCostEl)
      overheadCostEl.textContent = formatCurrency(overheadCost);
    if (grandTotalEl) grandTotalEl.textContent = formatCurrency(grandTotal);
    if (unitCostEl) unitCostEl.textContent = formatCurrency(unitCost);
    if (suggestedPriceEl)
      suggestedPriceEl.textContent = formatCurrency(suggestedUnitPrice);
    if (profitPerUnitEl)
      profitPerUnitEl.textContent = formatCurrency(unitProfit);
    if (totalBatchProfitEl)
      totalBatchProfitEl.textContent = formatCurrency(totalBatchProfit);
  }

  if (addIngredientBtn) {
    addIngredientBtn.addEventListener("click", () => {
      ingredients.push({
        name: "Novo Insumo",
        packageCost: 10.0,
        packageQty: 1000,
        usedQty: 100,
      });
      renderIngredients();
    });
  }

  if (yieldInput) yieldInput.addEventListener("input", calculateTotals);
  if (overheadInput) overheadInput.addEventListener("input", calculateTotals);
  if (marginInput) marginInput.addEventListener("input", calculateTotals);

  renderIngredients();
}

/**
 * Trends Filter Bar
 */
function initTrendFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const trendCards = document.querySelectorAll(".trend-card");

  if (!filterButtons.length || !trendCards.length) return;

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      const filter = btn.dataset.filter;

      trendCards.forEach((card) => {
        const category = card.dataset.category;
        if (
          filter === "all" ||
          category === filter ||
          category.includes(filter)
        ) {
          card.style.display = "flex";
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}

/**
 * Interactive Geolocation Map Pins
 */
function initInteractiveMap() {
  const pins = document.querySelectorAll(".map-pin");
  const detailsBox = document.getElementById("selectedPointDetails");

  if (!pins.length || !detailsBox) return;

  const pointsData = {
    p1: {
      name: "Ateliê Doce Sabor",
      baker: "Mariana Silva",
      address: "Vila Madalena, São Paulo - SP",
      specialty: "Brigadeiros Gourmet & Copos da Felicidade",
      status: "Contato Disponível",
      channels: "WhatsApp & Instagram no perfil",
    },
    p2: {
      name: "Confeitaria Encanto",
      baker: "Beatriz Costa",
      address: "Pinheiros, São Paulo - SP",
      specialty: "Bolo no Pote Vulcão & Bentô Cakes",
      status: "Contato Disponível",
      channels: "WhatsApp & Instagram no perfil",
    },
    p3: {
      name: "Lúcia Doces Artesanais",
      baker: "Lúcia Ferreira",
      address: "Jardins, São Paulo - SP",
      specialty: "Sobremesas Finas & Brownies Recheados",
      status: "Contato Disponível",
      channels: "WhatsApp & Instagram no perfil",
    },
  };

  pins.forEach((pin) => {
    pin.addEventListener("click", () => {
      pins.forEach((p) => p.classList.remove("is-active"));
      pin.classList.add("is-active");

      const id = pin.dataset.id;
      const data = pointsData[id];

      if (data) {
        detailsBox.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
            <div>
              <h4 style="font-family:var(--mc-font-headline); font-size:16px; color:var(--mc-espresso-dark); font-weight:700;">${data.name}</h4>
              <p style="font-size:12px; color:var(--mc-on-surface-variant); font-weight:500;">Confeiteira: ${data.baker}</p>
            </div>
            <span class="chip chip--success" style="font-size:11px;">${data.status}</span>
          </div>
          <p style="font-size:13px; color:var(--mc-on-surface); margin-bottom:6px;"><strong>Especialidades:</strong> ${data.specialty}</p>
          <p style="font-size:12px; color:var(--mc-outline);">📍 ${data.address}</p>
          <div class="map-point-footer">
            <span class="map-point-channels">${data.channels}</span>
            <button class="btn btn--primary btn--sm" onclick="alert('No Meu Confeito, você visualiza os canais de contato da confeiteira (WhatsApp e Instagram) para conversar diretamente!')">Ver Meios de Contato</button>
          </div>
        `;
      }
    });
  });
}

/**
 * FAQ Accordion
 */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const trigger = item.querySelector(".faq-trigger");
    if (!trigger) return;

    trigger.addEventListener("click", () => {
      const isOpen = item.classList.contains("is-open");

      // Close all other items for clean single expansion
      faqItems.forEach((otherItem) => {
        if (otherItem !== item) {
          otherItem.classList.remove("is-open");
          const otherTrigger = otherItem.querySelector(".faq-trigger");
          if (otherTrigger) otherTrigger.setAttribute("aria-expanded", "false");
        }
      });

      item.classList.toggle("is-open", !isOpen);
      trigger.setAttribute("aria-expanded", !isOpen ? "true" : "false");
    });
  });
}

/**
 * Smooth scrolling for navigation anchors
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const targetId = this.getAttribute("href");
      if (targetId === "#" || targetId === "") return;

      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerOffset = 85;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    });
  });
}

/**
 * Fast Theme Toggle (Light / Dark Mode)
 * Synchronizes with document attributes, meta color-scheme, localStorage, and system preference.
 */
function initThemeToggle() {
  const toggleBtn = document.getElementById("themeToggleBtn");
  if (!toggleBtn) return;

  function updateAriaLabel(theme) {
    if (theme === "dark") {
      toggleBtn.setAttribute("aria-label", "Alternar para modo claro");
      toggleBtn.setAttribute("title", "Alternar para modo claro");
    } else {
      toggleBtn.setAttribute("aria-label", "Alternar para modo escuro");
      toggleBtn.setAttribute("title", "Alternar para modo escuro");
    }
  }

  function getCurrentTheme() {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr) return attr;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(theme, save = true) {
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.content = theme;
    }
    updateAriaLabel(theme);
    if (save) {
      try {
        localStorage.setItem("mc-theme", theme);
      } catch (e) {
        // Fallback if localStorage is inaccessible
      }
    }
  }

  // Ensure accessible label matches current rendered theme on init
  updateAriaLabel(getCurrentTheme());

  toggleBtn.addEventListener("click", () => {
    const currentTheme = getCurrentTheme();
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme, true);
  });

  // Listen to OS theme change when user hasn't explicitly overridden
  try {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    mediaQuery.addEventListener("change", (e) => {
      let hasStored = false;
      try {
        hasStored = !!localStorage.getItem("mc-theme");
      } catch (err) {}

      if (!hasStored) {
        applyTheme(e.matches ? "dark" : "light", false);
      }
    });
  } catch (e) {}

  // Keep multiple tabs in sync
  window.addEventListener("storage", (e) => {
    if (e.key === "mc-theme" && e.newValue) {
      applyTheme(e.newValue, false);
    }
  });
}
