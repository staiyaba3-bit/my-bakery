/**
 * Admin Panel Logic — My Bakery Store
 * Handles: Authentication, real-time product subscription, full CRUD.
 *
 * SETUP CHECKLIST (one-time, before using this panel):
 * ─────────────────────────────────────────────────────
 * 1. Firebase Console → Firestore Database → Rules tab → Paste & Publish:
 *
 *    rules_version = '2';
 *    service cloud.firestore {
 *      match /databases/{database}/documents {
 *        match /products/{productId} {
 *          allow read: if true;           // Public can read products
 *          allow write: if request.auth != null; // Only admin can write
 *        }
 *      }
 *    }
 *
 * 2. Firebase Console → Authentication → Users → Add User
 *    Enter your admin email + password. That's your login.
 *
 * 3. Open admin.html in your browser and log in.
 * 4. Click "Seed Initial Products" to populate the database from your original HTML.
 */

'use strict';

// Toggle password visibility
const EYE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;
const EYE_OFF_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>`;

window.togglePasswordVisibility = function(inputId, iconEl) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        iconEl.innerHTML = EYE_OFF_SVG;
        iconEl.title = 'Hide password';
    } else {
        input.type = 'password';
        iconEl.innerHTML = EYE_SVG;
        iconEl.title = 'Show password';
    }
};

// ============================================================
// SEED DATA — All products from the original index.html
// ============================================================
const SEED_PRODUCTS = [
    { name: "Millet Toast",              price: 755, unit: "Gatta",  company: "none",        imgSrc: "images/millet.jpeg",          description: "1 gatta (12 pcs)",          inStock: true },
    { name: "Khari",                     price: 685, unit: "Gatta",  company: "none",        imgSrc: "images/khari.jpeg",           description: "1 gatta (24 pcs)",          inStock: true },
    { name: "Maska Butter",              price: 550, unit: "Jhaal",  company: "none",        imgSrc: "images/butter.jpeg",          description: "1 jhaal (25 pcs)",          inStock: true },
    { name: "Star Cake",                 price: 65,  unit: "Packet", company: "star",        imgSrc: "images/cake 5rs.jpeg",        description: "650 rs gatta (10 pcs)",     inStock: true },
    { name: "Cake Jar",                  price: 120, unit: "Jar",    company: "star",        imgSrc: "images/cake 10 rs.jpeg",      description: "",                          inStock: true },
    { name: "Osmania Cookies",           price: 170, unit: "Jar",    company: "star",        imgSrc: "images/osmaniaa.jpeg",        description: "",                          inStock: true },
    { name: "Nankhatai Cookies",         price: 170, unit: "Jar",    company: "star",        imgSrc: "images/nankhatai.jpeg",       description: "",                          inStock: true },
    { name: "Fruit Cookies",             price: 170, unit: "Jar",    company: "star",        imgSrc: "images/fruit.jpeg",           description: "",                          inStock: true },
    { name: "Coconut Cookies",           price: 170, unit: "Jar",    company: "star",        imgSrc: "images/coconut.jpeg",         description: "",                          inStock: true },
    { name: "Chocolate Cookies",         price: 170, unit: "Jar",    company: "star",        imgSrc: "images/chocolate.jpeg",       description: "",                          inStock: true },
    { name: "Zeera Cookies",             price: 140, unit: "Jar",    company: "star",        imgSrc: "images/zeera.jpeg",           description: "",                          inStock: true },
    { name: "Pineapple Cookies",         price: 170, unit: "Jar",    company: "star",        imgSrc: "images/pineapple.jpeg",       description: "",                          inStock: true },
    { name: "Ajwain Cookies",            price: 170, unit: "Jar",    company: "star",        imgSrc: "images/ajwain.jpeg",          description: "",                          inStock: true },
    { name: "Star Khaja",                price: 160, unit: "Jar",    company: "star",        imgSrc: "images/khaja.jpeg",           description: "",                          inStock: true },
    { name: "Rohit Chikki",              price: 80,  unit: "Packet", company: "rohit",       imgSrc: "images/chikki.jpeg",          description: "",                          inStock: true },
    { name: "Cream Roll",                price: 50,  unit: "Packet", company: "rohit",       imgSrc: "images/creamroll.jpeg",       description: "",                          inStock: true },
    { name: "Rohit Jar Biscuit 1",       price: 120, unit: "Jar",    company: "rohit",       imgSrc: "images/rohit jar1.jpeg",      description: "",                          inStock: true },
    { name: "Rohit Jar Biscuit 2",       price: 120, unit: "Jar",    company: "rohit",       imgSrc: "images/rohit2.jpeg",          description: "",                          inStock: true },
    { name: "Rohit Jar Biscuit 3",       price: 120, unit: "Jar",    company: "rohit",       imgSrc: "images/rohit3.jpeg",          description: "",                          inStock: true },
    { name: "Rohit Jar Biscuit 4",       price: 120, unit: "Jar",    company: "rohit",       imgSrc: "images/rohit4.jpeg",          description: "",                          inStock: true },
    { name: "Rohit Jar Biscuit 5",       price: 120, unit: "Jar",    company: "rohit",       imgSrc: "images/rohit5.jpeg",          description: "",                          inStock: true },
    { name: "Rohit Jar Biscuit 6",       price: 120, unit: "Jar",    company: "rohit",       imgSrc: "images/rohit 7.jpeg",         description: "",                          inStock: true },
    { name: "Rohit Jar Biscuit 7",       price: 120, unit: "Jar",    company: "rohit",       imgSrc: "images/rohit6.jpeg",          description: "",                          inStock: true },
    { name: "Rohit Fine Jar",            price: 160, unit: "Jar",    company: "rohit",       imgSrc: "images/rohit fine jar.jpeg",  description: "",                          inStock: true },
    { name: "Good Morning 10rs Toast",   price: 260, unit: "Gatta",  company: "good morning",imgSrc: "images/toast 10rs.jpeg",      description: "260 rs gatta (30 pcs)",     inStock: true },
    { name: "Good Morning 20rs Toast",   price: 410, unit: "Gatta",  company: "good morning",imgSrc: "images/20rs toast.jpeg",      description: "420 rs gatta (24 pcs)",     inStock: true },
    { name: "Namkeen",                   price: 50,  unit: "Patta",  company: "good morning",imgSrc: "images/namkeen.jpeg",         description: "50 rs patta (12 pcs)",      inStock: true },
    { name: "Purest Fry Masala",         price: 33,  unit: "Box",    company: "mehran",      imgSrc: "images/purest fry.jpeg",      description: "MRP: 40",                   inStock: true },
    { name: "Mehran Biryani Masala",     price: 80,  unit: "Box",    company: "mehran",      imgSrc: "images/biryani.jpeg",         description: "",                          inStock: true },
    { name: "Bombay Biryani Masala",     price: 80,  unit: "Box",    company: "mehran",      imgSrc: "images/bombay.jpeg",          description: "",                          inStock: true },
    { name: "Hyderabadi Biryani Masala", price: 80,  unit: "Box",    company: "mehran",      imgSrc: "images/hyderabadi.jpeg",      description: "",                          inStock: true },
];

// ============================================================
// STATE
// ============================================================
let allProducts   = [];
let allCategories = []; // loaded from Firestore
let editingDocId  = null;
let deleteDocId   = null;

// ============================================================
// DOM REFS
// ============================================================
const $ = id => document.getElementById(id);

const loginScreen       = $('loginScreen');
const dashboard         = $('dashboard');
const loginForm         = $('loginForm');
const loginError        = $('loginError');
const loginBtn          = $('loginBtn');
const loginBtnText      = $('loginBtnText');
const adminEmailDisplay = $('adminEmailDisplay');
const productTableBody  = $('productTableBody');
const tableLoadingState = $('tableLoadingState');
const tableEmptyState   = $('tableEmptyState');
const statTotal         = $('statTotal');
const statInStock       = $('statInStock');
const statOutOfStock    = $('statOutOfStock');
const productModal      = $('productModal');
const deleteModal       = $('deleteModal');
const productForm       = $('productForm');
const adminSearch       = $('adminSearch');
const adminCompanyFilter= $('adminCompanyFilter');

// ============================================================
// CATEGORIES — Firestore + Dropdowns
// ============================================================

const DEFAULT_CATEGORIES = [
    { id: 'none',         label: 'Generic' },
    { id: 'star',         label: 'Star' },
    { id: 'rohit',        label: 'Rohit' },
    { id: 'good morning', label: 'Good Morning' },
    { id: 'mehran',       label: 'Mehran' },
];

// subscribeToCategories is defined below in the auth section (tracks unsubscribe handle)

function populateCategoryDropdowns() {
    // ── Filter dropdown ──
    const currentFilter = adminCompanyFilter.value;
    adminCompanyFilter.innerHTML = '<option value="all">All Categories</option>';
    allCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.label;
        adminCompanyFilter.appendChild(opt);
    });
    // Restore previous selection if still valid
    if ([...adminCompanyFilter.options].some(o => o.value === currentFilter)) {
        adminCompanyFilter.value = currentFilter;
    }

    // ── Product form dropdown ──
    const productCompanySelect = $('productCompany');
    const currentProd = productCompanySelect.value;
    productCompanySelect.innerHTML = '<option value="none">Generic / None</option>';
    allCategories.filter(c => c.id !== 'none').forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.label;
        productCompanySelect.appendChild(opt);
    });
    if ([...productCompanySelect.options].some(o => o.value === currentProd)) {
        productCompanySelect.value = currentProd;
    }

    // Also refresh categories list in the modal if it's open
    renderCategoriesList();
}

// ── Manage Categories Modal ──
const categoriesModal     = $('categoriesModal');
const categoriesList      = $('categoriesList');
const newCategoryInput    = $('newCategoryInput');

$('manageCategoriesBtn').addEventListener('click', () => {
    renderCategoriesList();
    categoriesModal.style.display = 'flex';
    newCategoryInput.focus();
});

function closeCategoriesModal() { categoriesModal.style.display = 'none'; }
$('categoriesModalCloseBtn').addEventListener('click', closeCategoriesModal);
$('categoriesModalDoneBtn').addEventListener('click', closeCategoriesModal);
categoriesModal.addEventListener('click', e => { if (e.target === categoriesModal) closeCategoriesModal(); });

function renderCategoriesList() {
    if (!categoriesList) return;
    if (allCategories.length === 0) {
        categoriesList.innerHTML = '<p class="cat-empty">No categories yet.</p>';
        return;
    }
    categoriesList.innerHTML = allCategories.map(cat => `
        <div class="cat-item">
            <span class="cat-item-label">${escHtml(cat.label)}</span>
            ${cat.id === 'none' ? '<span class="cat-item-badge">default</span>' : `
            <button class="cat-item-del" onclick="deleteCategory('${cat.docId}', '${escHtml(cat.label)}')" title="Delete">&times;</button>
            `}
        </div>
    `).join('');
}

$('addCategoryBtn').addEventListener('click', addCategory);
newCategoryInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addCategory(); } });

async function addCategory() {
    const raw   = newCategoryInput.value.trim();
    if (!raw) return;
    const label = raw.charAt(0).toUpperCase() + raw.slice(1);
    const id    = raw.toLowerCase();

    // Prevent duplicates
    if (allCategories.some(c => c.id === id)) {
        newCategoryInput.style.borderColor = 'var(--danger)';
        setTimeout(() => newCategoryInput.style.borderColor = '', 1500);
        return;
    }

    try {
        await db.collection('categories').add({ id, label });
        newCategoryInput.value = '';
    } catch (err) {
        console.error('Add category error:', err);
        alert('Failed to add category.');
    }
}

async function deleteCategory(docId, label) {
    // Check if any product uses this category
    const snap = await db.collection('products').where('company', '==',
        allCategories.find(c => c.docId === docId)?.id || '').limit(1).get();
    if (!snap.empty) {
        alert(`Cannot delete "${label}" — ${snap.size > 0 ? 'some' : 'a'} product(s) still use this category. Reassign them first.`);
        return;
    }
    if (!confirm(`Delete category "${label}"? This cannot be undone.`)) return;
    try {
        await db.collection('categories').doc(docId).delete();
    } catch (err) {
        console.error('Delete category error:', err);
        alert('Failed to delete category.');
    }
}

// ============================================================
// IMAGE UPLOAD UI
// ============================================================

const imgUploadArea    = $('imgUploadArea');
const imgPreviewWrap   = $('imgPreviewWrap');
const imgPlaceholder   = $('imgPlaceholder');
const imgPreview       = $('imgPreview');
const imgRemoveBtn     = $('imgRemoveBtn');
const imgFileInput     = $('productImgFile');
const imgUploadStatus  = $('imgUploadStatus');
const imgUploadProgress= $('imgUploadProgress');
const imgProgressBar   = $('imgProgressBar');

// Clicking anywhere in the upload area triggers the hidden file input
imgUploadArea.addEventListener('click', e => {
    if (e.target !== imgRemoveBtn) imgFileInput.click();
});

// Drag & Drop support
imgUploadArea.addEventListener('dragover', e => { e.preventDefault(); imgUploadArea.classList.add('drag-over'); });
imgUploadArea.addEventListener('dragleave', () => imgUploadArea.classList.remove('drag-over'));
imgUploadArea.addEventListener('drop', e => {
    e.preventDefault();
    imgUploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
});

imgFileInput.addEventListener('change', () => {
    if (imgFileInput.files[0]) handleImageFile(imgFileInput.files[0]);
});

imgRemoveBtn.addEventListener('click', () => resetImageUI());

function handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
        imgUploadStatus.textContent = '⚠️ Please select an image file (JPG, PNG, WEBP).'
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        imgUploadStatus.textContent = '⚠️ Image must be smaller than 5 MB.';
        return;
    }
    // Show preview using FileReader (instant, no upload yet)
    const reader = new FileReader();
    reader.onload = e => showImagePreview(e.target.result);
    reader.readAsDataURL(file);
    imgUploadStatus.textContent = '📎 Image ready. Will be uploaded when you save.';
}

function showImagePreview(src) {
    imgPreview.src = src;
    imgPreviewWrap.style.display = 'flex';
    imgPlaceholder.style.display = 'none';
}

function resetImageUI() {
    imgFileInput.value = '';
    imgPreview.src = '';
    imgPreviewWrap.style.display = 'none';
    imgPlaceholder.style.display = 'flex';
    $('productImgSrc').value = '';
    imgUploadStatus.textContent = '';
    imgUploadProgress.style.display = 'none';
    imgProgressBar.style.width = '0%';
}

// ============================================================
// AUTHENTICATION
// ============================================================

let unsubscribeCategories = null;

// ── Handle password reset redirect from Firebase email link ──
(async () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('passwordReset') === 'success') {
        // Clean URL so refreshing doesn't re-show the message
        window.history.replaceState({}, '', window.location.pathname);
        // If a stale session is still active, sign out so user must re-login
        if (auth.currentUser) {
            await auth.signOut();
        }
        // Show green success banner on login screen
        const loginError = $('loginError');
        loginError.textContent   = '✅ Password changed! Please log in with your new password.';
        loginError.style.cssText = 'display:block; color:#10b981; background:rgba(16,185,129,0.1); border-color:rgba(16,185,129,0.25);';
    }
})();

auth.onAuthStateChanged(user => {
    if (user) {
        loginScreen.style.display = 'none';
        dashboard.style.display   = 'flex';
        adminEmailDisplay.textContent       = user.email;
        $('adminDropdownEmail').textContent = user.email;
        subscribeToProducts();
        subscribeToCategories();
    } else {
        // Unsubscribe all listeners before hiding dashboard
        if (unsubscribeProducts)  { unsubscribeProducts();  unsubscribeProducts  = null; }
        if (unsubscribeCategories){ unsubscribeCategories(); unsubscribeCategories = null; }
        loginScreen.style.display = 'flex';
        dashboard.style.display   = 'none';
        // Reset login form state
        loginBtn.disabled        = false;
        loginBtnText.textContent = 'Sign In';
        loginError.style.display = 'none';
    }
});

// Wrap subscribeToCategories to track unsubscribe
const _origSubscribeToCategories = subscribeToCategories;
function subscribeToCategories() {
    unsubscribeCategories = db.collection('categories')
        .orderBy('label', 'asc')
        .onSnapshot(async snapshot => {
            if (snapshot.empty) {
                const batch = db.batch();
                DEFAULT_CATEGORIES.forEach(cat => {
                    const ref = db.collection('categories').doc();
                    batch.set(ref, { id: cat.id, label: cat.label });
                });
                await batch.commit();
                return;
            }
            allCategories = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
            populateCategoryDropdowns();
        }, err => console.error('Categories error:', err));
}

loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    loginError.style.display = 'none';
    loginBtn.disabled = true;
    loginBtnText.textContent = 'Signing in…';

    const email    = $('adminEmail').value.trim();
    const password = $('adminPassword').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
        loginError.style.display = 'block';
        loginError.textContent   = friendlyAuthError(err.code);
        loginBtn.disabled        = false;
        loginBtnText.textContent = 'Sign In';
    }
});

// ── Sign Out (improved: unsubscribes listeners before signing out) ──
$('logoutBtn').addEventListener('click', async () => {
    if (unsubscribeProducts)  { unsubscribeProducts();  unsubscribeProducts  = null; }
    if (unsubscribeCategories){ unsubscribeCategories(); unsubscribeCategories = null; }
    closeProfileDropdown();
    await auth.signOut();
});

// ── Forgot Password (login page) — Two-step confirmation ──
$('forgotPasswordBtn').addEventListener('click', () => {
    const email = $('adminEmail').value.trim();
    const forgotMsg = $('forgotMsg');
    const confirmBox = $('forgotConfirmBox');

    if (!email) {
        forgotMsg.textContent = '⚠️ Enter your email address above first.';
        forgotMsg.className   = 'forgot-msg error';
        forgotMsg.style.display = 'block';
        confirmBox.style.display = 'none';
        return;
    }
    // Show confirmation step
    $('forgotConfirmEmailText').textContent = email;
    confirmBox.style.display = 'block';
    forgotMsg.style.display  = 'none';
});

$('forgotCancelConfirmBtn').addEventListener('click', () => {
    $('forgotConfirmBox').style.display = 'none';
});

$('forgotSendBtn').addEventListener('click', async () => {
    const email     = $('adminEmail').value.trim();
    const forgotMsg = $('forgotMsg');
    const btn       = $('forgotSendBtn');
    btn.disabled = true; btn.textContent = 'Sending…';

    try {
        const continueUrl = window.location.origin + window.location.pathname + '?passwordReset=success';
        await auth.sendPasswordResetEmail(email, { url: continueUrl, handleCodeInApp: false });
        $('forgotConfirmBox').style.display = 'none';
        forgotMsg.textContent = `✅ Reset link sent to ${email}! Open that email, click the link, change your password — you'll be redirected back here automatically.`;
        forgotMsg.className   = 'forgot-msg success';
    } catch (err) {
        $('forgotConfirmBox').style.display = 'none';
        forgotMsg.textContent = err.code === 'auth/user-not-found'
            ? '❌ No account found with this email address.'
            : '❌ Could not send reset email. Please try again.';
        forgotMsg.className = 'forgot-msg error';
    }
    forgotMsg.style.display = 'block';
    btn.disabled = false; btn.textContent = 'Send Reset Link';
});

