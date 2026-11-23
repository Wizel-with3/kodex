/* ---------- Image galleries (one colour carousel per shoe) ---------- */
document.querySelectorAll(".image-gallery").forEach((gallery) => {
    const cards = [...gallery.querySelectorAll(".image-container")];
    let currentIndex = 0;

    // Name of the shoe, used for accessible labels
    const shoeName = cards[0].querySelector("p").childNodes[0].textContent.trim();
    gallery.setAttribute("role", "group");
    gallery.setAttribute("aria-label", `${shoeName} colors`);

    cards.forEach((card) => {
        card.querySelector(".color-position")?.remove();
    });

    const arrowContainer = gallery.querySelector(".arrow-container");
    arrowContainer.replaceChildren();
    arrowContainer.className = "color-cycle";

    const colorMap = {
        black: "#202124",
        white: "#ffffff",
        red: "#d52b2b",
        blue: "#2563eb",
        navy: "#172554",
        silver: "#a7adb4",
        gray: "#7b8086",
        grey: "#7b8086",
        brown: "#7a4a32",
        coffee: "#6f4e37",
        green: "#2f855a",
        "bright cobalt": "#0057d9",
        "electric pink": "#ec4899",
        khaki: "#c3b091",
        pepper: "#5b5b5b",
        orange: "#ea580c",
        yellow: "#eab308",
        gold: "#c5a047",
        pink: "#ec4899",
        bronze: "#a76d43",
        beige: "#d7c3a2",
    };

    function getColorSwatch(colorName) {
        const parts = colorName.toLowerCase().split(/\s*\/\s*/);
        const colors = parts.map((part) => {
            const direct = colorMap[part.trim()];
            if (direct) return direct;
            const matchedName = Object.keys(colorMap).find((name) => part.includes(name));
            return matchedName ? colorMap[matchedName] : "#c8cbd0";
        });

        if (colors.length === 1) return colors[0];
        if (colors.length === 2) {
            return `conic-gradient(from 90deg, ${colors[0]} 0deg 180deg, ${colors[1]} 180deg 360deg)`;
        }
        return `conic-gradient(${colors.map((color, index) =>
            `${color} ${Math.round((index * 360) / colors.length)}deg ${Math.round(((index + 1) * 360) / colors.length)}deg`
        ).join(", ")})`;
    }

    const dots = cards.map((card, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "color-dot";
        dot.style.setProperty("--swatch", getColorSwatch(card.dataset.color));
        dot.setAttribute("aria-label", `Show ${shoeName} color ${index + 1}: ${card.dataset.color}`);
        dot.addEventListener("click", () => {
            currentIndex = index;
            showCurrentCard();
        });
        arrowContainer.append(dot);
        return dot;
    });

    function preload(index) {
        const image = cards[index].querySelector("img");
        if (image && image.loading === "lazy") {
            image.loading = "eager";
        }
    }

    function showCurrentCard() {
        cards.forEach((card, index) => {
            const isCurrent = index === currentIndex;
            card.hidden = !isCurrent;

            if (isCurrent) {
                card.querySelector(".shoe-color").textContent = card.dataset.color;
                card.insertBefore(arrowContainer, card.querySelector(".buy-button"));
                if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                    card.classList.remove("color-changing");
                    void card.offsetWidth;
                    card.classList.add("color-changing");
                }
            }
        });
        dots.forEach((dot, index) => {
            const isCurrent = index === currentIndex;
            dot.classList.toggle("active", isCurrent);
            dot.setAttribute("aria-current", isCurrent ? "true" : "false");
        });
        // Warm up the neighbours so the next click feels instant
        preload((currentIndex + 1) % cards.length);
        preload((currentIndex - 1 + cards.length) % cards.length);
    }

    if (cards.length < 2) {
        arrowContainer.hidden = true;
    }

    showCurrentCard();
});

/* ---------- Cart ---------- */
const STORAGE_KEY = "shoe-cart";
const cart = new Map();
const cartCount = document.querySelector("#cartCount");
const cartCountMobile = document.querySelector("#cartCountMobile");
const cartItems = document.querySelector("#cartItems");
const cartEmpty = document.querySelector("#cartEmpty");
const clearCartButton = document.querySelector("#clearCart");
const checkoutCartButton = document.querySelector("#checkoutCart");

function loadCart() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
        saved.forEach(([key, item]) => {
            if (item && item.name && item.color && item.quantity > 0) {
                cart.set(key, item);
            }
        });
    } catch {
        /* storage unavailable or corrupted: start with an empty cart */
    }
}

function saveCart() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...cart]));
    } catch {
        /* ignore: the cart still works for this visit */
    }
}

function changeQuantity(key, delta) {
    const item = cart.get(key);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        cart.delete(key);
    }
    renderCart();
}

