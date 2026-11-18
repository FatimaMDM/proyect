// Configuración extraída de tu consola
const firebaseConfig = {
  apiKey: "AIzaSyBdQgR-W1GMyzyMyzCX2qUf2UkEHRHMH1Q",
  authDomain: "verdevida-26b81.firebaseapp.com",
  projectId: "verdevida-26b81",
  storageBucket: "verdevida-26b81.firebasestorage.app",
  messagingSenderId: "330756269732",
  appId: "1:330756269732:web:c8eb289cf5f41fa5c06831",
  measurementId: "G-1J510X5RV3"
};

// Inicializar Firebase Auth
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', () => {

    // --- PRODUCTOS: se leen de Firestore (colección "productos") ---
    let productsDB = [];

    // Convierte un documento de Firestore al formato que usa la interfaz
    function docAProducto(doc) {
        const d = doc.data();
        return {
            id: doc.id,
            sku: d.sku || '',
            name: d.nombre,
            category: d.categoria,
            price: d.precio,
            originalPrice: d.precio_original || d.precio,
            discount: d.descuento || null,
            stock: d.stock || 0,
            desc: d.descripcion || '',
            spec: d.especificacion || '',
            img: d.imagen_url || ''
        };
    }

    async function cargarProductos() {
        if (productListContainer) {
            productListContainer.innerHTML = '<p style="width:100%; text-align:center; color:#777; padding:20px;">Cargando productos...</p>';
        }
        try {
            const snap = await db.collection('productos').where('estado', '==', 'activo').get();
            productsDB = snap.docs.map(docAProducto).sort((a, b) => a.id.localeCompare(b.id));
            if (productsDB.length === 0 && productListContainer) {
                productListContainer.innerHTML = '<p style="width:100%; text-align:center; color:#777; padding:20px;">Aún no hay productos en la base de datos. El administrador debe cargarlos desde cargar-datos.html.</p>';
                return;
            }
            renderProducts();
            updateCartUI();
            updateWishlistUI();
        } catch (err) {
            console.error('Error al cargar productos:', err);
            if (productListContainer) {
                productListContainer.innerHTML = '<p style="width:100%; text-align:center; color:#e74c3c; padding:20px;">No se pudieron cargar los productos. Revisa tu conexión e intenta de nuevo.</p>';
            }
        }
    }

    // --- ESTADO Y LOCALSTORAGE ---
    // v2: los ids ahora son los de Firestore (prod_001, prod_002...)
    localStorage.removeItem('vv_cart');
    localStorage.removeItem('vv_wishlist');
    // --- COOKIES Y ALMACENAMIENTO LOCAL ---
    // Necesarias (siempre): sesión de Firebase, aceptación de términos y la propia elección de cookies.
    // De preferencias (opcionales): recordar carrito y favoritos entre visitas.
    const COOKIES_VERSION = '1.0';
    function leerCookies() {
        try { return JSON.parse(localStorage.getItem('vv_cookies')); } catch (e) { return null; }
    }
    let cookiesElegidas = leerCookies();
    const recordarPreferencias = () => !!(cookiesElegidas && cookiesElegidas.preferencias);

    let cart = recordarPreferencias() ? (JSON.parse(localStorage.getItem('vv_cart_v2')) || []) : [];
    let wishlist = recordarPreferencias() ? (JSON.parse(localStorage.getItem('vv_wishlist_v2')) || []) : [];
    // Los usuarios ahora viven en Firebase Authentication (contraseñas con hash).
    // Se borran restos de la versión anterior que guardaba contraseñas en texto plano.
    localStorage.removeItem('vv_users');
    localStorage.removeItem('vv_current_user');
    let currentUser = null;
    
    let activeCoupon = null; // { codigo, valor } leído de la colección "cupones"

    // Revisa las reglas del cupón. Devuelve un mensaje de error o null si es válido.
    function validarCupon(c, subtotal, yaUsado) {
        if (!c) return 'Cupón inválido.';
        if (!c.activo) return 'Este cupón ya no está activo.';
        const hoy = new Date();
        if (c.fecha_inicio && c.fecha_inicio.toDate && hoy < c.fecha_inicio.toDate()) return 'Este cupón todavía no está vigente.';
        if (c.fecha_fin && c.fecha_fin.toDate && hoy > c.fecha_fin.toDate()) return 'Este cupón ya venció.';
        if (c.limite_usos && (c.usos || 0) >= c.limite_usos) return 'Este cupón ya alcanzó su límite de usos.';
        if (c.minimo_compra && subtotal < c.minimo_compra) return `Este cupón requiere una compra mínima de $${Number(c.minimo_compra).toFixed(2)} MXN.`;
        if (c.un_uso_por_cliente && yaUsado) return 'Ya usaste este cupón en una compra anterior.';
        return null;
    }

    function calcularDescuento(subtotal) {
        if (!activeCoupon) return 0;
        return Math.round(subtotal * activeCoupon.valor) / 100;
    }
    let shippingCost = 0;

    // --- ELEMENTOS DOM ---
    const productListContainer = document.getElementById('product-list');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const priceRange = document.getElementById('price-range');
    const priceVal = document.getElementById('price-val');
    const sortSelect = document.getElementById('sort-select');

    // Modales Carrito y Favoritos
    const cartIcon = document.getElementById('cart-icon');
    const cartModal = document.getElementById('cart-modal');
    const closeCart = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const cartDiscountEl = document.getElementById('cart-discount');
    const discountLine = document.getElementById('discount-line');
    const totalPriceEl = document.getElementById('total-price');

    const wishlistIcon = document.getElementById('wishlist-icon');
    const wishlistModal = document.getElementById('wishlist-modal');
    const closeWishlist = document.getElementById('close-wishlist');
    const wishlistItemsContainer = document.getElementById('wishlist-items');
    const wishlistCount = document.getElementById('wishlist-count');

    // Quickview
    const quickviewModal = document.getElementById('quickview-modal');
    const closeQuickview = document.getElementById('close-quickview');
    const quickviewContent = document.getElementById('quickview-content');

    // Auth
    const authModal = document.getElementById('auth-modal');
    const closeAuth = document.getElementById('close-auth');
    const tabLoginBtn = document.getElementById('tab-login-btn');
    const tabSignupBtn = document.getElementById('tab-signup-btn');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const resetForm = document.getElementById('reset-form');
    const userActionContainer = document.getElementById('user-action-container');
    const mobileLoginItem = document.getElementById('mobile-login-item');

    // Checkout
    const goToCheckoutBtn = document.getElementById('go-to-checkout-btn');
    const checkoutModal = document.getElementById('checkout-modal');
    const closeCheckout = document.getElementById('close-checkout');
    const step1Form = document.getElementById('checkout-step1');
    const step2Form = document.getElementById('checkout-step2');
    const nextToStep2Btn = document.getElementById('next-to-step2');
    const backToStep1Btn = document.getElementById('back-to-step1');
    const calcShippingBtn = document.getElementById('calc-shipping-btn');
    const applyCouponBtn = document.getElementById('apply-coupon-btn');
    const finalTotalCheckout = document.getElementById('final-total-checkout');

    const thankyouModal = document.getElementById('thankyou-modal');
    const closeThankyouBtn = document.getElementById('close-thankyou-btn');

    // --- INICIALIZACIÓN ---
    auth.onAuthStateChanged((user) => {
        currentUser = user ? { uid: user.uid, name: user.displayName || user.email, email: user.email } : null;
        updateUserHeaderUI();
        if (user) asegurarPerfil(user);
    });

    // Crea el documento usuarios/{uid} si no existe (cuentas creadas antes)
    async function asegurarPerfil(user, nombre) {
        try {
            const ref = db.collection('usuarios').doc(user.uid);
            const snap = await ref.get();
            if (snap.exists && snap.data().rol === 'admin' && currentUser && currentUser.uid === user.uid) {
                currentUser.isAdmin = true;
                updateUserHeaderUI();
            }
            if (!snap.exists) {
                await ref.set({
                    nombre: nombre || user.displayName || '',
                    email: user.email,
                    rol: 'cliente',
                    estado: 'activo',
                    fecha_registro: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        } catch (err) {
            console.error('No se pudo guardar el perfil:', err);
        }
    }

    cargarProductos();
    updateCartUI();
    updateWishlistUI();
    updateUserHeaderUI();

    // --- 1. RENDERIZADO DE PRODUCTOS Y BÚSQUEDA ---
    function renderProducts() {
        if (!productListContainer) return;

        const search = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const category = categoryFilter ? categoryFilter.value : 'all';
        const maxPrice = priceRange ? parseFloat(priceRange.value) : 500;
        const sort = sortSelect ? sortSelect.value : 'default';

        let filtered = productsDB.filter(p => {
            const matchesSearch = search === '' || 
                                  p.name.toLowerCase().includes(search) || 
                                  p.desc.toLowerCase().includes(search) ||
                                  p.category.toLowerCase().includes(search);
            const matchesCategory = (category === 'all') || (p.category === category);
            const matchesPrice = p.price <= maxPrice;
            return matchesSearch && matchesCategory && matchesPrice;
        });

        if (sort === 'low-high') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sort === 'high-low') {
            filtered.sort((a, b) => b.price - a.price);
        }

        productListContainer.innerHTML = '';

        if (filtered.length === 0) {
            productListContainer.innerHTML = '<p style="width:100%; text-align:center; color:#777; grid-column: 1 / -1; padding: 20px;">No se encontraron plantas que coincidan con tu búsqueda.</p>';
            return;
        }

        filtered.forEach(p => {
            const isWish = wishlist.some(id => id === p.id);
            const card = document.createElement('div');
            card.className = 'product';

            card.innerHTML = `
                ${p.discount ? `<span class="badge-offer">${p.discount}</span>` : ''}
                <div class="product-top-actions">
                    <button class="icon-btn wishlist-toggle" data-id="${p.id}">${isWish ? '❤️' : '🤍'}</button>
                    <button class="icon-btn quickview-btn" data-id="${p.id}">🔍</button>
                </div>
                <img src="${p.img}" alt="${p.name}">
                <h3>${p.name}</h3>
                <p>${p.desc}</p>
                <p style="font-size:12px; color:#888;">${p.spec}</p>
                <div class="stock-tag ${p.stock === 0 ? 'out-stock' : ''}">
                    ${p.stock > 0 ? `Stock disponible: ${p.stock}` : 'Agotado'}
                </div>
                <div>
                    ${p.discount ? `<span class="old-price">$${p.originalPrice}.00</span>` : ''}
                    <span class="span">$${p.price}.00</span>
                </div>
                <button type="button" class="btn-1 add-to-cart-btn" data-id="${p.id}" ${p.stock === 0 ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
                    ${p.stock > 0 ? 'Agregar' : 'Agotado'}
                </button>
            `;

            productListContainer.appendChild(card);
        });

        attachProductEvents();
    }

    function attachProductEvents() {
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                addToCart(id);
            });
        });

        document.querySelectorAll('.wishlist-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                toggleWishlist(id);
            });
        });

        document.querySelectorAll('.quickview-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                openQuickView(id);
            });
        });
    }

    if (searchInput) {
        const handleSearch = () => {
            renderProducts();
            const productosSection = document.getElementById('productos');
            if (productosSection && searchInput.value.length > 0) {
                productosSection.scrollIntoView({ behavior: 'smooth' });
            }
        };

        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
    }

    if (categoryFilter) categoryFilter.addEventListener('change', renderProducts);
    if (sortSelect) sortSelect.addEventListener('change', renderProducts);
    if (priceRange) {
        priceRange.addEventListener('input', (e) => {
            if (priceVal) priceVal.textContent = e.target.value;
            renderProducts();
        });
    }

    // --- 2. GESTIÓN DEL CARRITO ---
    function addToCart(productId, qty = 1) {
        const product = productsDB.find(p => p.id === productId);
        if (!product) return;

        const cartItem = cart.find(item => item.id === productId);
        const currentQtyInCart = cartItem ? cartItem.quantity : 0;

        if (currentQtyInCart + qty > product.stock) {
            alert(`¡Stock máximo alcanzado! Quedan ${product.stock} unidades de ${product.name}.`);
            return;
        }

        if (cartItem) {
            cartItem.quantity += qty;
        } else {
            cart.push({ id: product.id, name: product.name, price: product.price, quantity: qty, img: product.img, stock: product.stock });
        }

        saveCart();
        updateCartUI();
        if (wishlistModal) wishlistModal.style.display = 'none';
        if (cartModal) cartModal.style.display = 'flex';
    }

    function saveCart() {
        if (recordarPreferencias()) localStorage.setItem('vv_cart_v2', JSON.stringify(cart));
    }

    function updateCartUI() {
        if (!cartItemsContainer) return;
        cartItemsContainer.innerHTML = '';
        let subtotal = 0;
        let totalCount = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align:center; color:#777; margin-top:20px;">El carrito está vacío</p>';
        } else {
            cart.forEach((item, index) => {
                subtotal += item.price * item.quantity;
                totalCount += item.quantity;

                const itemDiv = document.createElement('div');
                itemDiv.style.cssText = 'display:flex; align-items:center; justify-content:space-between; margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid #eee;';

                itemDiv.innerHTML = `
                    <img src="${item.img}" style="width:45px; height:45px; object-fit:contain; border-radius:8px;">
                    <div style="flex:1; margin-left:10px;">
                        <h4 style="font-size:13px; color:#303030; margin:0;">${item.name}</h4>
                        <p style="font-size:12px; color:#555; margin:0;">$${item.price}.00 x ${item.quantity}</p>
                        <div style="display:flex; align-items:center; gap:5px; margin-top:5px;">
                            <button type="button" class="btn-qty-minus" data-index="${index}" style="padding:2px 6px; cursor:pointer;">-</button>
                            <span style="font-size:12px;">${item.quantity}</span>
                            <button type="button" class="btn-qty-plus" data-index="${index}" style="padding:2px 6px; cursor:pointer;">+</button>
                        </div>
                    </div>
                    <button type="button" class="remove-btn" data-index="${index}" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-size:18px;">&times;</button>
                `;

                cartItemsContainer.appendChild(itemDiv);
            });
        }

        let discountVal = calcularDescuento(subtotal);
        if (discountVal > 0) {
            if (discountLine) discountLine.style.display = 'flex';
            if (cartDiscountEl) cartDiscountEl.textContent = discountVal.toFixed(2);
        } else {
            if (discountLine) discountLine.style.display = 'none';
        }

        let total = subtotal - discountVal;

        if (cartSubtotalEl) cartSubtotalEl.textContent = subtotal.toFixed(2);
        if (totalPriceEl) totalPriceEl.textContent = total.toFixed(2);
        if (cartCount) cartCount.textContent = totalCount;

        attachCartControlEvents();
    }

    function attachCartControlEvents() {
        document.querySelectorAll('.btn-qty-plus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                const item = cart[idx];
                if (item.quantity + 1 > item.stock) {
                    alert(`Límite de inventario alcanzado (${item.stock} disponibles).`);
                    return;
                }
                item.quantity += 1;
                saveCart();
                updateCartUI();
            });
        });

        document.querySelectorAll('.btn-qty-minus').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                if (cart[idx].quantity > 1) {
                    cart[idx].quantity -= 1;
                } else {
                    cart.splice(idx, 1);
                }
                saveCart();
                updateCartUI();
            });
        });

        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.getAttribute('data-index'));
                cart.splice(idx, 1);
                saveCart();
                updateCartUI();
            });
        });
    }

    if (cartIcon && cartModal && closeCart) {
        cartIcon.addEventListener('click', () => {
            if (wishlistModal) wishlistModal.style.display = 'none';
            cartModal.style.display = 'flex';
        });
        closeCart.addEventListener('click', () => cartModal.style.display = 'none');
    }

    // --- 3. WISHLIST / FAVORITOS ---
    function toggleWishlist(id) {
        const index = wishlist.indexOf(id);
        if (index > -1) {
            wishlist.splice(index, 1);
        } else {
            wishlist.push(id);
        }
        if (recordarPreferencias()) localStorage.setItem('vv_wishlist_v2', JSON.stringify(wishlist));
        updateWishlistUI();
        renderProducts();
    }

    function updateWishlistUI() {
        if (wishlistCount) wishlistCount.textContent = wishlist.length;
        if (!wishlistItemsContainer) return;

        wishlistItemsContainer.innerHTML = '';

        if (wishlist.length === 0) {
            wishlistItemsContainer.innerHTML = '<p style="text-align:center; color:#777; margin-top:20px;">No tienes favoritos guardados aún.</p>';
            return;
        }

        wishlist.forEach(id => {
            const p = productsDB.find(prod => prod.id === id);
            if (!p) return;

            const itemDiv = document.createElement('div');
            itemDiv.style.cssText = 'display:flex; align-items:center; justify-content:space-between; margin-bottom:15px; padding-bottom:10px; border-bottom:1px solid #eee;';

            itemDiv.innerHTML = `
                <img src="${p.img}" style="width:45px; height:45px; object-fit:contain; border-radius:8px;">
                <div style="flex:1; margin-left:10px;">
                    <h4 style="font-size:13px; color:#303030; margin:0;">${p.name}</h4>
                    <p style="font-size:12px; color:#3A5A40; font-weight:600; margin:0;">$${p.price}.00</p>
                </div>
                <button type="button" class="btn-1 add-fav-to-cart" data-id="${p.id}" style="padding:4px 10px; font-size:11px; margin-right:8px;">+ Carrito</button>
                <button type="button" class="remove-wish-btn" data-id="${p.id}" style="background:none; border:none; color:#e74c3c; cursor:pointer; font-size:18px;">&times;</button>
            `;

            wishlistItemsContainer.appendChild(itemDiv);
        });

        document.querySelectorAll('.add-fav-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                addToCart(id);
            });
        });

        document.querySelectorAll('.remove-wish-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.getAttribute('data-id');
                toggleWishlist(id);
            });
        });
    }

    if (wishlistIcon && wishlistModal && closeWishlist) {
        wishlistIcon.addEventListener('click', () => {
            if (cartModal) cartModal.style.display = 'none';
            wishlistModal.style.display = 'flex';
        });
        closeWishlist.addEventListener('click', () => wishlistModal.style.display = 'none');
    }

    // --- 4. QUICK VIEW ---
    function openQuickView(id) {
        const p = productsDB.find(prod => prod.id === id);
        if (!p) return;

        quickviewContent.innerHTML = `
            <div style="display:flex; gap:20px; align-items:center; flex-wrap:wrap;">
                <img src="${p.img}" style="width:180px; height:180px; object-fit:contain; border-radius:15px;">
                <div style="flex:1; min-width:200px;">
                    <h3 style="font-size:22px; color:#303030;">${p.name}</h3>
                    <p style="color:#555; margin:10px 0;">${p.desc}</p>
                    <p style="font-size:12px; color:#888;"><strong>Especificación:</strong> ${p.spec}</p>
                    <p style="font-size:18px; color:#3A5A40; font-weight:700; margin:10px 0;">$${p.price}.00</p>
                    <button type="button" class="btn-1" id="qv-add-btn" ${p.stock === 0 ? 'disabled' : ''}>
                        ${p.stock > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
                    </button>
                </div>
            </div>
        `;

        quickviewModal.style.display = 'flex';

        const qvAddBtn = document.getElementById('qv-add-btn');
        if (qvAddBtn) {
            qvAddBtn.addEventListener('click', () => {
                addToCart(p.id);
                quickviewModal.style.display = 'none';
            });
        }
    }

    if (closeQuickview) closeQuickview.addEventListener('click', () => quickviewModal.style.display = 'none');

    // --- 5. AUTENTICACIÓN Y INTERFAZ DE USUARIO ---
    if (closeAuth) closeAuth.addEventListener('click', () => authModal.style.display = 'none');

    if (tabLoginBtn && tabSignupBtn) {
        tabLoginBtn.addEventListener('click', () => {
            tabLoginBtn.classList.add('active');
            tabSignupBtn.classList.remove('active');
            loginForm.classList.add('active-form');
            signupForm.classList.remove('active-form');
            if (resetForm) resetForm.classList.remove('active-form');
        });

        tabSignupBtn.addEventListener('click', () => {
            tabSignupBtn.classList.add('active');
            tabLoginBtn.classList.remove('active');
            signupForm.classList.add('active-form');
            loginForm.classList.remove('active-form');
            if (resetForm) resetForm.classList.remove('active-form');
        });
    }

    // Indicador de fortaleza de contraseña
    const signupPassInput = document.getElementById('signup-password');
    const strengthLevel = document.getElementById('strength-level');
    const strengthText = document.getElementById('strength-text');

    if (signupPassInput) {
        signupPassInput.addEventListener('input', (e) => {
            const val = e.target.value;
            let score = 0;
            if (val.length >= 6) score++;
            if (/[A-Z]/.test(val)) score++;
            if (/[0-9]/.test(val)) score++;

            if (score === 0) {
                if (strengthLevel) strengthLevel.style.width = '0%';
                if (strengthText) strengthText.textContent = '';
            } else if (score === 1) {
                if (strengthLevel) { strengthLevel.style.width = '33%'; strengthLevel.style.backgroundColor = '#e74c3c'; }
                if (strengthText) strengthText.textContent = 'Débil';
            } else if (score === 2) {
                if (strengthLevel) { strengthLevel.style.width = '66%'; strengthLevel.style.backgroundColor = '#f39c12'; }
                if (strengthText) strengthText.textContent = 'Media';
            } else {
                if (strengthLevel) { strengthLevel.style.width = '100%'; strengthLevel.style.backgroundColor = '#27ae60'; }
                if (strengthText) strengthText.textContent = 'Fuerte';
            }
        });
    }

    // Registro
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const pass = document.getElementById('signup-password').value;
            const confirm = document.getElementById('signup-confirm-password').value;

            if (pass !== confirm) {
                document.getElementById('signup-confirm-err').textContent = 'Las contraseñas no coinciden.';
                return;
            }

            document.getElementById('signup-confirm-err').textContent = '';
            document.getElementById('signup-email-err').textContent = '';

            auth.createUserWithEmailAndPassword(email, pass)
                .then((cred) => cred.user.updateProfile({ displayName: name }).then(() => cred.user))
                .then((user) => asegurarPerfil(user, name).then(() => user))
                .then((user) => {
                    currentUser = { uid: user.uid, name, email: user.email };
                    updateUserHeaderUI();
                    authModal.style.display = 'none';
                    signupForm.reset();
                })
                .catch((err) => {
                    document.getElementById('signup-email-err').textContent = traducirErrorAuth(err.code);
                });
        });
    }

    // Login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-password').value;

            document.getElementById('login-pass-err').textContent = '';

            auth.signInWithEmailAndPassword(email, pass)
                .then(() => {
                    authModal.style.display = 'none';
                    loginForm.reset();
                })
                .catch((err) => {
                    document.getElementById('login-pass-err').textContent = traducirErrorAuth(err.code);
                });
        });
    }

    // --- RECUPERAR CONTRASEÑA ---
    const forgotLink = document.getElementById('forgot-link');
    const backToLogin = document.getElementById('back-to-login');

    if (forgotLink && resetForm) {
        forgotLink.addEventListener('click', () => {
            loginForm.classList.remove('active-form');
            signupForm.classList.remove('active-form');
            resetForm.classList.add('active-form');
            const loginEmail = document.getElementById('login-email').value.trim();
            if (loginEmail) document.getElementById('reset-email').value = loginEmail;
        });
    }

    if (backToLogin) {
        backToLogin.addEventListener('click', () => {
            resetForm.classList.remove('active-form');
            loginForm.classList.add('active-form');
            tabLoginBtn.classList.add('active');
            tabSignupBtn.classList.remove('active');
        });
    }

    if (resetForm) {
        resetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('reset-email').value.trim();
            const msg = document.getElementById('reset-msg');
            const btn = document.getElementById('reset-btn');
            btn.disabled = true;
            msg.style.color = '#555';
            msg.textContent = 'Enviando...';

            auth.sendPasswordResetEmail(email)
                .then(() => {
                    // Mismo mensaje exista o no la cuenta, para no revelar qué correos están registrados
                    msg.style.color = '#27ae60';
                    msg.textContent = 'Si el correo está registrado, te llegará un enlace. Revisa también tu carpeta de spam.';
                })
                .catch((err) => {
                    if (err.code === 'auth/user-not-found') {
                        msg.style.color = '#27ae60';
                        msg.textContent = 'Si el correo está registrado, te llegará un enlace. Revisa también tu carpeta de spam.';
                    } else {
                        msg.style.color = '#e74c3c';
                        msg.textContent = traducirErrorAuth(err.code);
                    }
                })
                .finally(() => { btn.disabled = false; });
        });
    }

    // Mensajes de error comprensibles para el usuario
    function traducirErrorAuth(code) {
        const mensajes = {
            'auth/email-already-in-use': 'Este correo ya está registrado.',
            'auth/invalid-email': 'El correo no tiene un formato válido.',
            'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
            'auth/invalid-credential': 'Correo o contraseña incorrectos.',
            'auth/wrong-password': 'Correo o contraseña incorrectos.',
            'auth/user-not-found': 'Correo o contraseña incorrectos.',
            'auth/too-many-requests': 'Demasiados intentos. Espera unos minutos.',
            'auth/network-request-failed': 'Sin conexión. Revisa tu internet.',
            'auth/missing-email': 'Escribe tu correo electrónico.',
            'auth/operation-not-allowed': 'El inicio con correo no está activado en Firebase (Authentication > Sign-in method).',
            'auth/configuration-not-found': 'Authentication no está configurado en Firebase. Actívalo en la consola.',
            'auth/operation-not-supported-in-this-environment': 'Abre la página desde un servidor (Live Server o firebase serve), no con doble clic en el archivo.'
        };
        return mensajes[code] || `No se pudo completar la operación (${code}).`;
    }

    // Función unificada para actualizar el botón de sesión (PC y Móvil)
    function updateUserHeaderUI() {
        const firstName = currentUser ? (currentUser.name ? currentUser.name.split(' ')[0] : 'Usuario') : '';

        // 1. Render para escritorio
        if (userActionContainer) {
            if (currentUser) {
                userActionContainer.innerHTML = `
                    <span style="font-size:13px; font-weight:600; color:#3A5A40; margin-right:5px;">Hola, ${firstName}</span>
                    ${currentUser.isAdmin ? '<a href="admin.html" class="btn-auth-nav" style="text-decoration:none;">Panel</a>' : ''}
                    <button type="button" class="btn-auth-nav" id="btn-orders-desktop">Mis pedidos</button>
                    <button type="button" class="btn-auth-nav" id="btn-logout-desktop">Salir</button>
                `;
            } else {
                userActionContainer.innerHTML = `
                    <button type="button" class="btn-auth-nav" id="btn-login-desktop">Iniciar Sesión</button>
                `;
            }
        }

        // 2. Render para menú móvil hamburguesa
        if (mobileLoginItem) {
            if (currentUser) {
                mobileLoginItem.innerHTML = `${currentUser.isAdmin ? '<a href="admin.html">Panel administrativo</a>' : ''}<a href="javascript:void(0)" id="btn-orders-mobile">Mis pedidos</a><a href="javascript:void(0)" id="btn-logout-mobile">Cerrar Sesión (${firstName})</a>`;
            } else {
                mobileLoginItem.innerHTML = `<a href="javascript:void(0)" id="btn-login-mobile">Iniciar Sesión</a>`;
            }
        }

        // 3. Asignación de Eventos
        const openModal = () => {
            if (authModal) authModal.style.display = 'flex';
            const menuCheckbox = document.getElementById('menu');
            if (menuCheckbox) menuCheckbox.checked = false; // Cierra menú desplegable
        };

        const performLogout = () => {
            auth.signOut().finally(() => {
                currentUser = null;
                updateUserHeaderUI();
            });
        };

        const btnLoginDesktop = document.getElementById('btn-login-desktop');
        const btnLogoutDesktop = document.getElementById('btn-logout-desktop');
        const btnLoginMobile = document.getElementById('btn-login-mobile');
        const btnLogoutMobile = document.getElementById('btn-logout-mobile');

        if (btnLoginDesktop) btnLoginDesktop.addEventListener('click', openModal);
        if (btnLoginMobile) btnLoginMobile.addEventListener('click', openModal);
        if (btnLogoutDesktop) btnLogoutDesktop.addEventListener('click', performLogout);
        if (btnLogoutMobile) btnLogoutMobile.addEventListener('click', performLogout);
        const btnOrdersDesktop = document.getElementById('btn-orders-desktop');
        const btnOrdersMobile = document.getElementById('btn-orders-mobile');
        const openOrders = () => {
            const menuCheckbox = document.getElementById('menu');
            if (menuCheckbox) menuCheckbox.checked = false;
            abrirMisPedidos();
        };
        if (btnOrdersDesktop) btnOrdersDesktop.addEventListener('click', openOrders);
        if (btnOrdersMobile) btnOrdersMobile.addEventListener('click', openOrders);
    }

    // --- 6. CHECKOUT & PROCESO DE PAGO ---
    if (goToCheckoutBtn) {
        goToCheckoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('El carrito está vacío.');
                return;
            }

            if (!currentUser) {
                cartModal.style.display = 'none';
                authModal.style.display = 'flex';
                alert('Por favor, inicia sesión para continuar con tu compra.');
                return;
            }

            cartModal.style.display = 'none';
            irAlPaso1();
            checkoutModal.style.display = 'flex';
            updateCheckoutTotals();
        });
    }

    if (closeCheckout) closeCheckout.addEventListener('click', () => checkoutModal.style.display = 'none');

    // Calculadora de envíos
    if (calcShippingBtn) {
        calcShippingBtn.addEventListener('click', () => {
            const zip = document.getElementById('chk-zip').value.trim();
            if (!zip || zip.length < 5) {
                document.getElementById('shipping-result-msg').textContent = 'Ingresa un Código Postal válido (5 dígitos).';
                return;
            }

            shippingCost = (parseInt(zip.slice(-2)) % 2 === 0) ? 99 : 149;
            document.getElementById('shipping-result-msg').textContent = `Costo de envío para CP ${zip}: $${shippingCost}.00 MXN`;
            updateCheckoutTotals();
        });
    }

    // Cupón: se valida contra la colección "cupones" de Firestore
    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', async () => {
            const code = document.getElementById('coupon-code').value.trim().toUpperCase();
            const msg = document.getElementById('coupon-msg');
            if (!code) return;
            msg.style.color = '#555';
            msg.textContent = 'Validando cupón...';

            try {
                const snap = await db.collection('cupones').doc(code).get();
                const c = snap.exists ? snap.data() : null;
                let yaUsado = false;
                if (c && c.un_uso_por_cliente && auth.currentUser) {
                    const uso = await db.collection('cupones').doc(code).collection('usos').doc(auth.currentUser.uid).get();
                    yaUsado = uso.exists;
                }
                const subtotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                const error = validarCupon(c, subtotal, yaUsado);
                if (!error) {
                    activeCoupon = { codigo: code, valor: c.valor };
                    msg.style.color = '#27ae60';
                    msg.textContent = `¡Cupón ${code} aplicado! ${c.valor}% de descuento.`;
                } else {
                    activeCoupon = null;
                    msg.style.color = '#e74c3c';
                    msg.textContent = error;
                }
            } catch (err) {
                activeCoupon = null;
                msg.style.color = '#e74c3c';
                msg.textContent = 'No se pudo validar el cupón.';
            }

            updateCartUI();
            updateCheckoutTotals();
        });
    }

    function updateCheckoutTotals() {
        let subtotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
        let discount = calcularDescuento(subtotal);
        let finalTotal = subtotal - discount + shippingCost;

        if (finalTotalCheckout) finalTotalCheckout.textContent = finalTotal.toFixed(2);
        const sub = document.getElementById('sum-subtotal');
        const dis = document.getElementById('sum-discount');
        const shp = document.getElementById('sum-shipping');
        if (sub) sub.textContent = subtotal.toFixed(2);
        if (dis) dis.textContent = discount.toFixed(2);
        if (shp) shp.textContent = shippingCost.toFixed(2);
    }

    if (nextToStep2Btn) {
        nextToStep2Btn.addEventListener('click', () => {
            const addr = document.getElementById('chk-address').value;
            const zip = document.getElementById('chk-zip').value;

            if (!addr || !zip) {
                alert('Por favor completa la dirección y el código postal.');
                return;
            }
            if (shippingCost === 0) {
                alert('Calcula el costo de envío antes de continuar.');
                return;
            }
            updateCheckoutTotals();

            step1Form.classList.remove('active-step');
            step2Form.classList.add('active-step');
            document.getElementById('step1-indicator').classList.remove('active');
            document.getElementById('step2-indicator').classList.add('active');
        });
    }

    // Siempre que se abre el checkout empieza en el paso 1
    function irAlPaso1() {
        step2Form.classList.remove('active-step');
        step1Form.classList.add('active-step');
        document.getElementById('step2-indicator').classList.remove('active');
        document.getElementById('step1-indicator').classList.add('active');
    }

    if (backToStep1Btn) backToStep1Btn.addEventListener('click', irAlPaso1);

    let procesandoPedido = false; // evita doble clic / doble envío

    if (step2Form) {
        step2Form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (procesandoPedido) return;

            const acceptTerms = document.getElementById('accept-terms');
            const termsErr = document.getElementById('terms-err');
            if (acceptTerms && !acceptTerms.checked) {
                if (termsErr) termsErr.textContent = 'Debes aceptar los términos y el aviso de privacidad para continuar.';
                return;
            }
            if (termsErr) termsErr.textContent = '';

            procesandoPedido = true;
            const confirmBtn = document.getElementById('confirm-payment-btn');
            const btnText = document.getElementById('btn-text');
            const btnSpinner = document.getElementById('btn-spinner');
            if (confirmBtn) confirmBtn.disabled = true;
            if (btnText) btnText.style.display = 'none';
            if (btnSpinner) btnSpinner.style.display = 'inline-block';

            const metodo = document.getElementById('payment-method').value;

            const terminarCarga = () => {
                procesandoPedido = false;
                if (confirmBtn) confirmBtn.disabled = false;
                if (btnText) btnText.style.display = 'inline';
                if (btnSpinner) btnSpinner.style.display = 'none';
            };

            // Simulación de la pasarela de pago
            setTimeout(async () => {
                if (metodo === 'sandbox-rechazado') {
                    terminarCarga();
                    alert('Pago de prueba rechazado. No se generó el pedido y tu carrito se conserva.');
                    return;
                }

                try {
                    const folio = await crearPedido();

                    const orderDisplay = document.getElementById('order-number-display');
                    if (orderDisplay) orderDisplay.textContent = folio;

                    cart = [];
                    activeCoupon = null;
                    shippingCost = 0;
                    if (acceptTerms) acceptTerms.checked = false;
                    saveCart();
                    await cargarProductos(); // stock actualizado desde la BD

                    checkoutModal.style.display = 'none';
                    thankyouModal.style.display = 'flex';
                } catch (err) {
                    console.error(err);
                    if (err.message && err.message.startsWith('SIN_STOCK')) {
                        const [, nombre, disponible] = err.message.split('|');
                        alert(`No hay suficiente stock de "${nombre}". Disponibles: ${disponible}. Ajusta tu carrito.`);
                        await cargarProductos();
                    } else if (err.message && err.message.startsWith('CUPON|')) {
                        alert(err.message.split('|')[1] + ' Se quitó el cupón; revisa tu total e intenta de nuevo.');
                        activeCoupon = null;
                        const cm = document.getElementById('coupon-msg');
                        if (cm) cm.textContent = '';
                        updateCartUI();
                        updateCheckoutTotals();
                    } else if (err.message && err.message.startsWith('NO_EXISTE')) {
                        alert('Un producto de tu carrito ya no está disponible. Elimínalo e intenta de nuevo.');
                    } else {
                        alert('No se pudo registrar el pedido. Intenta de nuevo. (' + (err.code || err.message) + ')');
                    }
                } finally {
                    terminarCarga();
                }
            }, 1500);
        });
    }

    // Guarda pedido, detalle, envío y movimientos de inventario en UNA transacción.
    // Los precios y el stock se leen de Firestore, no del carrito del navegador.
    async function crearPedido() {
        const user = auth.currentUser;
        if (!user) throw new Error('SIN_SESION');

        const folio = 'VV-' + Date.now().toString(36).toUpperCase();
        const direccion = document.getElementById('chk-address').value.trim();
        const cp = document.getElementById('chk-zip').value.trim();
        const consent = JSON.parse(localStorage.getItem('vv_consent') || 'null');

        await db.runTransaction(async (tx) => {
            // 1) LECTURAS (Firestore exige leer todo antes de escribir)
            const refs = cart.map(item => db.collection('productos').doc(item.id));
            const snaps = await Promise.all(refs.map(r => tx.get(r)));

            let cuponData = null, cuponRef = null, usoRef = null, yaUsado = false;
            if (activeCoupon) {
                cuponRef = db.collection('cupones').doc(activeCoupon.codigo);
                usoRef = cuponRef.collection('usos').doc(user.uid);
                const cSnap = await tx.get(cuponRef);
                cuponData = cSnap.exists ? cSnap.data() : null;
                if (cuponData && cuponData.un_uso_por_cliente) yaUsado = (await tx.get(usoRef)).exists;
            }

            // 2) VALIDAR stock y calcular importes con datos de la BD
            let subtotal = 0;
            const partidas = snaps.map((snap, i) => {
                if (!snap.exists) throw new Error('NO_EXISTE|' + cart[i].name);
                const d = snap.data();
                const cantidad = cart[i].quantity;
                if (d.stock < cantidad) throw new Error(`SIN_STOCK|${d.nombre}|${d.stock}`);
                subtotal += d.precio * cantidad;
                return { ref: refs[i], d, cantidad };
            });

            // Se vuelve a validar el cupón con los precios reales de la BD
            if (cuponData) {
                const errorCupon = validarCupon(cuponData, subtotal, yaUsado);
                if (errorCupon) throw new Error('CUPON|' + errorCupon);
            }
            const descuento = cuponData ? Math.round(subtotal * cuponData.valor) / 100 : 0;
            const total = subtotal - descuento + shippingCost;
            const ahora = firebase.firestore.FieldValue.serverTimestamp();
            const pedidoRef = db.collection('pedidos').doc();

            // 3) ESCRITURAS
            tx.set(pedidoRef, {
                folio,
                id_usuario: user.uid,
                email: user.email,
                direccion_envio: { direccion, cp },
                subtotal,
                cupon: cuponData ? activeCoupon.codigo : null,
                descuento,
                costo_envio: shippingCost,
                total,
                moneda: 'MXN',
                estado: 'pagado',
                pago: { metodo: 'simulado', estado: 'aprobado', referencia: 'SIM-' + folio },
                aceptacion_terminos: {
                    version: consent ? consent.version : '1.0',
                    fecha_aceptacion: consent ? consent.fecha : new Date().toISOString()
                },
                fecha: ahora
            });

            if (cuponData) {
                tx.update(cuponRef, { usos: (cuponData.usos || 0) + 1 });
                if (cuponData.un_uso_por_cliente) {
                    tx.set(usoRef, { id_pedido: pedidoRef.id, folio, fecha: ahora });
                }
            }

            partidas.forEach(({ ref, d, cantidad }) => {
                const nuevoStock = d.stock - cantidad;
                tx.update(ref, { stock: nuevoStock });

                // Copia (snapshot) del producto para conservar el historial
                tx.set(db.collection('detalle_pedido').doc(), {
                    id_pedido: pedidoRef.id,
                    folio,
                    id_usuario: user.uid,
                    id_producto: ref.id,
                    sku: d.sku || '',
                    nombre: d.nombre,
                    precio_unitario: d.precio,
                    cantidad,
                    importe: d.precio * cantidad
                });

                tx.set(db.collection('movimientos_inventario').doc(), {
                    id_producto: ref.id,
                    tipo: 'salida',
                    cantidad,
                    stock_anterior: d.stock,
                    stock_nuevo: nuevoStock,
                    motivo: 'venta',
                    referencia: folio,
                    id_usuario: user.uid,
                    fecha: ahora
                });
            });

            tx.set(db.collection('envios').doc(), {
                id_pedido: pedidoRef.id,
                folio,
                id_usuario: user.uid,
                cp,
                costo: shippingCost,
                paqueteria: null,
                guia: null,
                estado: 'pendiente',
                fecha: ahora
            });
        });

        return folio;
    }

    // --- MIS PEDIDOS (historial del cliente) ---
    const ordersModal = document.getElementById('orders-modal');
    const closeOrders = document.getElementById('close-orders');
    const ordersList = document.getElementById('orders-list');

    // Escapa texto antes de ponerlo en HTML (evita inyección de código)
    function escHTML(v) {
        return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    const PLAZO_DEVOLUCION_DIAS = 30;      // macetas, herramientas y accesorios
    const ESTADOS_CANCELABLES = ['pagado', 'preparando'];
    const ETIQUETA_SOLICITUD = {
        solicitada: 'En revisión', aprobada: 'Aprobada', rechazada: 'Rechazada', completada: 'Completada'
    };
    let misDatos = { pedidos: [], detalles: [], solicitudes: [], envios: [] };

    async function abrirMisPedidos() {
        if (!auth.currentUser || !ordersModal) return;
        ordersModal.style.display = 'flex';
        ordersList.innerHTML = '<p style="color:#777;">Cargando pedidos...</p>';
        const uid = auth.currentUser.uid;
        try {
            const [sp, sd, ss, se] = await Promise.all([
                db.collection('pedidos').where('id_usuario', '==', uid).get(),
                db.collection('detalle_pedido').where('id_usuario', '==', uid).get(),
                db.collection('devoluciones').where('id_usuario', '==', uid).get(),
                db.collection('envios').where('id_usuario', '==', uid).get()
            ]);
            misDatos = {
                pedidos: sp.docs.map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => (b.fecha?.seconds || 0) - (a.fecha?.seconds || 0)),
                detalles: sd.docs.map(d => d.data()),
                solicitudes: ss.docs.map(d => ({ id: d.id, ...d.data() }))
                    .sort((a, b) => (b.fecha?.seconds || 0) - (a.fecha?.seconds || 0)),
                envios: se.docs.map(d => d.data())
            };
            pintarMisPedidos();
        } catch (err) {
            ordersList.innerHTML = '<p style="color:#e74c3c;">No se pudieron cargar tus pedidos.</p>';
            console.error(err);
        }
    }

    function pintarMisPedidos() {
        if (!misDatos.pedidos.length) {
            ordersList.innerHTML = '<p style="color:#777;">Todavía no tienes pedidos.</p>';
            return;
        }
        ordersList.innerHTML = misDatos.pedidos.map(p => {
            const sol = misDatos.solicitudes.find(s => s.id_pedido === p.id);
            const envio = misDatos.envios.find(e => e.id_pedido === p.id);
            let acciones = '';

            if (sol) {
                acciones = `
                    <div style="background:#f6f6f3; border-radius:8px; padding:8px 10px; margin-top:8px; font-size:12px;">
                        <strong>${sol.tipo === 'cancelacion' ? 'Cancelación' : 'Devolución'} ${escHTML(sol.folio)}:</strong>
                        ${escHTML(ETIQUETA_SOLICITUD[sol.estado] || sol.estado)}
                        ${sol.respuesta ? `<br>Respuesta: ${escHTML(sol.respuesta)}` : ''}
                        ${sol.monto_reembolso ? `<br>Reembolso: $${Number(sol.monto_reembolso).toFixed(2)} MXN` : ''}
                    </div>`;
            }
            const puedeSolicitar = !sol || sol.estado === 'rechazada';
            if (puedeSolicitar && ESTADOS_CANCELABLES.includes(p.estado)) {
                acciones += `<button type="button" class="btn-auth-nav" data-solicitar="cancelacion" data-pid="${escHTML(p.id)}" style="margin-top:8px;">Solicitar cancelación</button>`;
            }
            if (puedeSolicitar && p.estado === 'entregado') {
                const entrega = envio && envio.fecha_entrega && envio.fecha_entrega.toDate ? envio.fecha_entrega.toDate() : null;
                const dias = entrega ? (Date.now() - entrega.getTime()) / 86400000 : 0;
                if (dias <= PLAZO_DEVOLUCION_DIAS) {
                    acciones += `<button type="button" class="btn-auth-nav" data-solicitar="devolucion" data-pid="${escHTML(p.id)}" style="margin-top:8px;">Solicitar devolución</button>`;
                } else {
                    acciones += `<p style="font-size:12px; color:#777; margin-top:6px;">El plazo de devolución terminó. Para garantías escribe a atención al cliente.</p>`;
                }
            }
            const guia = envio && envio.guia ? `<br>Envío: ${escHTML(envio.paqueteria)} · Guía ${escHTML(envio.guia)}` : '';

            return `
                <div style="border:1px solid #eee; border-radius:10px; padding:12px; margin-bottom:10px; text-align:left;">
                    <strong style="color:#3A5A40;">${escHTML(p.folio)}</strong>
                    <span style="float:right; font-size:12px; background:#e3ebe1; padding:2px 10px; border-radius:10px;">${escHTML(p.estado)}</span>
                    <p style="font-size:13px; color:#555; margin:4px 0 0;">
                        ${p.fecha && p.fecha.toDate ? p.fecha.toDate().toLocaleString('es-MX') : 'Procesando...'}<br>
                        Total: $${Number(p.total).toFixed(2)} MXN${guia}
                    </p>
                    ${acciones}
                </div>`;
        }).join('');

        ordersList.querySelectorAll('[data-solicitar]').forEach(btn =>
            btn.addEventListener('click', () => abrirSolicitud(btn.dataset.pid, btn.dataset.solicitar)));
    }

    // --- SOLICITUD DE CANCELACIÓN O DEVOLUCIÓN ---
    const returnModal = document.getElementById('return-modal');
    const returnForm = document.getElementById('return-form');
    let solicitudPedido = null, solicitudTipo = null;

    const MOTIVOS = {
        cancelacion: [
            ['cambio de opinion', 'Ya no lo necesito / cambié de opinión'],
            ['error en el pedido', 'Me equivoqué de producto o cantidad'],
            ['error en direccion', 'La dirección de entrega es incorrecta'],
            ['otro', 'Otro motivo']
        ],
        devolucion: [
            ['danado en transporte', 'Llegó dañado por el transporte'],
            ['defectuoso', 'Producto defectuoso / planta enferma o marchita'],
            ['incorrecto', 'Recibí un producto diferente'],
            ['incompleto', 'Faltan productos en mi pedido'],
            ['arrepentimiento', 'Cambié de opinión (el envío de regreso lo pago yo)']
        ]
    };

    function abrirSolicitud(pedidoId, tipo) {
        solicitudPedido = misDatos.pedidos.find(p => p.id === pedidoId);
        solicitudTipo = tipo;
        if (!solicitudPedido) return;
        const partidas = misDatos.detalles.filter(d => d.id_pedido === pedidoId);

        document.getElementById('return-title').textContent =
            (tipo === 'cancelacion' ? 'Cancelar pedido ' : 'Devolver productos del pedido ') + solicitudPedido.folio;
        document.getElementById('return-motivo').innerHTML =
            '<option value="">Selecciona un motivo</option>' +
            MOTIVOS[tipo].map(([v, t]) => `<option value="${v}">${t}</option>`).join('');
        document.getElementById('return-descripcion').value = '';
        document.getElementById('return-err').textContent = '';

        const wrap = document.getElementById('return-productos');
        if (tipo === 'devolucion') {
            wrap.style.display = 'block';
            wrap.innerHTML = '<p style="font-size:13px; font-weight:600; margin-bottom:6px;">¿Qué productos quieres devolver?</p>' +
                partidas.map((d, i) => `
                    <label style="display:flex; gap:8px; align-items:center; font-size:13px; margin-bottom:6px; cursor:pointer;">
                        <input type="checkbox" value="${i}" style="width:auto;">
                        ${escHTML(d.cantidad)} × ${escHTML(d.nombre)} ($${Number(d.importe).toFixed(2)})
                    </label>`).join('');
            wrap.dataset.partidas = JSON.stringify(partidas);
        } else {
            wrap.style.display = 'none';
            wrap.innerHTML = '';
            wrap.dataset.partidas = JSON.stringify(partidas);
        }
        document.getElementById('return-aviso').innerHTML = tipo === 'cancelacion'
            ? 'Si se aprueba, recibirás el reembolso total al mismo medio de pago en 5 a 10 días hábiles.'
            : 'Para plantas, repórtalo dentro de las primeras 72 horas. Envía fotos a soporte@verdevida-demo.mx indicando tu folio. Consulta la <a href="politicas.html#devoluciones" target="_blank">política de devoluciones</a>.';
        returnModal.style.display = 'flex';
    }

    if (returnForm) {
        returnForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const err = document.getElementById('return-err');
            const motivo = document.getElementById('return-motivo').value;
            const descripcion = document.getElementById('return-descripcion').value.trim();
            const wrap = document.getElementById('return-productos');
            const todas = JSON.parse(wrap.dataset.partidas || '[]');

            let partidas = todas;
            if (solicitudTipo === 'devolucion') {
                const marcadas = [...wrap.querySelectorAll('input:checked')].map(c => Number(c.value));
                partidas = marcadas.map(i => todas[i]);
                if (!partidas.length) { err.textContent = 'Selecciona al menos un producto.'; return; }
            }
            if (!motivo) { err.textContent = 'Selecciona un motivo.'; return; }
            if (descripcion.length < 10) { err.textContent = 'Describe el problema (mínimo 10 caracteres).'; return; }

            const btn = document.getElementById('return-submit');
            btn.disabled = true;
            err.textContent = '';
            const prefijo = solicitudTipo === 'cancelacion' ? 'CAN-' : 'DEV-';
            const folio = prefijo + Date.now().toString(36).toUpperCase();
            try {
                await db.collection('devoluciones').add({
                    folio,
                    tipo: solicitudTipo,
                    id_pedido: solicitudPedido.id,
                    folio_pedido: solicitudPedido.folio,
                    id_usuario: auth.currentUser.uid,
                    email: auth.currentUser.email,
                    partidas: partidas.map(d => ({
                        id_producto: d.id_producto, nombre: d.nombre, sku: d.sku || '',
                        cantidad: d.cantidad, importe: d.importe
                    })),
                    motivo,
                    descripcion,
                    estado: 'solicitada',
                    historial: [{ estado: 'solicitada', fecha: new Date().toISOString(), nota: 'Solicitud del cliente' }],
                    fecha: firebase.firestore.FieldValue.serverTimestamp()
                });
                returnModal.style.display = 'none';
                alert(`Tu solicitud ${folio} fue registrada. Te responderemos en un máximo de 3 días hábiles. Puedes ver su estado en "Mis pedidos".`);
                await abrirMisPedidos();
            } catch (ex) {
                console.error(ex);
                err.textContent = 'No se pudo enviar la solicitud. Intenta de nuevo.';
            } finally {
                btn.disabled = false;
            }
        });
    }
    const closeReturn = document.getElementById('close-return');
    if (closeReturn) closeReturn.addEventListener('click', () => returnModal.style.display = 'none');

    if (closeOrders) closeOrders.addEventListener('click', () => ordersModal.style.display = 'none');

    if (closeThankyouBtn) {
        closeThankyouBtn.addEventListener('click', () => {
            thankyouModal.style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- AVISO DE COOKIES ---
    const cookieBanner = document.getElementById('cookie-banner');

    function guardarCookies(preferencias) {
        cookiesElegidas = { version: COOKIES_VERSION, necesarias: true, preferencias, fecha: new Date().toISOString() };
        localStorage.setItem('vv_cookies', JSON.stringify(cookiesElegidas));
        if (preferencias) {
            localStorage.setItem('vv_cart_v2', JSON.stringify(cart));
            localStorage.setItem('vv_wishlist_v2', JSON.stringify(wishlist));
        } else {
            // Al rechazar se borra lo que ya estuviera guardado
            localStorage.removeItem('vv_cart_v2');
            localStorage.removeItem('vv_wishlist_v2');
        }
        if (cookieBanner) cookieBanner.style.display = 'none';
    }

    if (cookieBanner && (!cookiesElegidas || cookiesElegidas.version !== COOKIES_VERSION)) {
        cookieBanner.style.display = 'flex';
    }
    const btnCookiesAceptar = document.getElementById('cookies-aceptar');
    const btnCookiesRechazar = document.getElementById('cookies-rechazar');
    if (btnCookiesAceptar) btnCookiesAceptar.addEventListener('click', () => guardarCookies(true));
    if (btnCookiesRechazar) btnCookiesRechazar.addEventListener('click', () => guardarCookies(false));
    const linkCookies = document.getElementById('link-preferencias-cookies');
    if (linkCookies) linkCookies.addEventListener('click', () => { if (cookieBanner) cookieBanner.style.display = 'flex'; });

    // --- AVISO INICIAL DE TÉRMINOS Y PRIVACIDAD ---
    const TERMS_VERSION = '1.0';
    const consentModal = document.getElementById('consent-modal');
    const consentBtn = document.getElementById('consent-accept-btn');
    const consentCheck = document.getElementById('consent-check');

    let consentSaved = null;
    try { consentSaved = JSON.parse(localStorage.getItem('vv_consent')); } catch (err) { consentSaved = null; }

    if (consentModal && (!consentSaved || consentSaved.version !== TERMS_VERSION)) {
        consentModal.style.display = 'flex';
    }

    if (consentBtn) {
        consentBtn.addEventListener('click', () => {
            if (!consentCheck.checked) {
                document.getElementById('consent-err').textContent = 'Marca la casilla para continuar.';
                return;
            }
            // Evidencia de aceptación: versión y fecha/hora
            localStorage.setItem('vv_consent', JSON.stringify({
                version: TERMS_VERSION,
                fecha: new Date().toISOString()
            }));
            consentModal.style.display = 'none';
        });
    }

    // Cierre general de modales al dar clic afuera
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) cartModal.style.display = 'none';
        if (e.target === wishlistModal) wishlistModal.style.display = 'none';
        if (e.target === quickviewModal) quickviewModal.style.display = 'none';
        if (e.target === authModal) authModal.style.display = 'none';
        if (e.target === checkoutModal) checkoutModal.style.display = 'none';
        if (e.target === thankyouModal) thankyouModal.style.display = 'none';
        if (e.target === ordersModal) ordersModal.style.display = 'none';
        if (e.target === returnModal) returnModal.style.display = 'none';
    });
});