// ── Forgot Password (Change Password modal) — Two-step confirmation ──
$('forgotPasswordModalBtn').addEventListener('click', () => {
    const user = auth.currentUser;
    if (!user) return;
    $('forgotModalConfirmEmailText').textContent = user.email;
    $('forgotModalConfirmBox').style.display    = 'block';
    $('forgotPasswordModalMsg').style.display   = 'none';
});

$('forgotModalCancelBtn').addEventListener('click', () => {
    $('forgotModalConfirmBox').style.display = 'none';
});

$('forgotModalSendBtn').addEventListener('click', async () => {
    const user    = auth.currentUser;
    const modalMsg = $('forgotPasswordModalMsg');
    const btn      = $('forgotModalSendBtn');
    if (!user) return;
    btn.disabled = true; btn.textContent = 'Sending…';

    try {
        const continueUrl = window.location.origin + window.location.pathname + '?passwordReset=success';
        await auth.sendPasswordResetEmail(user.email, { url: continueUrl, handleCodeInApp: false });
        $('forgotModalConfirmBox').style.display = 'none';
        modalMsg.textContent = `✅ Reset link sent to ${user.email}! Open that email, click the link — you'll be redirected back here to log in with your new password.`;
        modalMsg.className   = 'forgot-msg success';
    } catch (err) {
        $('forgotModalConfirmBox').style.display = 'none';
        modalMsg.textContent = '❌ Failed to send reset email. Please try again.';
        modalMsg.className   = 'forgot-msg error';
    }
    modalMsg.style.display = 'block';
    btn.disabled = false; btn.textContent = 'Send Reset Link';
});

