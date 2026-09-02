document.addEventListener('DOMContentLoaded', () => {

    // --- BASE DE DATOS DE PRODUCTOS ---

    const productsDB = [
    // --- PLANTAS DE INTERIOR ---
    {
        id: 1,
        name: "Monstera Deliciosa",
        category: "interior",
        price: 397,
        originalPrice: 450,
        discount: "12% OFF",
        stock: 8,
        desc: "Conocida como Costilla de Adán, destaca por sus imponentes hojas caladas.",
        spec: "Mediana de 68 x 25.4cm",
        img: "images/monstera deliciosa.jpg"
    },
    {
        id: 2,
        name: "Ficus Lyrata",
        category: "interior",
        price: 425,
        originalPrice: 425,
        discount: null,
        stock: 5,
        desc: "Higuera de hoja de violín, ideal para aportar estructura y elegancia en interiores.",
        spec: "Grande de 66cm x 20.32cm",
        img: "images/ficus.png"
    },
    {
        id: 3,
        name: "Pothos (Teléfono)",
        category: "interior",
        price: 120,
        originalPrice: 150,
        discount: "20% OFF",
        stock: 12,
        desc: "Planta colgante o trepadora de hojas acorazonadas y muy fácil cuidado.",
        spec: "Compacto de 25cm x 13cm",
        img: "images/pothos.png"
    },
    {
        id: 4,
        name: "Sansevieria",
        category: "interior",
        price: 140,
        originalPrice: 140,
        discount: null,
        stock: 15,
        desc: "Conocida como Lengua de Suegra, excelente purificadora de aire y muy resistente.",
        spec: "Mediana de 40cm x 15cm",
        img: "images/sanseveria.png"
    },

    // --- PLANTAS Y ÁRBOLES DE EXTERIOR ---
    {
        id: 7,
        name: "Limonero Persa",
        category: "exterior",
        price: 580,
        originalPrice: 650,
        discount: "10% OFF",
        stock: 6,
        desc: "Árbol frutal perfecto para patios y jardines iluminados. Produce limones todo el año.",
        spec: "Maceta de 5 litros / 1.2m altura",
        img: "images/limonero.png"
    },
    {
        id: 8,
        name: "Palmera Africana",
        category: "exterior",
        price: 750,
        originalPrice: 750,
        discount: null,
        stock: 4,
        desc: "Aporta un toque tropical e imponente a jardines de sol directo.",
        spec: "Maceta de 10 litros / 1.5m altura",
        img: "images/palmera.png"
    },
    {
        id: 9,
        name: "Rosemery (Romero)",
        category: "exterior",
        price: 95,
        originalPrice: 120,
        discount: "20% OFF",
        stock: 15,
        desc: "Arbusto aromático y medicinal, de sol directo y bajo consumo de agua.",
        spec: "Maceta de 18cm",
        img: "images/romero.png"
    },

    // --- FLORES Y JARDÍN ---
    {
        id: 5,
        name: "Hortensias",
        category: "flores",
        price: 320,
        originalPrice: 380,
        discount: "15% OFF",
        stock: 4,
        desc: "Flores de volumen vibrante y tonos intensos, perfectas para centro de mesa.",
        spec: "Manojo de 50cm",
        img: "images/hortencias.png"
    },
    {
        id: 10,
        name: "Rosal Rojo",
        category: "flores",
        price: 210,
        originalPrice: 250,
        discount: "16% OFF",
        stock: 9,
        desc: "Clásico rosal de exterior con floración abundante durante primavera y verano.",
        spec: "Maceta de 25cm",
        img: "images/rosal.png"
    },
    {
        id: 11,
        name: "Geranios Mixtos",
        category: "flores",
        price: 130,
        originalPrice: 130,
        discount: null,
        stock: 18,
        desc: "Planta de exterior súper resistente, de florecimiento continuo e intenso.",
        spec: "Maceta de 20cm",
        img: "images/geranios.png"
    },

    // --- SUCULENTAS Y CACTUS ---
    {
        id: 6,
        name: "Suculenta",
        category: "suculentas",
        price: 70,
        originalPrice: 70,
        discount: null,
        stock: 20,
        desc: "Detalle compacto y moderno, ideal para escritorios y repisas.",
        spec: "Mini de 10cm x 8cm",
        img: "images/suculentas.png"
    },
    {
        id: 12,
        name: "Cactus Órgano",
        category: "suculentas",
        price: 280,
        originalPrice: 320,
        discount: "12% OFF",
        stock: 7,
        desc: "Cactus vertical estilizado, perfecto para paisajismo moderno y bajo riego.",
        spec: "Maceta de 30cm / Altura 50cm",
        img: "images/cactus.png"
    },

    // --- MACETAS Y CONTENEDORES ---
    {
        id: 13,
        name: "Maceta de Cerámica Artesanal",
        category: "macetas",
        price: 310,
        originalPrice: 310,
        discount: null,
        stock: 10,
        desc: "Maceta de barro cocido con acabo esmaltado, incluye plato de drenaje.",
        spec: "25cm x 25cm",
        img: "images/maceta-ceramica.png"
    },
    {
        id: 14,
        name: "Maceta Colgante de Fibra de Coco",
        category: "macetas",
        price: 185,
        originalPrice: 220,
        discount: "15% OFF",
        stock: 14,
        desc: "Ideal para helechos y plantas trepadoras, excelente retención de humedad.",
        spec: "Diámetro 30cm",
        img: "images/maceta-colgante.png"
    },

    // --- SEMILLAS Y ACCESORIOS ---
    {
        id: 15,
        name: "Kit de Semillas Aromáticas",
        category: "semillas",
        price: 150,
        originalPrice: 150,
        discount: null,
        stock: 25,
        desc: "Incluye sobres de Menta, Albahaca, Cilantro y Perejil con guía de siembra.",
        spec: " Pack de 4 sobres",
        img: "images/semillas-aromaticas.png"
    },
    {
        id: 16,
        name: "Semillas de Girasol Gigante",
        category: "semillas",
        price: 65,
        originalPrice: 80,
        discount: "18% OFF",
        stock: 30,
        desc: "Semillas de germinación rápida para cultivar girasoles de hasta 2 metros.",
        spec: "Sobre de 50g",
        img: "images/semillas-girasol.png"
    },
    {
        id: 17,
        name: "Sustrato Preparado Nutritivo",
        category: "accesorios",
        price: 110,
        originalPrice: 110,
        discount: null,
        stock: 40,
        desc: "Mezcla balanceada de tierra de hoja, humus de lombriz y perlita para drenaje.",
        spec: "Bolsa de 5kg",
        img: "images/sustrato.png"
    },
    {
        id: 18,
        name: "Kit de Herramientas de Jardín",
        category: "accesorios",
        price: 340,
        originalPrice: 400,
        discount: "15% OFF",
        stock: 8,
        desc: "Incluye pala, trasplantador, rastrillo de mano y tijeras de podar ergonómicas.",
        spec: "Set de 4 piezas con estuche",
        img: "images/herramientas.png"
    },
    // --- NUEVA SUCULENTA / CACTUS ---
    {
        id: 19,
        name: "Echeveria Elegans",
        category: "suculentas",
        price: 85,
        originalPrice: 85,
        discount: null,
        stock: 18,
        desc: "Conocida como Rosa de Alabastro, destaca por sus rosetas de hojas azuladas.",
        spec: "Maceta de 12cm",
        img: "images/echeveria.png"
    },

    // --- NUEVA MACETA ---
    {
        id: 20,
        name: "Maceta de Auto-Riego Modern",
        category: "macetas",
        price: 260,
        originalPrice: 290,
        discount: "10% OFF",
        stock: 12,
        desc: "Sistema con indicador de nivel de agua que facilita el cuidado prolongado.",
        spec: "Mediana de 22cm x 20cm",
        img: "images/maceta-autoriego.png"
    },

    // --- NUEVAS SEMILLAS ---
    {
        id: 21,
        name: "Semillas de Lavanda Francesa",
        category: "semillas",
        price: 75,
        originalPrice: 90,
        discount: "16% OFF",
        stock: 22,
        desc: "Variedad de alta germinación para cultivar hermosas plantas aromáticas y de color violeta.",
        spec: "Sobre de 500 semillas",
        img: "images/semillas-lavanda.png"
    },

    // --- NUEVO SUSTRATO ---
    {
        id: 22,
        name: "Humus de Lombriz Orgánico",
        category: "accesorios",
        price: 95,
        originalPrice: 95,
        discount: null,
        stock: 35,
        desc: "Abono 100% natural rico en nutrientes para revitalizar el suelo de tus plantas.",
        spec: "Bolsa de 5kg",
        img: "images/humus-lombriz.png"
    },

    // --- NUEVA HERRAMIENTA ---
    {
        id: 23,
        name: "Regadera de Metal Vintage",
        category: "accesorios",
        price: 290,
        originalPrice: 340,
        discount: "14% OFF",
        stock: 9,
        desc: "Regadera de acero galvanizado con boquilla rociadora desmontable y acabado elegante.",
        spec: "Capacidad de 1.8 Litros",
        img: "images/regadera-vintage.png"
    },

    // --- NUEVAS PLANTAS DE EXTERIOR Y ÁRBOLES (2 Productos) ---
    {
        id: 24,
        name: "Olivo Europeo",
        category: "exterior",
        price: 790,
        originalPrice: 890,
        discount: "9% OFF",
        stock: 3,
        desc: "Árbol mediterráneo de follaje plateado, altamente resistente a la sequía y de larga vida.",
        spec: "Maceta de 10 litros / 1.3m altura",
        img: "images/olivo.png"
    },
    {
        id: 25,
        name: "Bougainvillea (Bugambilia)",
        category: "exterior",
        price: 240,
        originalPrice: 240,
        discount: null,
        stock: 11,
        desc: "Planta trepadora de exterior conocida por sus vibrantes flores en tonos fucsia.",
        spec: "Maceta de 25cm / 80cm altura",
        img: "images/bugambilia.png"
    }
];
    // --- ESTADO Y LOCALSTORAGE ---
    let cart = JSON.parse(localStorage.getItem('vv_cart')) || [];
    let wishlist = JSON.parse(localStorage.getItem('vv_wishlist')) || [];
    let users = JSON.parse(localStorage.getItem('vv_users')) || [];
    let currentUser = JSON.parse(localStorage.getItem('vv_current_user')) || null;
    
    let activeCoupon = null;
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
    const openAuthBtn = document.getElementById('open-auth-btn');
    const authModal = document.getElementById('auth-modal');
    const closeAuth = document.getElementById('close-auth');
    const tabLoginBtn = document.getElementById('tab-login-btn');
    const tabSignupBtn = document.getElementById('tab-signup-btn');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const userActionContainer = document.getElementById('user-action-container');

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
    renderProducts();
    updateCartUI();
    updateWishlistUI();
    updateUserHeaderUI();

    // --- 1. RENDERIZADO DE PRODUCTOS Y BÚSQUEDA CORREGIDA ---
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
                const id = parseInt(e.target.getAttribute('data-id'));
                addToCart(id);
            });
        });

        document.querySelectorAll('.wishlist-toggle').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                toggleWishlist(id);
            });
        });

        document.querySelectorAll('.quickview-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                openQuickView(id);
            });
        });
    }

    // LISTENER DE BÚSQUEDA Y FILTROS
    if (searchInput) {
        const handleSearch = () => {
            renderProducts();
            // Desplaza suavemente a la sección de productos si el usuario empieza a buscar
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
            priceVal.textContent = e.target.value;
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
        localStorage.setItem('vv_cart', JSON.stringify(cart));
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

        let discountVal = 0;
        if (activeCoupon === 'PROFE100') {
            discountVal = subtotal * 0.15;
            discountLine.style.display = 'flex';
            cartDiscountEl.textContent = discountVal.toFixed(2);
        } else {
            discountLine.style.display = 'none';
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
            wishlistModal.style.display = 'none';
            cartModal.style.display = 'flex';
        });
        closeCart.addEventListener('click', () => cartModal.style.display = 'none');
    }

    // --- 3. WISHLIST / VENTANA DE FAVORITOS ---
    function toggleWishlist(id) {
        const index = wishlist.indexOf(id);
        if (index > -1) {
            wishlist.splice(index, 1);
        } else {
            wishlist.push(id);
        }
        localStorage.setItem('vv_wishlist', JSON.stringify(wishlist));
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

        // Eventos en Wishlist Modal
        document.querySelectorAll('.add-fav-to-cart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                addToCart(id);
            });
        });

        document.querySelectorAll('.remove-wish-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                toggleWishlist(id);
            });
        });
    }

    if (wishlistIcon && wishlistModal && closeWishlist) {
        wishlistIcon.addEventListener('click', () => {
            cartModal.style.display = 'none';
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

    // --- 5. AUTENTICACIÓN ---
    if (openAuthBtn) {
        openAuthBtn.addEventListener('click', () => {
            if (currentUser) {
                currentUser = null;
                localStorage.removeItem('vv_current_user');
                updateUserHeaderUI();
            } else {
                authModal.style.display = 'flex';
            }
        });
    }

    if (closeAuth) closeAuth.addEventListener('click', () => authModal.style.display = 'none');

    if (tabLoginBtn && tabSignupBtn) {
        tabLoginBtn.addEventListener('click', () => {
            tabLoginBtn.classList.add('active');
            tabSignupBtn.classList.remove('active');
            loginForm.classList.add('active-form');
            signupForm.classList.remove('active-form');
        });

        tabSignupBtn.addEventListener('click', () => {
            tabSignupBtn.classList.add('active');
            tabLoginBtn.classList.remove('active');
            signupForm.classList.add('active-form');
            loginForm.classList.remove('active-form');
        });
    }

    // Indicador fortaleza contraseña
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
                strengthLevel.style.width = '0%';
                strengthText.textContent = '';
            } else if (score === 1) {
                strengthLevel.style.width = '33%';
                strengthLevel.style.backgroundColor = '#e74c3c';
                strengthText.textContent = 'Débil';
            } else if (score === 2) {
                strengthLevel.style.width = '66%';
                strengthLevel.style.backgroundColor = '#f39c12';
                strengthText.textContent = 'Media';
            } else {
                strengthLevel.style.width = '100%';
                strengthLevel.style.backgroundColor = '#27ae60';
                strengthText.textContent = 'Fuerte';
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

            if (users.find(u => u.email === email)) {
                document.getElementById('signup-email-err').textContent = 'Este correo ya está registrado.';
                return;
            }

            const newUser = { name, email, pass };
            users.push(newUser);
            localStorage.setItem('vv_users', JSON.stringify(users));

            currentUser = newUser;
            localStorage.setItem('vv_current_user', JSON.stringify(currentUser));

            updateUserHeaderUI();
            authModal.style.display = 'none';
            signupForm.reset();
        });
    }

    // Login
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-password').value;

            const found = users.find(u => u.email === email && u.pass === pass);

            if (!found) {
                document.getElementById('login-pass-err').textContent = 'Credenciales incorrectas.';
                return;
            }

            currentUser = found;
            localStorage.setItem('vv_current_user', JSON.stringify(currentUser));

            updateUserHeaderUI();
            authModal.style.display = 'none';
            loginForm.reset();
        });
    }

    function updateUserHeaderUI() {
        if (currentUser) {
            userActionContainer.innerHTML = `
                <span style="font-size:13px; font-weight:600; color:#3A5A40;">Hola, ${currentUser.name.split(' ')[0]}</span>
                <button type="button" class="btn-auth-nav" id="open-auth-btn">Salir</button>
            `;
        } else {
            userActionContainer.innerHTML = `
                <button type="button" class="btn-auth-nav" id="open-auth-btn">Iniciar Sesión</button>
            `;
        }

        const btn = document.getElementById('open-auth-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                if (currentUser) {
                    currentUser = null;
                    localStorage.removeItem('vv_current_user');
                    updateUserHeaderUI();
                } else {
                    authModal.style.display = 'flex';
                }
            });
        }
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
            checkoutModal.style.display = 'flex';
            updateCheckoutTotals();
        });
    }

    if (closeCheckout) closeCheckout.addEventListener('click', () => checkoutModal.style.display = 'none');

    // Calculadora Envíos
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

    // Cupón PROFE100
    if (applyCouponBtn) {
        applyCouponBtn.addEventListener('click', () => {
            const code = document.getElementById('coupon-code').value.trim().toUpperCase();
            const msg = document.getElementById('coupon-msg');

            if (code === 'PROFE100') {
                activeCoupon = 'PROFE100';
                msg.style.color = '#27ae60';
                msg.textContent = '¡Cupón PROFE100 aplicado! 15% de descuento.';
            } else {
                activeCoupon = null;
                msg.style.color = '#e74c3c';
                msg.textContent = 'Cupón inválido.';
            }

            updateCartUI();
            updateCheckoutTotals();
        });
    }

    function updateCheckoutTotals() {
        let subtotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);
        let discount = activeCoupon === 'PROFE100' ? (subtotal * 0.15) : 0;
        let finalTotal = subtotal - discount + shippingCost;

        if (finalTotalCheckout) {
            finalTotalCheckout.textContent = finalTotal.toFixed(2);
        }
    }

    if (nextToStep2Btn) {
        nextToStep2Btn.addEventListener('click', () => {
            const addr = document.getElementById('chk-address').value;
            const zip = document.getElementById('chk-zip').value;

            if (!addr || !zip) {
                alert('Por favor completa la dirección y el código postal.');
                return;
            }

            step1Form.classList.remove('active-step');
            step2Form.classList.add('active-step');
            document.getElementById('step1-indicator').classList.remove('active');
            document.getElementById('step2-indicator').classList.add('active');
        });
    }

    if (backToStep1Btn) {
        backToStep1Btn.addEventListener('click', () => {
            step2Form.classList.remove('active-step');
            step1Form.classList.add('active-step');
            document.getElementById('step2-indicator').classList.remove('active');
            document.getElementById('step1-indicator').classList.add('active');
        });
    }

    if (step2Form) {
        step2Form.addEventListener('submit', (e) => {
            e.preventDefault();

            const btnText = document.getElementById('btn-text');
            const btnSpinner = document.getElementById('btn-spinner');

            btnText.style.display = 'none';
            btnSpinner.style.display = 'inline-block';

            setTimeout(() => {
                btnText.style.display = 'inline';
                btnSpinner.style.display = 'none';

                const orderNum = 'ORD-' + Math.floor(10000 + Math.random() * 90000);
                document.getElementById('order-number-display').textContent = orderNum;

                cart.forEach(cartItem => {
                    const prod = productsDB.find(p => p.id === cartItem.id);
                    if (prod) prod.stock -= cartItem.quantity;
                });

                cart = [];
                saveCart();
                updateCartUI();
                renderProducts();

                checkoutModal.style.display = 'none';
                thankyouModal.style.display = 'flex';
            }, 2000);
        });
    }

    if (closeThankyouBtn) {
        closeThankyouBtn.addEventListener('click', () => {
            thankyouModal.style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
    });
});