function createQuantityButton(label, text, onClick) {
    const button = document.createElement("button");
    button.className = "btn btn-sm btn-outline-secondary quantity-button";
    button.type = "button";
    button.textContent = text;
    button.setAttribute("aria-label", label);
    button.addEventListener("click", onClick);
    return button;
}

function renderCart() {
    const itemCount = [...cart.values()].reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = itemCount;
    cartCountMobile.textContent = itemCount;
    cartItems.replaceChildren();
    cartEmpty.hidden = cart.size > 0;
    clearCartButton.disabled = cart.size === 0;
    checkoutCartButton.disabled = cart.size === 0;

    cart.forEach((item, key) => {
        const row = document.createElement("li");
        row.className = "list-group-item d-flex justify-content-between align-items-center gap-3";

        const details = document.createElement("div");
        details.className = "me-auto";

        const name = document.createElement("div");
        name.className = "fw-semibold";
        name.textContent = item.name;

        const color = document.createElement("small");
        color.className = "text-secondary";
        color.textContent = item.color;

        const controls = document.createElement("div");
        controls.className = "d-flex align-items-center gap-2";

        const quantity = document.createElement("span");
        quantity.className = "quantity-value";
        quantity.textContent = item.quantity;
        quantity.setAttribute("aria-label", `Quantity ${item.quantity}`);

        const label = `${item.name} (${item.color})`;
        const removeButton = document.createElement("button");
        removeButton.className = "btn btn-sm btn-link text-secondary";
        removeButton.type = "button";
        removeButton.textContent = "Remove";
        removeButton.setAttribute("aria-label", `Remove ${label} from cart`);
        removeButton.addEventListener("click", () => {
            cart.delete(key);
            renderCart();
        });

        details.append(name, color);
        controls.append(
            createQuantityButton(`Decrease quantity of ${label}`, "\u2212", () => changeQuantity(key, -1)),
            quantity,
            createQuantityButton(`Increase quantity of ${label}`, "+", () => changeQuantity(key, 1)),
        );
        row.append(details, controls, removeButton);
        cartItems.append(row);
    });

    saveCart();
}

document.querySelectorAll(".buy-button").forEach((button) => {
    button.addEventListener("click", () => {
        const card = button.closest(".image-container");
        const productName = card.querySelector("p").childNodes[0].textContent.trim();
        const color = card.dataset.color;
        const image = card.querySelector("img");

        document.querySelector("#productInfoTitle").textContent = `${productName} details`;
        document.querySelector("#productInfoName").textContent = productName;
        document.querySelector("#productInfoColor").textContent = color;

        const infoImage = document.querySelector("#productInfoImage");
        infoImage.src = image.src;
        infoImage.alt = `${productName} in ${color}`;

        document.querySelector("#productInfoCartButton").dataset.name = productName;
        document.querySelector("#productInfoCartButton").dataset.color = color;

        bootstrap.Modal.getOrCreateInstance("#productInfoModal").show();
    });
});

document.querySelector("#productInfoCartButton").addEventListener("click", (event) => {
    const { name, color } = event.currentTarget.dataset;
    const key = `${name}::${color}`;
    const item = cart.get(key);

    if (item) {
        item.quantity += 1;
    } else {
        cart.set(key, { name, color, quantity: 1 });
    }

    renderCart();
    event.currentTarget.textContent = "Added to cart";
    clearTimeout(event.currentTarget.resetTimer);
    event.currentTarget.resetTimer = setTimeout(() => {
        event.currentTarget.textContent = "Add to cart";
    }, 1200);
});

clearCartButton.addEventListener("click", () => {
    cart.clear();
    renderCart();
});

checkoutCartButton.addEventListener("click", () => {
    if (cart.size === 0) return;

    const shoppingCartPanel = document.querySelector("#shoppingCart");
    const openOrderForm = () => {
        const orderFormFrame = document.querySelector("#orderFormFrame");
        if (orderFormFrame.getAttribute("src") === "about:blank") {
            orderFormFrame.src = orderFormFrame.dataset.src;
        }
        bootstrap.Modal.getOrCreateInstance(document.querySelector("#orderFormModal")).show();
    };

    shoppingCartPanel.addEventListener("hidden.bs.offcanvas", openOrderForm, { once: true });
    bootstrap.Offcanvas.getOrCreateInstance(shoppingCartPanel).hide();
});

document.querySelector("#currentYear").textContent = new Date().getFullYear();
loadCart();
renderCart();

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const revealItems = document.querySelectorAll(".image-gallery, .shoe-group h3, .airjordan-group h3");
    revealItems.forEach((item) => item.classList.add("reveal-ready"));

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12 });

    revealItems.forEach((item) => revealObserver.observe(item));
}

/* ---------- Navigation ---------- */
const navigation = document.querySelector("#mainNavigation");
navigation.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
        if (navigation.classList.contains("show")) {
            bootstrap.Collapse.getOrCreateInstance(navigation, { toggle: false }).hide();
        }
    });
});