// ── Profile Dropdown ──
const adminProfileEl = $('adminProfile');
const adminDropdown  = $('adminDropdown');

function toggleProfileDropdown(e) {
    e.stopPropagation();
    adminDropdown.classList.toggle('open');
}
function closeProfileDropdown() {
    adminDropdown.classList.remove('open');
}

$('adminAvatarBtn').addEventListener('click', toggleProfileDropdown);
$('adminAvatarBtn2').addEventListener('click', toggleProfileDropdown);
$('adminChevron') && $('adminChevron').addEventListener('click', toggleProfileDropdown);
adminProfileEl.addEventListener('click', e => e.stopPropagation());
document.addEventListener('click', closeProfileDropdown);

// ── Account Settings Modal ──
const accountSettingsModal = $('accountSettingsModal');

$('accountSettingsBtn').addEventListener('click', () => {
    closeProfileDropdown();
    openAccountSettings();
});

function openAccountSettings() {
    // Reset all fields and messages
    ['newEmailInput','reAuthPasswordEmail','currentPasswordInput',
     'newPasswordInput','confirmPasswordInput'].forEach(id => { if ($(id)) $(id).value = ''; });
    ['emailSettingsMsg','passwordSettingsMsg'].forEach(id => { if ($(id)) { $(id).textContent = ''; $(id).className = 'settings-msg'; } });
    // Show email tab by default
    switchSettingsTab('email');
    accountSettingsModal.style.display = 'flex';
}

