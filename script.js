/**
 * Dad Bakery - Shopping Cart Logic
 * Refactored for stability, readability, and better cart management.
 */

// --- Preloader Logic ---
// We use 'load' event because it waits for ALL images and assets to finish downloading
window.addEventListener('load', () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        // A tiny 300ms delay ensures the animation feels deliberate and smooth
        setTimeout(() => {
            preloader.classList.add('hidden');
        }, 300);
    }
});

// Dedicated array for Gallery images
const galleryImages = [
    "gallery/image1.png",
    "gallery/image2.png",
    "gallery/image3.png",
    "gallery/image4.png",
    "gallery/image5.png"
];

document.addEventListener('DOMContentLoaded', () => {
    // --- Application State ---
    // Load cart from localStorage or start empty if nothing exists
    let cart = JSON.parse(localStorage.getItem('dadbakery_cart')) || [];
    let totalPrice = 0;

    // --- DOM Elements ---
    const viewCartBtn = document.getElementById("viewCartBtn");
    const popup = document.getElementById("cartPopup");
    const cartItemsList = document.getElementById("cartItems");
    const closeCartBtn = document.getElementById("closeCart");
    const sendWhatsAppBtn = document.getElementById("sendWhatsApp");
    const productCards = document.querySelectorAll('.card');

    // Make sure critical elements exist before proceeding
    if (!viewCartBtn || !popup) {
        console.error("Critical cart elements are missing from the DOM.");
        return;
    }

    // --- Toast Notification Logic ---
    let toastTimeout;
    function showToast(message) {
        let toast = document.getElementById("toast");
        if (!toast) {
            toast = document.createElement("div");
            toast.id = "toast";
            toast.className = "toast";
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add("show");

        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove("show");
        }, 3000);
    }

    // --- Product Cards Logic ---
    productCards.forEach(card => {
        // Query interactive elements within this specific card
        const plusBtn = card.querySelector('.plus');
        const minusBtn = card.querySelector('.minus');
        const qtyDisplay = card.querySelector('.qty');
        const addBtn = card.querySelector('.add-to-cart');
        
        // Query product details
        const nameEl = card.querySelector('h4');
        const imgEl = card.querySelector('img');
        const priceEl = card.querySelectorAll('p')[0]; // Assuming first <p> contains the price
        
        // Defensive programming: skip if this card is missing expected elements
        if (!plusBtn || !minusBtn || !qtyDisplay || !addBtn || !nameEl || !priceEl) return;

        // Extract static product info once to optimize performance
        const name = nameEl.innerText.trim();
        const unit = card.getAttribute("data-unit") || "item";
        const company = card.getAttribute("data-company") || "star";
        
        // UNIQUE ID CREATION: 
        // Since multiple products have the same name (e.g., "Rohit Jar Biscuit"), 
        // we combine the name and image source to create a unique identifier.
        const imgSrc = imgEl ? imgEl.getAttribute('src') : 'no-img';
        const productId = `${name}-${imgSrc}`; 
        
        // Extract numeric price from text (e.g., "₹140/jar" -> 140)
        const price = parseInt(priceEl.innerText.replace(/[^0-9]/g, ''), 10);

        let currentQty = 1;

        // Event: Increase quantity
        plusBtn.addEventListener('click', () => {
            currentQty++;
            qtyDisplay.textContent = currentQty;
        });

        // Event: Decrease quantity (prevents going below 1)
        minusBtn.addEventListener('click', () => {
            if (currentQty > 1) {
                currentQty--;
                qtyDisplay.textContent = currentQty;
            }
        });

        // Event: Add to Cart
        addBtn.addEventListener('click', () => {
            // Check if this exact item already exists in the cart array
            const existingItem = cart.find(item => item.id === productId);

            if (existingItem) {
                // If it exists, just increase the quantity
                existingItem.qty += currentQty;
            } else {
                // If it's a new item, add the object to the cart array
                cart.push({
                    id: productId,
                    name: name,
                    qty: currentQty,
                    unit: unit,
                    price: price,
                    company: company,
                    imgSrc: imgSrc
                });
            }

            // RESET UX: Reset the UI quantity box back to 1 after adding
            currentQty = 1;
            qtyDisplay.textContent = currentQty;

            renderCart(); // Update floating button badge immediately
            showToast(`🛒 ${name} added to cart!`);
            
            // Animate the cart badge using Web Animations API (JS only)
            const badge = viewCartBtn.querySelector('.cart-badge');
            if (badge && typeof badge.animate === 'function') {
                badge.animate([
                    { transform: 'scale(1)' },
                    { transform: 'scale(1.5)', backgroundColor: '#fff', color: 'var(--clr-accent)' },
                    { transform: 'scale(1)' }
                ], { duration: 400, easing: 'ease-out' });
            }
        });
    });

    // --- Cart Rendering Logic ---
    
    /**
     * Updates the cart popup UI based on the current cart array state.
     */
    function renderCart() {
        // Save current cart state to browser storage every time we update the UI
        localStorage.setItem('dadbakery_cart', JSON.stringify(cart));

        // Get elements
        const navCartBadge = document.querySelector(".nav-cart-badge");
        const orderSummary = document.getElementById("orderSummary");
        const checkoutForm = document.getElementById("checkoutForm");
        const sendWhatsAppBtnNew = document.getElementById("sendWhatsApp");

        // Clear current list to prevent duplicates
        cartItemsList.innerHTML = "";
        totalPrice = 0;
        
        // Calculate total items for the badges
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        
        // Update Floating Button text to show item count
        viewCartBtn.innerHTML = `🛒 View Cart <span class="cart-badge">${totalItems}</span>`;
        if(navCartBadge) navCartBadge.textContent = totalItems;

        if (cart.length === 0) {
            cartItemsList.innerHTML = `
                <div style='text-align:center; padding: 40px 20px; color: var(--clr-text-muted);'>
                    <div style='font-size: 3rem; margin-bottom: 15px;'>🛒</div>
                    <h3 style='color: var(--clr-primary-dark); margin-bottom: 10px;'>Your Cart is Empty</h3>
                    <p style='margin-bottom: 25px;'>Looks like you haven't added any delicious treats yet.</p>
                    <button id="continueShoppingBtn" class="btn" style="padding: 10px 25px;">Continue Shopping</button>
                </div>
            `;
            if (orderSummary) orderSummary.style.display = "none";
            if (checkoutForm) checkoutForm.style.display = "none";
            if (sendWhatsAppBtnNew) sendWhatsAppBtnNew.style.display = "none";

            const continueBtn = document.getElementById("continueShoppingBtn");
            if(continueBtn) {
                continueBtn.addEventListener('click', () => {
                    popup.classList.remove("show");
                    document.getElementById("products").scrollIntoView({ behavior: 'smooth' });
                });
            }
            return;
        }

        if (orderSummary) orderSummary.style.display = "block";
        if (checkoutForm) checkoutForm.style.display = "block";
        if (sendWhatsAppBtnNew) sendWhatsAppBtnNew.style.display = "block";

        // Render each item dynamically
        cart.forEach(item => {
            const itemTotal = item.price * item.qty;
            totalPrice += itemTotal;

            const li = document.createElement("li");
            li.className = "cart-item-wrapper";

            li.innerHTML = `
                <img src="${item.imgSrc || 'no-img'}" class="cart-item-img" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-company">${item.company}</div>
                    <div class="cart-item-controls-wrap">
                        <div>
                            <button class="cart-qty-btn decrease-btn" aria-label="Decrease quantity">-</button>
                            <span style="font-weight: 600; width: 20px; text-align: center; display: inline-block;">${item.qty}</span>
                            <button class="cart-qty-btn increase-btn" aria-label="Increase quantity">+</button>
                        </div>
                        <span style="font-size: 0.85rem; color: var(--clr-text-muted);">(₹${item.price}/${item.unit})</span>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; align-items: flex-end;">
                    <div class="cart-item-price" style="font-weight: 700; color: var(--clr-primary-dark); margin-bottom: 5px;">₹${itemTotal}</div>
                    <button class="cart-remove-btn remove-btn" aria-label="Remove item from cart" style="background: transparent; border: none; color: red; font-size: 0.8rem; cursor: pointer; text-decoration: underline;">Remove</button>
                </div>
            `;

            const decBtn = li.querySelector('.decrease-btn');
            decBtn.addEventListener('click', () => {
                if (item.qty > 1) {
                    item.qty--;
                    renderCart();
                }
            });

            const incBtn = li.querySelector('.increase-btn');
            incBtn.addEventListener('click', () => {
                item.qty++;
                renderCart();
            });

            const rmBtn = li.querySelector('.remove-btn');
            rmBtn.addEventListener('click', () => {
                cart = cart.filter(i => i.id !== item.id);
                renderCart();
            });

            cartItemsList.appendChild(li);
        });

        // Update Summary
        if(document.getElementById("summaryItems")) document.getElementById("summaryItems").textContent = cart.length;
        if(document.getElementById("summaryQty")) document.getElementById("summaryQty").textContent = totalItems;
        if(document.getElementById("summaryTotal")) document.getElementById("summaryTotal").textContent = `₹${totalPrice}`;
    }
    
    // Initialize cart state to show 0 on floating button on load
    renderCart();

    // --- Event Listeners for Cart Controls ---

    // Event: Open Cart Popup
    viewCartBtn.addEventListener('click', () => {
        renderCart(); // Always ensure fresh data is shown
        popup.classList.add("show");
    });

    // Event: Close Cart Popup
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', () => {
            popup.classList.remove("show");
        });
    }

    // Event: Send WhatsApp Order
    // Event: Send WhatsApp Order
    const confirmationModal = document.getElementById("confirmationModal");
    const cancelOrderBtn = document.getElementById("cancelOrderBtn");
    const confirmOrderBtn = document.getElementById("confirmOrderBtn");

    if (sendWhatsAppBtn) {
        sendWhatsAppBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                showToast("⚠️ Please add items to your cart first!");
                return;
            }

            // Validate Form
            const name = document.getElementById("checkoutName").value.trim();
            const phone = document.getElementById("checkoutPhone").value.trim();
            const address = document.getElementById("checkoutAddress").value.trim();
            const phoneError = document.getElementById("phoneError");

            let isValid = true;
            phoneError.style.display = "none";

            if (!name) { document.getElementById("checkoutName").style.borderColor = "red"; isValid = false; }
            else { document.getElementById("checkoutName").style.borderColor = ""; }

            if (!address) { document.getElementById("checkoutAddress").style.borderColor = "red"; isValid = false; }
            else { document.getElementById("checkoutAddress").style.borderColor = ""; }

            // Numeric check and min length 10
            const phoneRegex = /^[0-9]{10,}$/;
            if (!phoneRegex.test(phone)) { 
                document.getElementById("checkoutPhone").style.borderColor = "red"; 
                phoneError.style.display = "block";
                isValid = false; 
            } else { 
                document.getElementById("checkoutPhone").style.borderColor = ""; 
            }

            if (!isValid) {
                // Scroll to bottom of cart so user sees error
                document.querySelector('.cart-popup-content').scrollTop = document.querySelector('.cart-popup-content').scrollHeight;
                return;
            }

            const city = document.getElementById("checkoutCity").value.trim();
            const notes = document.getElementById("checkoutNotes").value.trim();

            let message = `🍞 New Bakery Order\n\n`;
            message += `👤 Name: ${name}\n`;
            message += `📞 Phone: ${phone}\n`;
            message += `📍 Address: ${address}\n`;
            if (city) message += `🏙️ City: ${city}\n`;
            message += `\n🛒 Ordered Products:\n\n`;

            cart.forEach((item, index) => {
                const itemTotal = item.price * item.qty;
                message += `${index + 1}. ${item.name} × ${item.qty} - ₹${itemTotal}\n`;
            });

            message += `\n💰 Grand Total: ₹${totalPrice}\n`;
            
            if (notes) {
                message += `\n📝 Special Instructions:\n${notes}\n`;
            }
            message += `\nThank you.`;

            const waUrl = `https://wa.me/917905520249?text=${encodeURIComponent(message)}`;
            
            // Auto-clear cart and close popup without prompting to avoid blocking window.open
            cart = [];
            renderCart();
            if(document.getElementById("checkoutForm")) document.getElementById("checkoutForm").reset();
            popup.classList.remove("show");

            window.open(waUrl, "_blank");
        });
    }

    // --- Nav Cart Logic ---
    const navCartBtn = document.getElementById('navCartBtn');
    if (navCartBtn) {
        navCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            renderCart();
            popup.classList.add("show");
        });
    }

    // --- Live Search & Filter Feature ---
    const searchInput = document.getElementById("searchInput");
    const filterBtns = document.querySelectorAll(".filter-btn");
    let currentCompany = "all";

    function filterProducts() {
        const query = searchInput ? searchInput.value.toLowerCase() : "";

        productCards.forEach(card => {
            const productName = card.querySelector("h4").innerText.toLowerCase();
            const cardCompany = (card.getAttribute("data-company") || "star").toLowerCase();
            
            const matchesSearch = productName.includes(query);
            const matchesCompany = currentCompany === "all" || cardCompany === currentCompany;
            
            if (matchesSearch && matchesCompany) {
                card.style.display = ""; // Reset to default (flex)
            } else {
                card.style.display = "none";
            }
        });
    }

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                filterBtns.forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                currentCompany = btn.getAttribute("data-company").toLowerCase();
                filterProducts();
            });
        });
    }

    if (searchInput) {
        searchInput.addEventListener("input", filterProducts);
    }

    // --- Professional Navbar Logic ---
    const header = document.getElementById('main-header');
    const menuBtn = document.getElementById('menuBtn');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    // 1. Mobile Hamburger Toggle
    if (menuBtn && navMenu) {
        menuBtn.addEventListener('click', () => {
            menuBtn.classList.toggle('open');
            navMenu.classList.toggle('open');
        });
    }

    // 2. Close mobile menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (menuBtn && menuBtn.classList.contains('open')) {
                menuBtn.classList.remove('open');
                navMenu.classList.remove('open');
            }
        });
    });

    // 3. Scroll Spy (Active Link) & Sticky Shadow
    if (header && sections.length > 0) {
        window.addEventListener('scroll', () => {
            // Add subtle shadow to header when scrolling down
            if (window.scrollY > 20) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            // Find out which section is currently in view
            let currentId = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                // We subtract 85 to account for the exact height of the sticky header
                if (window.scrollY >= (sectionTop - 85)) {
                    currentId = section.getAttribute('id');
                }
            });

            // Update active class on nav links
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (currentId && link.getAttribute('href') === `#${currentId}`) {
                    link.classList.add('active');
                }
            });
        });
    }

    // --- Contact Form Logic (EmailJS & WhatsApp) ---
    // Initialize EmailJS (Replace YOUR_PUBLIC_KEY with actual key from EmailJS dashboard)
    if (typeof emailjs !== "undefined") {
        emailjs.init({ publicKey: "YOUR_PUBLIC_KEY" });
    }

    const contactForm = document.getElementById("contactForm");
    const submitBtn = document.getElementById("submitBtn");
    const sendWhatsAppContact = document.getElementById("sendWhatsAppContact");
    const formFeedback = document.getElementById("formFeedback");

    function showFeedback(message, isError = false) {
        if (!formFeedback) return;
        formFeedback.style.display = "block";
        formFeedback.style.color = isError ? "red" : "green";
        formFeedback.innerText = message;
    }

    if (contactForm) {
        contactForm.addEventListener("submit", function(event) {
            event.preventDefault();
            if (submitBtn.disabled) return; // Prevent duplicate submissions

            // Change button state
            submitBtn.disabled = true;
            submitBtn.innerText = "Sending Email...";
            formFeedback.style.display = "none";

            // Prepare template params
            const templateParams = {
                user_name: document.getElementById("name").value,
                user_email: document.getElementById("email").value,
                user_phone: document.getElementById("phone").value || "N/A",
                subject: document.getElementById("subject").value || "General Inquiry",
                message: document.getElementById("message").value,
                to_email: "haqueimranul415@gmail.com"
            };

            // Send via EmailJS
            if (typeof emailjs !== "undefined") {
                // IMPORTANT: Replace YOUR_SERVICE_ID and YOUR_TEMPLATE_ID
                emailjs.send("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", templateParams)
                    .then(function(response) {
                        showFeedback("Email Sent Successfully!");
                        contactForm.reset();
                        submitBtn.disabled = false;
                        submitBtn.innerText = "Email Us";
                    }, function(error) {
                        showFeedback("Unable to send email right now. Please try again later or contact us via WhatsApp.", true);
                        submitBtn.disabled = false;
                        submitBtn.innerText = "Email Us";
                    });
            } else {
                showFeedback("Email service is currently unavailable.", true);
                submitBtn.disabled = false;
                submitBtn.innerText = "Email Us";
            }
        });
    }

    if (sendWhatsAppContact) {
        sendWhatsAppContact.addEventListener("click", function() {
            // Read form fields
            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();
            const phone = document.getElementById("phone").value.trim();
            const subject = document.getElementById("subject").value.trim();
            const message = document.getElementById("message").value.trim();

            if (!name || !message) {
                showFeedback("Please fill out your Name and Message to send via WhatsApp.", true);
                return;
            }

            // Create formatted message
            const waMessage = `🍞 New Bakery Inquiry\n\n👤 Name: ${name}\n📧 Email: ${email || "N/A"}\n📱 Phone: ${phone || "N/A"}\n📝 Subject: ${subject || "General Inquiry"}\n\n💬 Message:\n${message}\n\nThank you.`;

            // Open WhatsApp in new tab
            const waUrl = `https://wa.me/917905520249?text=${encodeURIComponent(waMessage)}`;
            window.open(waUrl, "_blank");
        });
    }

});