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
    // --- Clean URL Routing (Virtual Paths) ---
    // Handle initial page load if user arrives at /products, /about, /contact directly
    const path = window.location.pathname;
    const validPaths = ['/products', '/about', '/contact'];
    if (validPaths.includes(path)) {
        // Find corresponding section ID by stripping the leading slash
        const targetId = path.substring(1); 
        const target = document.getElementById(targetId);
        if (target) {
            // Scroll instantly on initial load
            setTimeout(() => target.scrollIntoView({ behavior: 'instant' }), 100);
        }
    }

    // Prevent the #hash from showing up, push clean virtual path instead
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const target = document.getElementById(targetId);
                
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                    // Update URL bar to look like a real page route (e.g. /contact)
                    window.history.pushState(null, '', '/' + targetId);
                }
            }
        });
    });

    // --- Application State ---
    // Load cart from localStorage or start empty if nothing exists
    let cart = JSON.parse(localStorage.getItem('dadbakery_cart')) || [];
    let totalPrice = 0;

    // --- DOM Elements ---
    const navCartBtn = document.getElementById("navCartBtn");
    const popup = document.getElementById("cartPopup");
    const cartItemsList = document.getElementById("cartItems");
    const closeCartBtn = document.getElementById("closeCart");
    const sendWhatsAppBtn = document.getElementById("sendWhatsApp");
    const productGrid = document.getElementById('productGrid');

    // Make sure critical elements exist before proceeding
    if (!navCartBtn || !popup) {
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

    // --- Firebase Product Loading ---

    /**
     * Builds a product card DOM element from a Firestore product object.
     */
    function createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'card' + (!product.inStock ? ' out-of-stock' : '');
        card.setAttribute('data-company', product.company || 'none');
        card.setAttribute('data-unit',    product.unit    || 'item');
        card.setAttribute('data-id',      product.id);

        card.innerHTML = `
            ${!product.inStock ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
            <img
                src="${product.imgSrc || ''}"
                alt="${product.name}"
                loading="lazy"
                decoding="async"
            >
            <div class="card-body">
                <h4>${product.name}</h4>
                <p>\u20B9${product.price}${product.unit ? '/' + product.unit : ''}</p>
                ${product.description ? `<p>${product.description}</p>` : ''}
                <div class="quantity-box"${!product.inStock ? ' style="display:none"' : ''}>
                    <button class="minus" aria-label="Decrease quantity">-</button>
                    <span class="qty">1</span>
                    <button class="plus" aria-label="Increase quantity">+</button>
                </div>
                <button class="add-to-cart"${!product.inStock ? ' disabled' : ''}>
                    ${product.inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
            </div>
        `;

        return card;
    }

    /**
     * Attaches quantity controls and add-to-cart logic to a rendered card.
     */
    function initCardListeners(card, product) {
        if (!product.inStock) return; // no interaction for out-of-stock items

        const plusBtn    = card.querySelector('.plus');
        const minusBtn   = card.querySelector('.minus');
        const qtyDisplay = card.querySelector('.qty');
        const addBtn     = card.querySelector('.add-to-cart');

        if (!addBtn) return;

        const name      = product.name;
        const unit      = product.unit    || 'item';
        const company   = product.company || 'none';
        const imgSrc    = product.imgSrc  || '';
        const price     = product.price   || 0;
        // Unique ID: combine name + image path (same logic as original)
        const productId = `${name}-${imgSrc}`;

        let currentQty = 1;

        if (plusBtn) plusBtn.addEventListener('click', () => {
            currentQty++;
            qtyDisplay.textContent = currentQty;
        });

        if (minusBtn) minusBtn.addEventListener('click', () => {
            if (currentQty > 1) { currentQty--; qtyDisplay.textContent = currentQty; }
        });

        addBtn.addEventListener('click', () => {
            const existingItem = cart.find(item => item.id === productId);

            if (existingItem) {
                existingItem.qty += currentQty;
            } else {
                cart.push({ id: productId, name, qty: currentQty, unit, price, company, imgSrc });
            }

            currentQty = 1;
            if (qtyDisplay) qtyDisplay.textContent = 1;

            renderCart();
            showToast(`\uD83D\uDED2 ${name} added to cart!`);

            // Animate badge
            const badge = navCartBtn.querySelector('.nav-cart-badge');
            const floatingEl = document.getElementById('floatingCartBtn');
            const floatingBadge = floatingEl ? floatingEl.querySelector('.nav-cart-badge') : null;
            const animKF = [
                { transform: 'scale(1)' },
                { transform: 'scale(1.6)', backgroundColor: 'var(--clr-primary)', color: '#fff' },
                { transform: 'scale(1)' }
            ];
            const animOpts = { duration: 400, easing: 'ease-out' };
            if (badge && typeof badge.animate === 'function') badge.animate(animKF, animOpts);
            if (floatingBadge && typeof floatingBadge.animate === 'function') floatingBadge.animate(animKF, animOpts);
        });
    }

    /**
     * Renders product cards from a products array and re-applies the active filter.
     */
    function renderProducts(products) {
        if (!productGrid) return;
        productGrid.innerHTML = '';

        if (products.length === 0) {
            productGrid.innerHTML = '<div class="products-loading">No products available right now.</div>';
            return;
        }

        // Sort products so Out of Stock items automatically go to the bottom
        const sortedProducts = [...products].sort((a, b) => {
            if (a.inStock === b.inStock) return 0;
            return a.inStock ? -1 : 1; // True (in-stock) comes before False (out-of-stock)
        });

        sortedProducts.forEach(product => {
            const card = createProductCard(product);
            productGrid.appendChild(card);
            initCardListeners(card, product);
        });

        filterProducts(); // Re-apply search / company filter after render
    }

    /**
     * Opens a real-time Firestore listener and renders products on every update.
     */
    function loadProducts() {
        if (!productGrid || typeof db === 'undefined') {
            console.warn('productGrid or Firebase db not available.');
            return;
        }

        db.collection('products').orderBy('name', 'asc').onSnapshot(snapshot => {
            const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderProducts(products);
        }, err => {
            console.error('Error loading products from Firestore:', err);
            if (productGrid) {
                productGrid.innerHTML = '<div class="products-loading">\u26A0\uFE0F Unable to load products. Please refresh the page.</div>';
            }
        });
    }

    // --- Cart Rendering Logic ---
    let checkoutStep = 1; // 1 = Cart Items, 2 = Customer Details

    /**
     * Updates the cart popup UI based on the current cart array state and checkoutStep.
     */
    function renderCart() {
        // Save current cart state to browser storage every time we update the UI
        localStorage.setItem('dadbakery_cart', JSON.stringify(cart));

        // Get layout elements
        const cartLayoutContainer = document.getElementById("cartLayoutContainer");
        const emptyCartContainer = document.getElementById("emptyCartContainer");
        const cartStep1 = document.getElementById("cartStep1");
        const cartStep2 = document.getElementById("cartStep2");
        const buyNowBtn = document.getElementById("buyNowBtn");
        const sendWhatsAppBtnNew = document.getElementById("sendWhatsApp");
        const backToCartBtn = document.getElementById("backToCartBtn");
        const cartHeaderTitle = document.getElementById("cartHeaderTitle");

        // Clear current list to prevent duplicates
        cartItemsList.innerHTML = "";
        totalPrice = 0;
        
        // Calculate total items for the badge
        const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
        
        // Update nav cart badge to show item count
        const navBadge = navCartBtn.querySelector('.nav-cart-badge');
        if (navBadge) navBadge.textContent = totalItems;
        
        const floatingCartBtn = document.getElementById("floatingCartBtn");
        const floatingBadge = floatingCartBtn ? floatingCartBtn.querySelector('.nav-cart-badge') : null;
        if (floatingBadge) floatingBadge.textContent = totalItems;

        if (cart.length === 0) {
            emptyCartContainer.innerHTML = `
                <div style='text-align:center; padding: 40px 20px; color: var(--clr-text-muted);'>
                    <div style='font-size: 3rem; margin-bottom: 15px;'>🛒</div>
                    <h3 style='color: var(--clr-primary-dark); margin-bottom: 10px;'>Your Cart is Empty</h3>
                    <p style='margin-bottom: 25px;'>Looks like you haven't added any delicious treats yet.</p>
                    <button id="continueShoppingBtn" class="btn buy-now-btn" style="padding: 10px 25px; width: auto;">Continue Shopping</button>
                </div>
            `;
            emptyCartContainer.style.display = "block";
            if (cartLayoutContainer) cartLayoutContainer.style.display = "none";

            const continueBtn = document.getElementById("continueShoppingBtn");
            if(continueBtn) {
                continueBtn.addEventListener('click', () => {
                    popup.classList.remove("show");
                    document.getElementById("products").scrollIntoView({ behavior: 'smooth' });
                });
            }
            return;
        }

        // We have items! Hide empty state, show layout
        emptyCartContainer.style.display = "none";
        if (cartLayoutContainer) cartLayoutContainer.style.display = "grid";

        // Render each item dynamically
        cart.forEach(item => {
            const itemTotal = item.price * item.qty;
            totalPrice += itemTotal;

            const li = document.createElement("li");
            li.className = "cart-item-wrapper";

            li.innerHTML = `
                <img src="${item.imgSrc || 'images/placeholder.png'}" class="cart-item-img" alt="${item.name}">
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-company">${item.company} &bull; ₹${item.price}/${item.unit}</div>
                    <div class="cart-item-controls-wrap">
                        <div class="cart-qty-controls">
                            <button class="cart-qty-btn decrease-btn" aria-label="Decrease quantity">−</button>
                            <span class="cart-qty-display">${item.qty}</span>
                            <button class="cart-qty-btn increase-btn" aria-label="Increase quantity">+</button>
                        </div>
                        <div class="cart-item-subtotal">₹${itemTotal}</div>
                    </div>
                </div>
                <button class="cart-remove-btn remove-btn" aria-label="Remove item from cart" title="Remove">×</button>
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
                // If cart is empty, naturally step resets back to 1
                if(cart.length === 0) checkoutStep = 1;
                renderCart();
            });

            cartItemsList.appendChild(li);
        });

        // Update Summary
        if(document.getElementById("summaryItems")) document.getElementById("summaryItems").textContent = totalItems;
        if(document.getElementById("summarySubtotal")) document.getElementById("summarySubtotal").textContent = `₹${totalPrice}`;
        if(document.getElementById("summaryTotal")) document.getElementById("summaryTotal").textContent = `₹${totalPrice}`;

        // Step Handling
        if (checkoutStep === 1) {
            cartHeaderTitle.textContent = "Your Cart";
            cartStep1.style.display = "block";
            cartStep2.style.display = "none";
            buyNowBtn.style.display = "block";
            sendWhatsAppBtnNew.style.display = "none";
            backToCartBtn.style.display = "none";
        } else if (checkoutStep === 2) {
            cartHeaderTitle.textContent = "Checkout";
            cartStep1.style.display = "none";
            cartStep2.style.display = "block";
            buyNowBtn.style.display = "none";
            sendWhatsAppBtnNew.style.display = "flex";
            backToCartBtn.style.display = "block";
        }
    }
    
    // Initialize cart count on load
    renderCart();
    // Load products from Firestore in real-time
    loadProducts();

    // --- Event Listeners for Cart Controls ---

    // Event: Open Cart Popup (via nav button)
    navCartBtn.addEventListener('click', (e) => {
        e.preventDefault();
        renderCart(); // Always ensure fresh data is shown
        popup.classList.add("show");
    });

    const floatingCartBtn = document.getElementById("floatingCartBtn");
    if (floatingCartBtn) {
        floatingCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            renderCart();
            popup.classList.add("show");
        });
    }

    // Event: Close Cart Popup
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', () => {
            popup.classList.remove("show");
        });
    }

    // Event: Buy Now (Step 1 -> Step 2)
    const buyNowBtn = document.getElementById("buyNowBtn");
    if (buyNowBtn) {
        buyNowBtn.addEventListener('click', () => {
            if (cart.length === 0) return;
            checkoutStep = 2;
            renderCart();
        });
    }

    // Event: Back to Cart (Step 2 -> Step 1)
    const backToCartBtn = document.getElementById("backToCartBtn");
    if (backToCartBtn) {
        backToCartBtn.addEventListener('click', () => {
            checkoutStep = 1;
            renderCart();
        });
    }

    // Event: Send WhatsApp Order
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
            const city = document.getElementById("checkoutCity").value.trim();
            const state = document.getElementById("checkoutState").value.trim();
            const pincode = document.getElementById("checkoutPincode").value.trim();
            
            const phoneError = document.getElementById("phoneError");

            let isValid = true;
            phoneError.style.display = "none";

            // Basic Validation
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
                // Scroll to top of the popup content so user sees error
                document.querySelector('.cart-popup-content').scrollTop = 0;
                return;
            }

            let message = `[New Bakery Order]\n\n`;
            message += `Name: ${name}\n`;
            message += `Phone: ${phone}\n`;
            message += `Address: ${address}\n`;
            if (city) message += `City: ${city}\n`;
            if (state) message += `State: ${state}\n`;
            if (pincode) message += `Pincode: ${pincode}\n`;
            message += `\n[Ordered Products]\n\n`;

            cart.forEach((item, index) => {
                const itemTotal = item.price * item.qty;
                message += `${index + 1}. ${item.name} × ${item.qty} - ₹${itemTotal}\n`;
            });

            message += `\n[Grand Total]: ₹${totalPrice}\n`;
            message += `\nThank you.`;

            const waUrl = `https://wa.me/917905520249?text=${encodeURIComponent(message)}`;
            
            // Auto-clear cart and close popup without prompting to avoid blocking window.open
            cart = [];
            checkoutStep = 1; // reset step
            renderCart();
            if(document.getElementById("checkoutForm")) {
                const inputs = document.getElementById("checkoutForm").querySelectorAll('input, textarea');
                inputs.forEach(input => input.value = '');
            }
            popup.classList.remove("show");

            window.open(waUrl, "_blank");
        });
    }


    // --- Live Search & Filter Feature ---
    const searchInput = document.getElementById("searchInput");
    const filterBtns = document.querySelectorAll(".filter-btn");
    let currentCompany = "all";

    function filterProducts() {
        const query    = searchInput ? searchInput.value.toLowerCase() : '';
        const allCards = document.querySelectorAll('.card'); // re-query after dynamic render

        allCards.forEach(card => {
            const nameEl = card.querySelector('h4');
            if (!nameEl) return;
            const productName = nameEl.innerText.toLowerCase();
            const cardCompany = (card.getAttribute('data-company') || 'none').toLowerCase();

            const matchesSearch  = productName.includes(query);
            const matchesCompany = currentCompany === 'all' || cardCompany === currentCompany;

            card.style.display = (matchesSearch && matchesCompany) ? '' : 'none';
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
    
    // --- Secret Admin Gesture ---
    // Tap the logo 5 times rapidly to open admin panel
    const siteLogo = header ? header.querySelector('h1') : null;
    if (siteLogo) {
        let tapCount = 0;
        let tapTimeout;
        siteLogo.addEventListener('click', () => {
            tapCount++;
            clearTimeout(tapTimeout);
            
            if (tapCount >= 5) {
                window.location.href = '/admin';
                tapCount = 0;
            }
            
            // Reset tap count after 1.5 seconds of inactivity
            tapTimeout = setTimeout(() => { tapCount = 0; }, 1500);
        });
    }
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