function closeAccountSettings() { accountSettingsModal.style.display = 'none'; }

$('accountSettingsCloseBtn').addEventListener('click', closeAccountSettings);
$('cancelAccountBtn').addEventListener('click', closeAccountSettings);
$('cancelAccountBtn2').addEventListener('click', closeAccountSettings);
accountSettingsModal.addEventListener('click', e => { if (e.target === accountSettingsModal) closeAccountSettings(); });

// Tabs
document.querySelectorAll('.settings-tab').forEach(btn => {
    btn.addEventListener('click', () => switchSettingsTab(btn.dataset.tab));
});

function switchSettingsTab(tab) {
    document.querySelectorAll('.settings-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    ['email','password'].forEach(t => {
        const panel = $('tab-' + t);
        if (panel) panel.style.display = (t === tab) ? 'block' : 'none';
    });
}

// Allow pressing Enter to submit settings forms
['newEmailInput', 'reAuthPasswordEmail'].forEach(id => {
    $(id).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('updateEmailBtn').click(); } });
});
['currentPasswordInput', 'newPasswordInput', 'confirmPasswordInput'].forEach(id => {
    $(id).addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); $('updatePasswordBtn').click(); } });
});

// Update email
$('updateEmailBtn').addEventListener('click', async () => {
    const newEmail = $('newEmailInput').value.trim();
    const pass     = $('reAuthPasswordEmail').value;
    const msgEl    = $('emailSettingsMsg');

    if (!newEmail || !pass) { showSettingsMsg(msgEl, 'error', 'Please fill in both fields.'); return; }
    
    // Validate Email Format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
        showSettingsMsg(msgEl, 'error', 'Please enter a valid email format (e.g., name@domain.com).');
        return;
    }

    const btn = $('updateEmailBtn');
    btn.disabled = true; btn.textContent = 'Updating…';

    try {
        const user = auth.currentUser;
        // Re-authenticate first
        const cred = firebase.auth.EmailAuthProvider.credential(user.email, pass);
        await user.reauthenticateWithCredential(cred);
        await user.verifyBeforeUpdateEmail(newEmail);
        showSettingsMsg(msgEl, 'success', `📧 Verification link sent to ${newEmail}. Your email stays unchanged until you click that link. If the address was wrong, nothing will happen.`);
        
        // Clear inputs
        $('newEmailInput').value = '';
        $('reAuthPasswordEmail').value = '';
    } catch (err) {
        showSettingsMsg(msgEl, 'error', friendlyAuthError(err.code) || err.message);
    } finally {
        btn.disabled = false; btn.textContent = 'Update Email';
    }
});

