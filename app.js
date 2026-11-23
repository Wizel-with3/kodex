/* ---------- Image galleries (one colour carousel per shoe) ---------- */
document.querySelectorAll(".image-gallery").forEach((gallery) => {
    const cards = [...gallery.querySelectorAll(".image-container")];
    const previousButton = gallery.querySelector(".previous-button");
    const nextButton = gallery.querySelector(".next-button");
    let currentIndex = 0;

    // Name of the shoe, used for accessible labels
    const shoeName = cards[0].querySelector("p").childNodes[0].textContent.trim();
    gallery.setAttribute("role", "group");
    gallery.setAttribute("aria-label", `${shoeName} colors`);

    // "1 of 5" indicator so people know there are more colors
    cards.forEach((card, index) => {
        const position = document.createElement("small");
        position.className = "color-position";
        position.textContent = `Color ${index + 1} of ${cards.length}`;
        card.querySelector(".buy-button").before(position);
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
            }
        });
        // Warm up the neighbours so the next click feels instant
        preload((currentIndex + 1) % cards.length);
        preload((currentIndex - 1 + cards.length) % cards.length);
    }

    if (cards.length < 2) {
        gallery.querySelector(".arrow-container").hidden = true;
    } else {
        previousButton.setAttribute("aria-label", `Previous ${shoeName} color`);
        nextButton.setAttribute("aria-label", `Next ${shoeName} color`);

        previousButton.addEventListener("click", () => {
            currentIndex = (currentIndex - 1 + cards.length) % cards.length;
            showCurrentCard();
        });

        nextButton.addEventListener("click", () => {
            currentIndex = (currentIndex + 1) % cards.length;
            showCurrentCard();
        });
    }

    showCurrentCard();
});

/* ---------- Cart ---------- */
const STORAGE_KEY = "shoe-cart";
const cart = new Map();
const cartCount = document.querySelector("#cartCount");
const cartItems = document.querySelector("#cartItems");
const cartEmpty = document.querySelector("#cartEmpty");
const clearCartButton = document.querySelector("#clearCart");

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
    cartItems.replaceChildren();
    cartEmpty.hidden = cart.size > 0;
    clearCartButton.disabled = cart.size === 0;

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
    button.dataset.label = button.textContent.trim();
    let resetTimer;

    button.addEventListener("click", () => {
        const card = button.closest(".image-container");
        const productName = card.querySelector("p").childNodes[0].textContent.trim();
        const color = card.dataset.color;
        const key = `${productName}::${color}`;
        const item = cart.get(key);

        if (item) {
            item.quantity += 1;
        } else {
            cart.set(key, { name: productName, color, quantity: 1 });
        }

        renderCart();

        // Reset from the stored label so rapid clicks can't leave the button stuck on "Added"
        clearTimeout(resetTimer);
        button.textContent = "Added to cart";
        resetTimer = setTimeout(() => {
            button.textContent = button.dataset.label;
        }, 1200);
    });
});

clearCartButton.addEventListener("click", () => {
    cart.clear();
    renderCart();
});

document.querySelector("#currentYear").textContent = new Date().getFullYear();
loadCart();
renderCart();

/* ---------- Navigation ---------- */
const navigation = document.querySelector("#mainNavigation");
navigation.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
        if (navigation.classList.contains("show")) {
            bootstrap.Collapse.getOrCreateInstance(navigation, { toggle: false }).hide();
        }
    });
});
