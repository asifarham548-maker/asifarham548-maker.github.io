/* =========================================
   GlowNest — Demo E-commerce Script
   No real payments or purchases are processed.
========================================= */

(() => {
  "use strict";
   const WEB3FORMS_ACCESS_KEY = "5bd4bbc4-4593-462e-aa30-627f56445f3d"

  const CART_KEY = "glownest-demo-cart-v1";
  const ORDER_KEY = "glownest-demo-last-order-v1";

  /* ---------- Cart storage ---------- */

  function getCart() {
    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(cart) ? cart : [];
    } catch {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
  }

  function formatPrice(amount) {
    return "Rs. " + Number(amount || 0).toLocaleString("en-PK");
  }

  function getCartTotal(cart = getCart()) {
    return cart.reduce(
      (total, item) => total + Number(item.price) * Number(item.quantity),
      0
    );
  }

  function updateCartCount() {
    const count = getCart().reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    );

    document.querySelectorAll("[data-cart-count]").forEach((element) => {
      element.textContent = count;
      element.setAttribute("aria-label", `${count} items in cart`);
    });
  }

  /* ---------- Notification ---------- */

  function showToast(message) {
    let toast = document.querySelector(".glownest-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.className = "glownest-toast";
      toast.setAttribute("role", "status");

      Object.assign(toast.style, {
        position: "fixed",
        left: "50%",
        bottom: "24px",
        transform: "translateX(-50%)",
        zIndex: "9999",
        maxWidth: "calc(100% - 32px)",
        padding: "13px 20px",
        borderRadius: "12px",
        background: "#294b3b",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        textAlign: "center",
        boxShadow: "0 8px 25px rgba(0,0,0,0.18)"
      });

      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.display = "block";

    if (toast.hideTimer) {
      clearTimeout(toast.hideTimer);
    }

    toast.hideTimer = setTimeout(() => {
      toast.style.display = "none";
    }, 2600);
  }

  /* ---------- Hamburger menu ---------- */

  function setupMenu() {
    const menuButton = document.querySelector(".menu-toggle");
    const navigation = document.querySelector("#primary-nav");

    if (!menuButton || !navigation) return;

    function closeMenu() {
      menuButton.setAttribute("aria-expanded", "false");
      navigation.classList.remove("is-open");
    }

    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";

      menuButton.setAttribute("aria-expanded", String(!isOpen));
      navigation.classList.toggle("is-open", !isOpen);
    });

    navigation.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("click", (event) => {
      if (
        !menuButton.contains(event.target) &&
        !navigation.contains(event.target)
      ) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    });
  }

  /* ---------- Add to Cart buttons ---------- */

  function setupAddToCart() {
    document.querySelectorAll("[data-add-to-cart]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;
        const name = button.dataset.name;
        const price = Number(button.dataset.price);
        const image = button.dataset.image || "";

        if (!id || !name || !Number.isFinite(price) || price < 0) {
          showToast("Sorry, this product could not be added.");
          return;
        }

        const cart = getCart();
        const existingItem = cart.find((item) => item.id === id);

        if (existingItem) {
          existingItem.quantity += 1;
        } else {
          cart.push({
            id,
            name,
            price,
            image,
            quantity: 1
          });
        }

        saveCart(cart);
        showToast(`${name} added to your cart!`);
      });
    });
  }

  /* ---------- Safe element helpers ---------- */

  function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== undefined) {
      element.textContent = text;
    }

    return element;
  }

  /* ---------- Cart page ---------- */

  function renderCartPage() {
    const itemsContainer = document.querySelector("[data-cart-items]");
    if (!itemsContainer) return;

    const emptyState = document.querySelector("[data-empty-cart]");
    const cartContent = document.querySelector("[data-cart-content]");
    const subtotalElement = document.querySelector("[data-subtotal]");
    const totalElement = document.querySelector("[data-total]");

    function render() {
      const cart = getCart();
      itemsContainer.replaceChildren();

      const isEmpty = cart.length === 0;

      if (emptyState) emptyState.hidden = !isEmpty;
      if (cartContent) cartContent.hidden = isEmpty;

      if (isEmpty) {
        if (subtotalElement) subtotalElement.textContent = formatPrice(0);
        if (totalElement) totalElement.textContent = formatPrice(0);
        updateCartCount();
        return;
      }

      cart.forEach((item) => {
        const row = createElement("article", "cart-item");

        if (item.image) {
          const image = createElement("img", "cart-item-image");
          image.src = item.image;
          image.alt = item.name;
          image.loading = "lazy";
          image.width = 90;
          image.height = 90;
          row.appendChild(image);
        }

        const details = createElement("div", "cart-item-details");
        details.appendChild(createElement("h3", "", item.name));
        details.appendChild(
          createElement("p", "cart-item-price", formatPrice(item.price))
        );

        const controls = createElement("div", "quantity-controls");

        const decreaseButton = createElement("button", "", "−");
        decreaseButton.type = "button";
        decreaseButton.setAttribute("aria-label", `Decrease ${item.name} quantity`);

        const quantity = createElement(
          "span",
          "cart-item-quantity",
          String(item.quantity)
        );

        const increaseButton = createElement("button", "", "+");
        increaseButton.type = "button";
        increaseButton.setAttribute("aria-label", `Increase ${item.name} quantity`);

        decreaseButton.addEventListener("click", () => {
          const latestCart = getCart();
          const latestItem = latestCart.find((entry) => entry.id === item.id);
          if (!latestItem) return;

          latestItem.quantity -= 1;

          const updatedCart = latestCart.filter(
            (entry) => entry.quantity > 0
          );

          saveCart(updatedCart);
          render();
        });

        increaseButton.addEventListener("click", () => {
          const latestCart = getCart();
          const latestItem = latestCart.find((entry) => entry.id === item.id);
          if (!latestItem) return;

          latestItem.quantity += 1;
          saveCart(latestCart);
          render();
        });

        controls.append(decreaseButton, quantity, increaseButton);
        details.appendChild(controls);

        const itemTotal = createElement(
          "p",
          "cart-item-total",
          formatPrice(item.price * item.quantity)
        );

        const removeButton = createElement("button", "remove-item", "Remove");
        removeButton.type = "button";
        removeButton.addEventListener("click", () => {
          const updatedCart = getCart().filter(
            (entry) => entry.id !== item.id
          );
          saveCart(updatedCart);
          render();
          showToast(`${item.name} removed from your cart.`);
        });

        details.appendChild(removeButton);
        row.append(details, itemTotal);
        itemsContainer.appendChild(row);
      });

      const total = getCartTotal(cart);

      if (subtotalElement) subtotalElement.textContent = formatPrice(total);
      if (totalElement) totalElement.textContent = formatPrice(total);

      updateCartCount();
    }

    render();
  }

  /* ---------- Checkout summary ---------- */

  function renderCheckoutPage() {
    const itemsContainer = document.querySelector("[data-checkout-items]");
    const totalElement = document.querySelector("[data-checkout-total]");
    const emptyMessage = document.querySelector("[data-checkout-empty]");
    const checkoutForm = document.querySelector("[data-checkout-form]");

    if (!itemsContainer && !checkoutForm) return;

    function renderSummary() {
      const cart = getCart();

      if (itemsContainer) {
        itemsContainer.replaceChildren();

        cart.forEach((item) => {
          const row = createElement("div", "checkout-summary-item");
          const description = createElement(
            "span",
            "",
            `${item.name} × ${item.quantity}`
          );
          const price = createElement(
            "strong",
            "",
            formatPrice(item.price * item.quantity)
          );

          row.append(description, price);
          itemsContainer.appendChild(row);
        });
      }

      if (totalElement) {
        totalElement.textContent = formatPrice(getCartTotal(cart));
      }

      if (emptyMessage) {
        emptyMessage.hidden = cart.length > 0;
      }

      if (checkoutForm) {
        const submitButton = checkoutForm.querySelector(
          'button[type="submit"], button:not([type])'
        );

        if (submitButton) {
          submitButton.disabled = cart.length === 0;
        }
      }
    }

    renderSummary();

    if (checkoutForm) {
      checkoutForm.addEventListener("submit", (event) => {
        event.preventDefault();

        const cart = getCart();

        if (cart.length === 0) {
          showToast("Your cart is empty. Please add a product first.");
          renderSummary();
          return;
        }

        if (!checkoutForm.reportValidity()) return;

        const formData = new FormData(checkoutForm);
        const customer = {
          name: String(formData.get("name") || "").trim(),
          email: String(formData.get("email") || "").trim(),
          phone: String(formData.get("phone") || "").trim(),
          address: String(formData.get("address") || "").trim(),
          city: String(formData.get("city") || "").trim()
        };

        const order = {
          reference: "GN-" + Date.now().toString().slice(-8),
          customer,
          items: cart,
          total: getCartTotal(cart),
          createdAt: new Date().toISOString()
        };

        try {
          sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));
        } catch {
          showToast("Unable to save the demo order. Please try again.");
          return;
        }

        localStorage.removeItem(CART_KEY);
        window.location.href = "order-success.html";
      });
    }
  }

  /* ---------- Demo order confirmation page ---------- */

  function renderSuccessPage() {
    const successContainer = document.querySelector("[data-order-success]");
    if (!successContainer) return;

    let order = null;

    try {
      order = JSON.parse(sessionStorage.getItem(ORDER_KEY) || "null");
    } catch {
      order = null;
    }

    const orderNumber = document.querySelector("[data-order-number]");
    const customerName = document.querySelector("[data-customer-name]");
    const orderTotal = document.querySelector("[data-order-total]");

    if (!order) {
      successContainer.textContent = "";

      const heading = createElement("h1", "", "No demo order found");
      const message = createElement(
        "p",
        "",
        "Please add a product to your cart and complete the demo checkout first."
      );
      const link = createElement("a", "button button-primary", "Browse products");
      link.href = "index.html#shop";

      successContainer.append(heading, message, link);
      return;
    }

    if (orderNumber) {
      orderNumber.textContent = order.reference || "Demo order";
    }

    if (customerName) {
      customerName.textContent = order.customer?.name || "Customer";
    }

    if (orderTotal) {
      orderTotal.textContent = formatPrice(order.total);
    }
  }

  /* ---------- Start everything ---------- */

  document.addEventListener("DOMContentLoaded", () => {
    setupMenu();
    setupAddToCart();
    updateCartCount();
    renderCartPage();
    renderCheckoutPage();
    renderSuccessPage();
  });
})();