// Change password
$('updatePasswordBtn').addEventListener('click', async () => {
    const currentPass = $('currentPasswordInput').value;
    const newPass     = $('newPasswordInput').value;
    const confirmPass = $('confirmPasswordInput').value;
    const msgEl       = $('passwordSettingsMsg');

    if (!currentPass || !newPass || !confirmPass) { showSettingsMsg(msgEl, 'error', 'Please fill in all fields.'); return; }
    
    // Validate Password Strength
    if (newPass.length < 8) { 
        showSettingsMsg(msgEl, 'error', 'New password must be at least 8 characters long.'); 
        return; 
    }
    if (!/[a-zA-Z]/.test(newPass) || !/\d/.test(newPass)) {
        showSettingsMsg(msgEl, 'error', 'New password must contain both letters and numbers.'); 
        return;
    }

    if (newPass !== confirmPass) { showSettingsMsg(msgEl, 'error', 'New passwords do not match.'); return; }

    const btn = $('updatePasswordBtn');
    btn.disabled = true; btn.textContent = 'Updating…';

    try {
        const user = auth.currentUser;
        const cred = firebase.auth.EmailAuthProvider.credential(user.email, currentPass);
        await user.reauthenticateWithCredential(cred);
        await user.updatePassword(newPass);
        showSettingsMsg(msgEl, 'success', '✅ Password changed! Signing you out for security... Please log in with your new password.');
        $('currentPasswordInput').value = '';
        $('newPasswordInput').value     = '';
        $('confirmPasswordInput').value = '';
        // Auto sign-out after 2.5 seconds
        setTimeout(async () => {
            if (unsubscribeProducts)   { unsubscribeProducts();   unsubscribeProducts   = null; }
            if (unsubscribeCategories) { unsubscribeCategories(); unsubscribeCategories = null; }
            closeAccountSettings();
            await auth.signOut();
        }, 2500);
    } catch (err) {
        showSettingsMsg(msgEl, 'error', friendlyAuthError(err.code) || err.message);
    } finally {
        btn.disabled = false; btn.textContent = 'Change Password';
    }
});

function showSettingsMsg(el, type, text) {
    el.textContent  = text;
    el.className    = 'settings-msg ' + type;
}

function friendlyAuthError(code) {
    if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(code))
        return 'Invalid email or password. Please try again.';
    if (code === 'auth/too-many-requests')
        return 'Too many failed attempts. Please wait a few minutes.';
    return 'Login failed. Please check your credentials and try again.';
}

// ============================================================
// FIRESTORE REAL-TIME SUBSCRIPTION
// ============================================================

let unsubscribeProducts = null;

function subscribeToProducts() {
    tableLoadingState.style.display = 'block';
    tableEmptyState.style.display   = 'none';
    if (unsubscribeProducts) unsubscribeProducts();

    unsubscribeProducts = db.collection('products')
        .orderBy('name', 'asc')
        .onSnapshot(snapshot => {
            allProducts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            tableLoadingState.style.display = 'none';
            renderTable();
            updateStats();
        }, err => {
            console.error('Firestore error:', err);
            tableLoadingState.textContent = '⚠️ Error loading products. Check Firestore rules (see admin.js top comments).';
        });
}

// ============================================================
// RENDER TABLE
// ============================================================

function renderTable() {
    const query   = adminSearch.value.toLowerCase();
    const company = adminCompanyFilter.value;

    const filtered = allProducts.filter(p => {
        const matchName    = (p.name || '').toLowerCase().includes(query);
        const matchCompany = company === 'all' || p.company === company;
        return matchName && matchCompany;
    });

    tableEmptyState.style.display = filtered.length === 0 ? 'block' : 'none';

    productTableBody.innerHTML = filtered.map(p => {
        const companyLabel = (!p.company || p.company === 'none') ? 'Generic' : capitalize(p.company);
        const safeName     = escHtml(p.name);

        return `
        <tr>
            <td>
                <img
                    src="${escHtml(p.imgSrc || '')}"
                    alt="${safeName}"
                    class="table-prod-img"
                    onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2252%22 height=%2252%22%3E%3Crect width=%2252%22 height=%2252%22 fill=%22%23222%22/%3E%3Ctext x=%2226%22 y=%2230%22 text-anchor=%22middle%22 fill=%22%23555%22 font-size=%2211%22%3E?%3C/text%3E%3C/svg%3E'"
                >
            </td>
            <td>
                <div class="table-prod-name">${safeName}</div>
                ${p.description ? `<div class="table-prod-desc">${escHtml(p.description)}</div>` : ''}
            </td>
            <td>₹${p.price ?? '—'}</td>
            <td>${escHtml(p.unit || '—')}</td>
            <td>${companyLabel}</td>
            <td>
                <span class="stock-badge ${p.inStock ? 'in' : 'out'}">
                    ${p.inStock ? '● In Stock' : '● Out of Stock'}
                </span>
            </td>
            <td>
                <div class="row-actions">
                    ${p.inStock
                        ? `<button class="btn-action stock-out" onclick="toggleStock('${p.id}', true)">🚫 Out of Stock</button>`
                        : `<button class="btn-action stock-in"  onclick="toggleStock('${p.id}', false)">✅ In Stock</button>`
                    }
                    <button class="btn-action edit" onclick="openEditModal('${p.id}')">✏️ Edit</button>
                    <button class="btn-action del"  onclick="openDeleteModal('${p.id}', '${safeName.replace(/'/g, "\\'")}')">🗑️ Delete</button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function updateStats() {
    const total    = allProducts.length;
    const inStk    = allProducts.filter(p => p.inStock).length;
    statTotal.textContent       = total;
    statInStock.textContent     = inStk;
    statOutOfStock.textContent  = total - inStk;
    
    // Hide the Seed button if we already have products
    const seedBtn = $('seedBtn');
    if (seedBtn) {
        seedBtn.style.display = total > 0 ? 'none' : 'inline-block';
    }
}

adminSearch.addEventListener('input', renderTable);
adminCompanyFilter.addEventListener('change', renderTable);

// ============================================================
// ADD / EDIT MODAL
// ============================================================

$('addProductBtn').addEventListener('click', openAddModal);
$('modalCloseBtn').addEventListener('click', closeProductModal);
$('cancelModalBtn').addEventListener('click', closeProductModal);

productModal.addEventListener('click', e => { if (e.target === productModal) closeProductModal(); });

function openAddModal() {
    editingDocId = null;
    $('modalTitle').textContent = 'Add New Product';
    productForm.reset();
    $('productInStock').checked = true;
    resetImageUI();
    productModal.style.display = 'flex';
}

function openEditModal(docId) {
    const p = allProducts.find(x => x.id === docId);
    if (!p) return;

    editingDocId = docId;
    $('modalTitle').textContent    = 'Edit Product';
    $('productName').value         = p.name        || '';
    $('productPrice').value        = p.price        ?? '';
    $('productUnit').value         = p.unit         || '';
    $('productCompany').value      = p.company      || 'none';
    $('productImgSrc').value       = p.imgSrc       || '';
    $('productDescription').value  = p.description  || '';
    $('productInStock').checked    = p.inStock !== false;

    // Show existing image in preview if one is set
    resetImageUI();
    if (p.imgSrc) {
        showImagePreview(p.imgSrc);
        $('productImgSrc').value = p.imgSrc;
        imgUploadStatus.textContent = '✅ Current image shown above. Upload a new one to replace it.';
    }

    productModal.style.display = 'flex';
}

function closeProductModal() {
    productModal.style.display = 'none';
    editingDocId = null;
}

productForm.addEventListener('submit', async e => {
    e.preventDefault();
    const saveBtn = $('saveProductBtn');
    saveBtn.disabled    = true;
    saveBtn.textContent = 'Saving…';

    try {
        // ── Step 1: Upload new image if one was selected ──
        let finalImgUrl = $('productImgSrc').value; // existing URL or empty
        const file = imgFileInput.files[0];

        if (file && storage) {
            saveBtn.textContent = 'Uploading image…';
            imgUploadProgress.style.display = 'block';
            imgUploadStatus.textContent = '⏳ Uploading…';

            const ext      = file.name.split('.').pop();
            const fileName = `products/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
            const ref      = storage.ref().child(fileName);
            const task     = ref.put(file);

            await new Promise((resolve, reject) => {
                task.on('state_changed',
                    snap => {
                        const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
                        imgProgressBar.style.width = pct + '%';
                    },
                    reject,
                    resolve
                );
            });

            finalImgUrl = await ref.getDownloadURL();
            imgUploadProgress.style.display = 'none';
            imgUploadStatus.textContent = '✅ Image uploaded!';
        }

        // ── Step 2: Save product to Firestore ──
        saveBtn.textContent = 'Saving…';
        const data = {
            name:        $('productName').value.trim(),
            price:       parseInt($('productPrice').value, 10),
            unit:        $('productUnit').value.trim(),
            company:     $('productCompany').value,
            imgSrc:      finalImgUrl,
            description: $('productDescription').value.trim(),
            inStock:     $('productInStock').checked,
            updatedAt:   firebase.firestore.FieldValue.serverTimestamp(),
        };

        if (editingDocId) {
            await db.collection('products').doc(editingDocId).update(data);
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('products').add(data);
        }
        closeProductModal();

    } catch (err) {
        console.error('Save error:', err);
        imgUploadProgress.style.display = 'none';
        imgUploadStatus.textContent = '⚠️ ' + (err.message || 'Upload failed.');
        alert('Failed to save product.\nError: ' + (err.message || 'Unknown error'));
    } finally {
        saveBtn.disabled    = false;
        saveBtn.textContent = 'Save Product';
    }
});

// ============================================================
// DELETE
// ============================================================

function openDeleteModal(docId, productName) {
    deleteDocId = docId;
    $('deleteProductName').textContent = productName;
    deleteModal.style.display = 'flex';
}

$('cancelDeleteBtn').addEventListener('click', () => {
    deleteModal.style.display = 'none';
    deleteDocId = null;
});

deleteModal.addEventListener('click', e => {
    if (e.target === deleteModal) { deleteModal.style.display = 'none'; deleteDocId = null; }
});

$('confirmDeleteBtn').addEventListener('click', async () => {
    if (!deleteDocId) return;
    try {
        await db.collection('products').doc(deleteDocId).delete();
        deleteModal.style.display = 'none';
        deleteDocId = null;
    } catch (err) {
        console.error('Delete error:', err);
        alert('Failed to delete product. Check Firestore rules.');
    }
});

// ============================================================
// TOGGLE STOCK
// ============================================================

async function toggleStock(docId, currentlyInStock) {
    try {
        await db.collection('products').doc(docId).update({
            inStock:   !currentlyInStock,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
    } catch (err) {
        console.error('Toggle stock error:', err);
        alert('Failed to update stock status.');
    }
}

// ============================================================
// SEED DATABASE
// ============================================================

$('seedBtn').addEventListener('click', async () => {
    if (allProducts.length > 0) {
        const ok = confirm(
            `Your database already has ${allProducts.length} product(s).\n\n` +
            `Seeding will ADD ${SEED_PRODUCTS.length} more products on top — it will NOT replace existing ones.\n\n` +
            `Continue?`
        );
        if (!ok) return;
    }

    const btn = $('seedBtn');
    btn.disabled     = true;
    btn.textContent  = '⏳ Seeding…';

    try {
        const batch = db.batch();
        const now   = firebase.firestore.FieldValue.serverTimestamp();

        SEED_PRODUCTS.forEach(p => {
            const ref = db.collection('products').doc();
            batch.set(ref, { ...p, createdAt: now, updatedAt: now });
        });

        await batch.commit();
        btn.textContent = `✅ ${SEED_PRODUCTS.length} products added!`;
    } catch (err) {
        console.error('Seed error:', err);
        alert('Seeding failed. Make sure you are logged in and Firestore rules allow writes.');
    } finally {
        setTimeout(() => {
            btn.textContent = '🌱 Seed Initial Products';
            btn.disabled    = false;
        }, 3000);
    }
});

// ============================================================
// HELPERS
// ============================================================

function escHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
