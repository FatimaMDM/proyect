// =========================================================
// admin.js  |  Panel administrativo de Verde Vida
// Lee y escribe en Firestore. Solo funciona para usuarios con
// rol "admin" (lo validan esta página Y las reglas de Firestore).
// =========================================================

const firebaseConfig = {
    apiKey: "AIzaSyBdQgR-W1GMyzyMyzCX2qUf2UkEHRHMH1Q",
    authDomain: "verdevida-26b81.firebaseapp.com",
    projectId: "verdevida-26b81",
    storageBucket: "verdevida-26b81.firebasestorage.app",
    messagingSenderId: "330756269732",
    appId: "1:330756269732:web:c8eb289cf5f41fa5c06831"
};
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const AHORA = () => firebase.firestore.FieldValue.serverTimestamp();

// ---------- Estado en memoria ----------
let adminUser = null;
let pedidos = [], productos = [], usuarios = [], detalles = [], movimientos = [], categorias = [], auditoria = [], devoluciones = [], cupones = [];
let pedidoActual = null, productoActual = null, devolucionActual = null, cuponActual = null;

// ---------- Reglas de negocio: transiciones de estado permitidas ----------
const TRANSICIONES = {
    pendiente:   ['pagado', 'cancelado'],
    pagado:      ['preparando', 'cancelado'],
    preparando:  ['enviado', 'cancelado'],
    enviado:     ['entregado'],
    entregado:   [],
    cancelado:   ['reembolsado'],
    reembolsado: []
};
const ESTADO_ENVIO = { preparando: 'preparando', enviado: 'en transito', entregado: 'entregado', cancelado: 'cancelado' };
const STOCK_BAJO = 5;

// ---------- Utilidades ----------
const $ = (id) => document.getElementById(id);
const dinero = (n) => '$' + Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fechaTxt = (f) => (f && f.toDate) ? f.toDate().toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' }) : '—';
const ms = (f) => (f && f.seconds) ? f.seconds : 0;

// Evita XSS al pintar datos que escribieron los usuarios
function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Algunos pedidos de prueba antiguos usan otros nombres de campo
function normalizarPedido(doc) {
    const d = doc.data();
    return {
        id: doc.id,
        folio: d.folio || doc.id,
        estado: d.estado || d.estado_pedido || 'pendiente',
        fecha: d.fecha || d.fecha_pedido || null,
        email: d.email || '',
        id_usuario: d.id_usuario || '',
        subtotal: d.subtotal ?? d.total ?? 0,
        descuento: d.descuento || 0,
        costo_envio: d.costo_envio || 0,
        total: d.total || 0,
        cupon: d.cupon || d.id_cupon || null,
        direccion: d.direccion_envio || null,
        pago: d.pago || null
    };
}

function mostrarMsg(el, texto, tipo) {
    el.textContent = texto;
    el.className = 'msg ' + (tipo || '');
}

async function registrarAuditoria(accion, entidad, entidadId, detalle) {
    try {
        await db.collection('audit_logs').add({
            actor: adminUser.uid,
            actor_email: adminUser.email,
            accion, entidad, entidad_id: entidadId,
            detalle: detalle || '',
            fecha: AHORA()
        });
    } catch (err) {
        console.error('No se pudo registrar auditoría', err);
    }
}

// ---------- Acceso: solo administradores ----------
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        $('bloqueo-msg').textContent = 'Debes iniciar sesión en la tienda con una cuenta de administrador.';
        return;
    }
    try {
        const perfil = await db.collection('usuarios').doc(user.uid).get();
        if (!perfil.exists || perfil.data().rol !== 'admin') {
            $('bloqueo-msg').textContent = 'Acceso denegado: tu cuenta no tiene permisos de administrador.';
            return;
        }
        adminUser = { uid: user.uid, email: user.email, nombre: perfil.data().nombre || user.email };
        $('adm-user').textContent = 'Administrador: ' + adminUser.nombre;
        $('bloqueo').style.display = 'none';
        $('app').style.display = 'block';
        await cargarTodo();
    } catch (err) {
        console.error(err);
        $('bloqueo-msg').textContent = 'No se pudo verificar tu sesión. Intenta de nuevo.';
    }
});

$('btn-salir').addEventListener('click', () => auth.signOut().then(() => location.href = 'index.html'));

// ---------- Carga de datos ----------
async function cargarTodo() {
    const [sp, spr, su, sd, sm, sc, sa, sdv, scu] = await Promise.all([
        db.collection('pedidos').get(),
        db.collection('productos').get(),
        db.collection('usuarios').get(),
        db.collection('detalle_pedido').get(),
        db.collection('movimientos_inventario').orderBy('fecha', 'desc').limit(30).get(),
        db.collection('categorias').get(),
        db.collection('audit_logs').orderBy('fecha', 'desc').limit(30).get(),
        db.collection('devoluciones').get(),
        db.collection('cupones').get()
    ]);
    pedidos = sp.docs.map(normalizarPedido).sort((a, b) => ms(b.fecha) - ms(a.fecha));
    productos = spr.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.id.localeCompare(b.id));
    usuarios = su.docs.map(d => ({ id: d.id, ...d.data() }));
    detalles = sd.docs.map(d => ({ id: d.id, ...d.data() }));
    movimientos = sm.docs.map(d => ({ id: d.id, ...d.data() }));
    categorias = sc.docs.map(d => ({ id: d.id, ...d.data() }));
    auditoria = sa.docs.map(d => ({ id: d.id, ...d.data() }));
    devoluciones = sdv.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => ms(b.fecha) - ms(a.fecha));
    cupones = scu.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.id.localeCompare(b.id));
    pintarTodo();
}

function pintarTodo() {
    pintarDashboard();
    pintarPedidos();
    pintarProductos();
    pintarMovimientos();
    pintarClientes();
    pintarReportes();
    pintarDevoluciones();
    pintarCupones();
}

// ---------- Pestañas ----------
document.querySelectorAll('.adm-tab').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.adm-tab').forEach(b => b.classList.remove('activa'));
        document.querySelectorAll('.adm-panel').forEach(p => p.classList.remove('activa'));
        btn.classList.add('activa');
        $('tab-' + btn.dataset.tab).classList.add('activa');
    });
});

// ---------- Dashboard ----------
function estadoValido(p) { return !['cancelado', 'reembolsado'].includes(p.estado); }

function pintarDashboard() {
    const validos = pedidos.filter(estadoValido);
    $('k-ventas').textContent = dinero(validos.reduce((s, p) => s + Number(p.total || 0), 0));
    $('k-pedidos').textContent = pedidos.length;
    $('k-pendientes').textContent = pedidos.filter(p => ['pagado', 'preparando'].includes(p.estado)).length;
    const bajos = productos.filter(p => p.estado === 'activo' && Number(p.stock) <= STOCK_BAJO);
    $('k-stock').textContent = bajos.length;
    $('k-clientes').textContent = usuarios.filter(u => u.rol !== 'admin').length;
    $('k-devoluciones').textContent = devoluciones.filter(d => ['solicitada', 'aprobada'].includes(d.estado)).length;

    $('dash-pedidos').innerHTML = pedidos.slice(0, 5).map(p => `
        <tr><td>${esc(p.folio)}</td><td>${fechaTxt(p.fecha)}</td><td>${esc(p.email || p.id_usuario)}</td>
        <td class="num">${dinero(p.total)}</td><td><span class="etiqueta ${esc(p.estado)}">${esc(p.estado)}</span></td></tr>`).join('')
        || '<tr><td colspan="5" class="vacio">Sin pedidos todavía.</td></tr>';

    $('dash-stock').innerHTML = bajos.map(p => `
        <tr><td>${esc(p.sku)}</td><td>${esc(p.nombre)}</td><td class="num stock-bajo">${esc(p.stock)}</td></tr>`).join('')
        || '<tr><td colspan="3" class="vacio">Todo el inventario está bien surtido.</td></tr>';
}

// ---------- Pedidos ----------
function pintarPedidos() {
    const q = $('f-pedido').value.trim().toLowerCase();
    const est = $('f-estado').value;
    const lista = pedidos.filter(p =>
        (!est || p.estado === est) &&
        (!q || p.folio.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)));

    $('tabla-pedidos').innerHTML = lista.map(p => `
        <tr><td><strong>${esc(p.folio)}</strong></td><td>${fechaTxt(p.fecha)}</td><td>${esc(p.email || p.id_usuario)}</td>
        <td class="num">${dinero(p.total)}</td><td><span class="etiqueta ${esc(p.estado)}">${esc(p.estado)}</span></td>
        <td><button class="btn btn-secundario btn-chico" data-pedido="${esc(p.id)}">Ver / cambiar</button></td></tr>`).join('')
        || '<tr><td colspan="6" class="vacio">No hay pedidos con ese filtro.</td></tr>';

    document.querySelectorAll('[data-pedido]').forEach(b =>
        b.addEventListener('click', () => abrirPedido(b.dataset.pedido)));
}
$('f-pedido').addEventListener('input', pintarPedidos);
$('f-estado').addEventListener('change', pintarPedidos);

function abrirPedido(id) {
    pedidoActual = pedidos.find(p => p.id === id);
    if (!pedidoActual) return;
    const p = pedidoActual;
    $('mp-titulo').textContent = 'Pedido ' + p.folio;
    $('mp-info').innerHTML = `
        <p style="font-size:13px;">
            <strong>Fecha:</strong> ${fechaTxt(p.fecha)}<br>
            <strong>Cliente:</strong> ${esc(p.email || p.id_usuario)}<br>
            ${p.direccion ? `<strong>Envío a:</strong> ${esc(p.direccion.direccion)}, CP ${esc(p.direccion.cp)}<br>` : ''}
            <strong>Subtotal:</strong> ${dinero(p.subtotal)} · <strong>Descuento:</strong> -${dinero(p.descuento)}${p.cupon ? ' (' + esc(p.cupon) + ')' : ''} · <strong>Envío:</strong> ${dinero(p.costo_envio)}<br>
            <strong>Total:</strong> ${dinero(p.total)} · <strong>Pago:</strong> ${p.pago ? esc(p.pago.metodo + ' / ' + p.pago.estado) : '—'}<br>
            <strong>Estado actual:</strong> <span class="etiqueta ${esc(p.estado)}">${esc(p.estado)}</span>
        </p>`;
    const partidas = detalles.filter(d => d.id_pedido === p.id);
    $('mp-partidas').innerHTML = partidas.map(d =>
        `<li>${esc(d.cantidad)} × ${esc(d.nombre)} (${esc(d.sku)}) — ${dinero(d.importe)}</li>`).join('')
        || '<li>Sin partidas registradas.</li>';

    const siguientes = TRANSICIONES[p.estado] || [];
    $('mp-estado').innerHTML = siguientes.length
        ? siguientes.map(e => `<option value="${e}">${e}</option>`).join('')
        : '<option value="">Sin cambios posibles (estado final)</option>';
    $('mp-estado').disabled = !siguientes.length;
    $('mp-guardar').disabled = !siguientes.length;
    $('mp-paqueteria').value = '';
    $('mp-guia').value = '';
    actualizarCamposEstado();
    mostrarMsg($('mp-msg'), '');
    $('modal-pedido').style.display = 'flex';
}

function actualizarCamposEstado() {
    const e = $('mp-estado').value;
    $('mp-envio').style.display = e === 'enviado' ? 'grid' : 'none';
    $('mp-aviso-cancel').style.display = e === 'cancelado' ? 'block' : 'none';
}
$('mp-estado').addEventListener('change', actualizarCamposEstado);

// Cambia el estado de un pedido en una transacción.
// "extra" permite agregar escrituras en la misma transacción (por ejemplo, cerrar una solicitud).
async function aplicarEstadoPedido(p, nuevo, opciones = {}) {
    const pedidoRef = db.collection('pedidos').doc(p.id);
    const [enviosSnap, partidasSnap] = await Promise.all([
        db.collection('envios').where('id_pedido', '==', p.id).get(),
        nuevo === 'cancelado' ? db.collection('detalle_pedido').where('id_pedido', '==', p.id).get() : Promise.resolve({ docs: [] })
    ]);
    const partidas = partidasSnap.docs.map(d => d.data());

    await db.runTransaction(async (tx) => {
        // LECTURAS
        const actual = await tx.get(pedidoRef);
        const estadoActual = actual.data().estado || actual.data().estado_pedido || 'pendiente';
        if (!(TRANSICIONES[estadoActual] || []).includes(nuevo)) {
            throw new Error(`Transición no permitida: ${estadoActual} → ${nuevo}`);
        }
        const prodRefs = partidas.map(d => db.collection('productos').doc(d.id_producto));
        const prodSnaps = await Promise.all(prodRefs.map(r => tx.get(r)));

        // ESCRITURAS
        const cambios = { estado: nuevo, actualizado: AHORA(), actualizado_por: adminUser.uid };
        if (nuevo === 'reembolsado') cambios['pago.estado'] = 'reembolsado';
        if (nuevo === 'cancelado') cambios['pago.estado'] = 'reembolsado';
        tx.update(pedidoRef, cambios);

        enviosSnap.docs.forEach(envio => {
            const ce = {};
            if (ESTADO_ENVIO[nuevo]) ce.estado = ESTADO_ENVIO[nuevo];
            if (nuevo === 'enviado') {
                ce.paqueteria = opciones.paqueteria;
                ce.guia = opciones.guia;
                ce.fecha_envio = AHORA();
            }
            if (nuevo === 'entregado') ce.fecha_entrega = AHORA();
            if (Object.keys(ce).length) tx.update(envio.ref, ce);
        });

        // Cancelación: regresar unidades al inventario
        prodSnaps.forEach((snap, i) => {
            if (!snap.exists) return;
            const antes = snap.data().stock || 0;
            const despues = antes + partidas[i].cantidad;
            tx.update(prodRefs[i], { stock: despues });
            tx.set(db.collection('movimientos_inventario').doc(), {
                id_producto: prodRefs[i].id, tipo: 'entrada', cantidad: partidas[i].cantidad,
                stock_anterior: antes, stock_nuevo: despues, motivo: 'cancelacion de pedido',
                referencia: p.folio, id_usuario: adminUser.uid, fecha: AHORA()
            });
        });

        if (opciones.extra) opciones.extra(tx);
    });
    await registrarAuditoria('cambio de estado', 'pedido', p.id, `${p.folio}: ${p.estado} → ${nuevo}`);
}

$('mp-guardar').addEventListener('click', async () => {
    const p = pedidoActual;
    const nuevo = $('mp-estado').value;
    const msg = $('mp-msg');
    if (!nuevo) return;
    const paqueteria = $('mp-paqueteria').value.trim();
    const guia = $('mp-guia').value.trim();
    if (nuevo === 'enviado' && (!paqueteria || !guia)) {
        mostrarMsg(msg, 'Captura la paquetería y el número de guía.', 'error');
        return;
    }
    if (nuevo === 'cancelado' && !confirm(`¿Cancelar el pedido ${p.folio}? Las unidades regresarán al inventario.`)) return;

    $('mp-guardar').disabled = true;
    mostrarMsg(msg, 'Guardando...');
    try {
        await aplicarEstadoPedido(p, nuevo, { paqueteria, guia });
        mostrarMsg(msg, 'Estado actualizado.', 'ok');
        await cargarTodo();
        setTimeout(() => { $('modal-pedido').style.display = 'none'; }, 700);
    } catch (err) {
        console.error(err);
        mostrarMsg(msg, err.message || 'No se pudo actualizar el pedido.', 'error');
        $('mp-guardar').disabled = false;
    }
});

// Exportar pedidos a CSV
$('btn-csv-pedidos').addEventListener('click', () => {
    const filas = [['folio', 'fecha', 'cliente', 'subtotal', 'descuento', 'envio', 'total', 'estado']];
    pedidos.forEach(p => filas.push([p.folio, fechaTxt(p.fecha), p.email || p.id_usuario, p.subtotal, p.descuento, p.costo_envio, p.total, p.estado]));
    const csv = filas.map(f => f.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'pedidos_verdevida.csv';
    a.click();
    URL.revokeObjectURL(a.href);
});

// ---------- Productos ----------
function nombreCategoria(slug) {
    const c = categorias.find(c => c.id === slug || c.slug === slug);
    return c ? c.nombre : slug;
}

function pintarProductos() {
    const q = $('f-producto').value.trim().toLowerCase();
    const est = $('f-prod-estado').value;
    const lista = productos.filter(p =>
        (!est || p.estado === est) &&
        (!q || String(p.nombre).toLowerCase().includes(q) || String(p.sku).toLowerCase().includes(q)));

    $('tabla-productos').innerHTML = lista.map(p => `
        <tr>
            <td>${p.imagen_url ? `<img src="${esc(p.imagen_url)}" alt="">` : ''}</td>
            <td>${esc(p.sku)}</td><td>${esc(p.nombre)}</td><td>${esc(nombreCategoria(p.categoria))}</td>
            <td class="num">${dinero(p.precio)}</td>
            <td class="num ${Number(p.stock) <= STOCK_BAJO ? 'stock-bajo' : ''}">${esc(p.stock)}</td>
            <td><span class="etiqueta ${esc(p.estado || 'inactivo')}">${esc(p.estado || 'sin estado')}</span></td>
            <td style="white-space:nowrap;">
                <button class="btn btn-secundario btn-chico" data-editar="${esc(p.id)}">Editar</button>
                <button class="btn ${p.estado === 'activo' ? 'btn-peligro' : 'btn-secundario'} btn-chico" data-baja="${esc(p.id)}">${p.estado === 'activo' ? 'Dar de baja' : 'Reactivar'}</button>
            </td>
        </tr>`).join('') || '<tr><td colspan="8" class="vacio">No hay productos con ese filtro.</td></tr>';

    document.querySelectorAll('[data-editar]').forEach(b => b.addEventListener('click', () => abrirProducto(b.dataset.editar)));
    document.querySelectorAll('[data-baja]').forEach(b => b.addEventListener('click', () => cambiarEstadoProducto(b.dataset.baja)));
}
$('f-producto').addEventListener('input', pintarProductos);
$('f-prod-estado').addEventListener('change', pintarProductos);

function pintarMovimientos() {
    $('tabla-movimientos').innerHTML = movimientos.map(m => {
        const prod = productos.find(p => p.id === m.id_producto);
        return `<tr><td>${fechaTxt(m.fecha)}</td><td>${esc(prod ? prod.nombre : m.id_producto)}</td><td>${esc(m.tipo)}</td>
            <td class="num">${esc(m.cantidad)}</td><td class="num">${esc(m.stock_anterior)} → ${esc(m.stock_nuevo)}</td>
            <td>${esc(m.motivo)}</td><td>${esc(m.referencia || '')}</td></tr>`;
    }).join('') || '<tr><td colspan="7" class="vacio">Sin movimientos todavía.</td></tr>';
}

// Baja lógica: el producto no se borra, solo deja de mostrarse en la tienda
async function cambiarEstadoProducto(id) {
    const p = productos.find(x => x.id === id);
    const nuevo = p.estado === 'activo' ? 'inactivo' : 'activo';
    if (!confirm(`¿${nuevo === 'inactivo' ? 'Dar de baja' : 'Reactivar'} "${p.nombre}"?`)) return;
    try {
        await db.collection('productos').doc(id).update({ estado: nuevo, actualizado: AHORA() });
        await registrarAuditoria(nuevo === 'inactivo' ? 'baja logica' : 'reactivacion', 'producto', id, p.nombre);
        await cargarTodo();
    } catch (err) {
        alert('No se pudo cambiar el estado: ' + err.message);
    }
}

function abrirProducto(id) {
    productoActual = id ? productos.find(p => p.id === id) : null;
    const p = productoActual || {};
    $('pp-titulo').textContent = productoActual ? 'Editar producto' : 'Nuevo producto';
    $('pp-categoria').innerHTML = categorias.map(c => `<option value="${esc(c.id)}">${esc(c.nombre)}</option>`).join('');
    $('pp-sku').value = p.sku || '';
    $('pp-categoria').value = p.categoria || (categorias[0] ? categorias[0].id : '');
    $('pp-nombre').value = p.nombre || '';
    $('pp-descripcion').value = p.descripcion || '';
    $('pp-especificacion').value = p.especificacion || '';
    $('pp-precio').value = p.precio ?? '';
    $('pp-precio-original').value = (p.precio_original && p.precio_original !== p.precio) ? p.precio_original : '';
    $('pp-stock').value = p.stock ?? 0;
    $('pp-estado').value = p.estado || 'activo';
    $('pp-imagen').value = p.imagen_url || '';
    $('pp-motivo').value = '';
    $('pp-motivo-wrap').style.display = 'none';
    mostrarMsg($('pp-msg'), '');
    $('pp-guardar').disabled = false;
    $('modal-producto').style.display = 'flex';
}
$('btn-nuevo-producto').addEventListener('click', () => abrirProducto(null));

// Si cambia el stock de un producto existente, se exige un motivo
$('pp-stock').addEventListener('input', () => {
    const cambio = productoActual && Number($('pp-stock').value) !== Number(productoActual.stock);
    $('pp-motivo-wrap').style.display = cambio ? 'block' : 'none';
});

function siguienteIdProducto() {
    const nums = productos.map(p => parseInt(String(p.id).replace('prod_', ''), 10)).filter(n => !isNaN(n));
    return 'prod_' + String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0');
}

$('form-producto').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('pp-msg');
    const datos = {
        sku: $('pp-sku').value.trim().toUpperCase(),
        categoria: $('pp-categoria').value,
        nombre: $('pp-nombre').value.trim(),
        descripcion: $('pp-descripcion').value.trim(),
        especificacion: $('pp-especificacion').value.trim(),
        precio: Math.round(Number($('pp-precio').value) * 100) / 100,
        stock: Number($('pp-stock').value),
        estado: $('pp-estado').value,
        imagen_url: $('pp-imagen').value.trim()
    };
    const original = Number($('pp-precio-original').value);
    datos.precio_original = original > datos.precio ? original : datos.precio;
    datos.descuento = original > datos.precio ? Math.round((1 - datos.precio / original) * 100) + '% OFF' : null;
    datos.destacado = !!datos.descuento;

    // Validaciones
    if (!datos.sku || !datos.nombre) return mostrarMsg(msg, 'El SKU y el nombre son obligatorios.', 'error');
    if (!(datos.precio > 0)) return mostrarMsg(msg, 'El precio debe ser mayor a 0.', 'error');
    if (!Number.isInteger(datos.stock) || datos.stock < 0) return mostrarMsg(msg, 'El stock debe ser un número entero de 0 o más.', 'error');
    const skuRepetido = productos.find(p => p.sku === datos.sku && (!productoActual || p.id !== productoActual.id));
    if (skuRepetido) return mostrarMsg(msg, `El SKU ya lo usa "${skuRepetido.nombre}".`, 'error');

    const cambioStock = productoActual && datos.stock !== Number(productoActual.stock);
    const motivo = $('pp-motivo').value;
    if (cambioStock && !motivo) return mostrarMsg(msg, 'Selecciona el motivo del ajuste de stock.', 'error');

    $('pp-guardar').disabled = true;
    mostrarMsg(msg, 'Guardando...');
    try {
        if (!productoActual) {
            const id = siguienteIdProducto();
            await db.collection('productos').doc(id).set({ ...datos, creado: AHORA(), actualizado: AHORA() });
            if (datos.stock > 0) {
                await db.collection('movimientos_inventario').add({
                    id_producto: id, tipo: 'entrada', cantidad: datos.stock, stock_anterior: 0, stock_nuevo: datos.stock,
                    motivo: 'alta de producto', referencia: datos.sku, id_usuario: adminUser.uid, fecha: AHORA()
                });
            }
            await registrarAuditoria('alta', 'producto', id, `${datos.sku} ${datos.nombre}`);
        } else {
            const ref = db.collection('productos').doc(productoActual.id);
            const anterior = productoActual;
            await db.runTransaction(async (tx) => {
                const snap = await tx.get(ref);
                const stockActual = snap.data().stock || 0;
                tx.update(ref, { ...datos, actualizado: AHORA() });
                if (datos.stock !== stockActual) {
                    const dif = datos.stock - stockActual;
                    tx.set(db.collection('movimientos_inventario').doc(), {
                        id_producto: ref.id, tipo: dif > 0 ? 'entrada' : 'salida', cantidad: Math.abs(dif),
                        stock_anterior: stockActual, stock_nuevo: datos.stock, motivo: 'ajuste: ' + motivo,
                        referencia: 'panel admin', id_usuario: adminUser.uid, fecha: AHORA()
                    });
                }
            });
            const cambios = [];
            if (anterior.precio !== datos.precio) cambios.push(`precio ${anterior.precio} → ${datos.precio}`);
            if (cambioStock) cambios.push(`stock ${anterior.stock} → ${datos.stock} (${motivo})`);
            if (anterior.estado !== datos.estado) cambios.push(`estado ${anterior.estado} → ${datos.estado}`);
            await registrarAuditoria('edicion', 'producto', ref.id, `${datos.sku}: ${cambios.join(', ') || 'datos generales'}`);
        }
        mostrarMsg(msg, 'Producto guardado.', 'ok');
        await cargarTodo();
        setTimeout(() => { $('modal-producto').style.display = 'none'; }, 700);
    } catch (err) {
        console.error(err);
        mostrarMsg(msg, 'No se pudo guardar: ' + err.message, 'error');
        $('pp-guardar').disabled = false;
    }
});

// ---------- Clientes ----------
function pintarClientes() {
    $('tabla-clientes').innerHTML = usuarios
        .sort((a, b) => ms(b.fecha_registro) - ms(a.fecha_registro))
        .map(u => `<tr><td>${esc(u.nombre)}</td><td>${esc(u.email)}</td><td>${esc(u.rol)}</td>
            <td>${fechaTxt(u.fecha_registro)}</td><td class="num">${pedidos.filter(p => p.id_usuario === u.id).length}</td></tr>`).join('')
        || '<tr><td colspan="5" class="vacio">Sin clientes registrados.</td></tr>';
}

// ---------- Reportes ----------
function pintarReportes() {
    const validos = new Set(pedidos.filter(estadoValido).map(p => p.id));
    const top = {};
    detalles.filter(d => validos.has(d.id_pedido)).forEach(d => {
        const k = d.id_producto;
        top[k] = top[k] || { nombre: d.nombre, sku: d.sku, unidades: 0, importe: 0 };
        top[k].unidades += Number(d.cantidad || 0);
        top[k].importe += Number(d.importe || 0);
    });
    $('tabla-top').innerHTML = Object.values(top).sort((a, b) => b.unidades - a.unidades).slice(0, 10)
        .map(t => `<tr><td>${esc(t.nombre)}</td><td>${esc(t.sku)}</td><td class="num">${t.unidades}</td><td class="num">${dinero(t.importe)}</td></tr>`).join('')
        || '<tr><td colspan="4" class="vacio">Aún no hay ventas.</td></tr>';

    const porEstado = {};
    pedidos.forEach(p => {
        porEstado[p.estado] = porEstado[p.estado] || { n: 0, importe: 0 };
        porEstado[p.estado].n++;
        porEstado[p.estado].importe += Number(p.total || 0);
    });
    $('tabla-por-estado').innerHTML = Object.entries(porEstado)
        .map(([e, v]) => `<tr><td><span class="etiqueta ${esc(e)}">${esc(e)}</span></td><td class="num">${v.n}</td><td class="num">${dinero(v.importe)}</td></tr>`).join('')
        || '<tr><td colspan="3" class="vacio">Sin pedidos.</td></tr>';

    $('tabla-auditoria').innerHTML = auditoria
        .map(a => `<tr><td>${fechaTxt(a.fecha)}</td><td>${esc(a.actor_email)}</td><td>${esc(a.accion)}</td><td>${esc(a.entidad)}</td><td>${esc(a.detalle)}</td></tr>`).join('')
        || '<tr><td colspan="5" class="vacio">Sin cambios registrados todavía.</td></tr>';
}

// ---------- Devoluciones y cancelaciones ----------
const MOTIVO_TXT = {
    'cambio de opinion': 'Cambió de opinión', 'error en el pedido': 'Error en el pedido', 'error en direccion': 'Dirección incorrecta',
    'otro': 'Otro', 'danado en transporte': 'Dañado en transporte', 'defectuoso': 'Defectuoso / planta enferma',
    'incorrecto': 'Producto incorrecto', 'incompleto': 'Pedido incompleto', 'arrepentimiento': 'Arrepentimiento (art. 56 LFPC)'
};
// Motivos donde la responsabilidad es de la tienda: se reembolsa también el envío
const CULPA_TIENDA = ['danado en transporte', 'defectuoso', 'incorrecto', 'incompleto'];
// Motivos donde el producto no puede volver a venderse
const NO_REINGRESA = ['danado en transporte', 'defectuoso'];

function pintarDevoluciones() {
    const est = $('f-dev-estado').value;
    const lista = devoluciones.filter(d => !est || d.estado === est);
    $('tabla-devoluciones').innerHTML = lista.map(d => `
        <tr><td><strong>${esc(d.folio)}</strong></td><td>${fechaTxt(d.fecha)}</td>
        <td>${d.tipo === 'cancelacion' ? 'Cancelación' : 'Devolución'}</td><td>${esc(d.folio_pedido)}</td>
        <td>${esc(d.email)}</td><td>${esc(MOTIVO_TXT[d.motivo] || d.motivo)}</td>
        <td><span class="etiqueta ${esc(d.estado)}">${esc(d.estado)}</span></td>
        <td><button class="btn btn-secundario btn-chico" data-dev="${esc(d.id)}">Atender</button></td></tr>`).join('')
        || '<tr><td colspan="8" class="vacio">No hay solicitudes.</td></tr>';
    document.querySelectorAll('[data-dev]').forEach(b => b.addEventListener('click', () => abrirDevolucion(b.dataset.dev)));
}
$('f-dev-estado').addEventListener('change', pintarDevoluciones);

function montoSugerido(d, p) {
    const importe = (d.partidas || []).reduce((s, x) => s + Number(x.importe || 0), 0);
    if (!p) return importe;
    if (d.tipo === 'cancelacion') return Number(p.total || 0);
    // Se descuenta la parte proporcional del cupón
    const proporcion = p.subtotal ? importe / p.subtotal : 1;
    let monto = importe - Number(p.descuento || 0) * proporcion;
    const devuelveTodo = Math.abs(importe - p.subtotal) < 0.01;
    if (devuelveTodo && CULPA_TIENDA.includes(d.motivo)) monto += Number(p.costo_envio || 0);
    return Math.round(monto * 100) / 100;
}

function abrirDevolucion(id) {
    devolucionActual = devoluciones.find(d => d.id === id);
    const d = devolucionActual;
    const p = pedidos.find(x => x.id === d.id_pedido);
    $('md-titulo').textContent = (d.tipo === 'cancelacion' ? 'Cancelación ' : 'Devolución ') + d.folio;
    $('md-info').innerHTML = `
        <p style="font-size:13px;">
            <strong>Pedido:</strong> ${esc(d.folio_pedido)} (${p ? esc(p.estado) : 'no encontrado'}) · <strong>Total pedido:</strong> ${p ? dinero(p.total) : '—'}<br>
            <strong>Cliente:</strong> ${esc(d.email)}<br>
            <strong>Fecha:</strong> ${fechaTxt(d.fecha)}<br>
            <strong>Motivo:</strong> ${esc(MOTIVO_TXT[d.motivo] || d.motivo)}<br>
            <strong>Descripción:</strong> ${esc(d.descripcion)}<br>
            <strong>Estado:</strong> <span class="etiqueta ${esc(d.estado)}">${esc(d.estado)}</span>
            ${d.respuesta ? `<br><strong>Respuesta:</strong> ${esc(d.respuesta)}` : ''}
        </p>`;
    $('md-partidas').innerHTML = (d.partidas || []).map(x =>
        `<li>${esc(x.cantidad)} × ${esc(x.nombre)} (${esc(x.sku)}) — ${dinero(x.importe)}</li>`).join('');
    $('md-historial').innerHTML = (d.historial || []).map(h =>
        `<li>${esc(new Date(h.fecha).toLocaleString('es-MX'))}: ${esc(h.estado)}${h.nota ? ' — ' + esc(h.nota) : ''}</li>`).join('');

    $('md-respuesta').value = '';
    $('md-monto').value = montoSugerido(d, p).toFixed(2);
    $('md-reingresa').checked = !NO_REINGRESA.includes(d.motivo);
    const enRevision = d.estado === 'solicitada';
    const porRecibir = d.estado === 'aprobada' && d.tipo === 'devolucion';
    $('md-acciones-revision').style.display = enRevision ? 'block' : 'none';
    $('md-acciones-recibir').style.display = porRecibir ? 'block' : 'none';
    $('md-final').style.display = (!enRevision && !porRecibir) ? 'block' : 'none';
    $('md-aviso-cancel').style.display = enRevision && d.tipo === 'cancelacion' ? 'block' : 'none';
    mostrarMsg($('md-msg'), '');
    document.querySelectorAll('#modal-devolucion button.btn').forEach(b => b.disabled = false);
    $('modal-devolucion').style.display = 'flex';
}

function entradaHistorial(estado, nota) {
    return firebase.firestore.FieldValue.arrayUnion({ estado, fecha: new Date().toISOString(), nota: nota || '', por: adminUser.email });
}

async function resolverDevolucion(accion) {
    const d = devolucionActual;
    const p = pedidos.find(x => x.id === d.id_pedido);
    const respuesta = $('md-respuesta').value.trim();
    const msg = $('md-msg');
    const devRef = db.collection('devoluciones').doc(d.id);

    if (accion === 'rechazar' && respuesta.length < 10) {
        return mostrarMsg(msg, 'Para rechazar escribe el motivo al cliente (mínimo 10 caracteres).', 'error');
    }
    document.querySelectorAll('#modal-devolucion button.btn').forEach(b => b.disabled = true);
    mostrarMsg(msg, 'Guardando...');
    try {
        if (accion === 'rechazar') {
            await devRef.update({ estado: 'rechazada', respuesta, atendido_por: adminUser.uid, actualizado: AHORA(),
                historial: entradaHistorial('rechazada', respuesta) });
            await registrarAuditoria('rechazo', 'devolucion', d.id, `${d.folio}: ${respuesta}`);

        } else if (accion === 'aprobar' && d.tipo === 'cancelacion') {
            if (!p) throw new Error('No se encontró el pedido.');
            if (!['pagado', 'preparando'].includes(p.estado)) {
                throw new Error(`El pedido ya está "${p.estado}" y no se puede cancelar. Recházala e indica que solicite una devolución.`);
            }
            const monto = Number($('md-monto').value);
            await aplicarEstadoPedido(p, 'cancelado', {
                extra: (tx) => tx.update(devRef, {
                    estado: 'completada', respuesta: respuesta || 'Cancelación aprobada. El reembolso se refleja en 5 a 10 días hábiles.',
                    monto_reembolso: monto, atendido_por: adminUser.uid, actualizado: AHORA(),
                    historial: entradaHistorial('completada', 'Pedido cancelado y reembolsado')
                })
            });
            await registrarAuditoria('cancelacion aprobada', 'devolucion', d.id, `${d.folio} → pedido ${d.folio_pedido} cancelado, reembolso ${dinero(monto)}`);

        } else if (accion === 'aprobar') {
            await devRef.update({ estado: 'aprobada',
                respuesta: respuesta || 'Devolución aprobada. Te contactaremos para coordinar la recolección.',
                atendido_por: adminUser.uid, actualizado: AHORA(), historial: entradaHistorial('aprobada', respuesta) });
            await registrarAuditoria('aprobacion', 'devolucion', d.id, d.folio);

        } else if (accion === 'completar') {
            const monto = Math.round(Number($('md-monto').value) * 100) / 100;
            if (!(monto >= 0) || (p && monto > p.total)) throw new Error('El monto debe estar entre 0 y el total del pedido.');
            const reingresa = $('md-reingresa').checked;
            const pedidoRef = db.collection('pedidos').doc(d.id_pedido);
            const partidas = d.partidas || [];

            await db.runTransaction(async (tx) => {
                const prodRefs = reingresa ? partidas.map(x => db.collection('productos').doc(x.id_producto)) : [];
                const prodSnaps = await Promise.all(prodRefs.map(r => tx.get(r)));
                const pedSnap = await tx.get(pedidoRef);
                const ped = pedSnap.data();
                const yaReembolsado = Number(ped.monto_reembolsado || 0);
                const totalReembolsado = yaReembolsado + monto;

                tx.update(devRef, { estado: 'completada', monto_reembolso: monto, reingreso_inventario: reingresa,
                    respuesta: respuesta || 'Recibimos el producto y aplicamos tu reembolso.',
                    atendido_por: adminUser.uid, actualizado: AHORA(),
                    historial: entradaHistorial('completada', `Reembolso ${dinero(monto)}${reingresa ? ', unidades reingresadas' : ', merma'}`) });

                const cambiosPedido = { monto_reembolsado: totalReembolsado, actualizado: AHORA() };
                if (totalReembolsado >= Number(ped.total || 0) - 0.01) {
                    cambiosPedido.estado = 'reembolsado';
                    cambiosPedido['pago.estado'] = 'reembolsado';
                } else {
                    cambiosPedido['pago.estado'] = 'reembolso parcial';
                }
                tx.update(pedidoRef, cambiosPedido);

                prodSnaps.forEach((snap, i) => {
                    if (!snap.exists) return;
                    const antes = snap.data().stock || 0;
                    const despues = antes + Number(partidas[i].cantidad);
                    tx.update(prodRefs[i], { stock: despues });
                    tx.set(db.collection('movimientos_inventario').doc(), {
                        id_producto: prodRefs[i].id, tipo: 'entrada', cantidad: Number(partidas[i].cantidad),
                        stock_anterior: antes, stock_nuevo: despues, motivo: 'devolucion',
                        referencia: d.folio, id_usuario: adminUser.uid, fecha: AHORA()
                    });
                });
            });
            await registrarAuditoria('reembolso', 'devolucion', d.id, `${d.folio}: ${dinero(monto)}${reingresa ? ' (reingreso a inventario)' : ' (merma)'}`);
        }
        mostrarMsg(msg, 'Solicitud actualizada.', 'ok');
        await cargarTodo();
        setTimeout(() => { $('modal-devolucion').style.display = 'none'; }, 700);
    } catch (err) {
        console.error(err);
        mostrarMsg(msg, err.message || 'No se pudo actualizar.', 'error');
        document.querySelectorAll('#modal-devolucion button.btn').forEach(b => b.disabled = false);
    }
}
$('md-aprobar').addEventListener('click', () => resolverDevolucion('aprobar'));
$('md-rechazar').addEventListener('click', () => resolverDevolucion('rechazar'));
$('md-completar').addEventListener('click', () => {
    if (confirm('¿Confirmas que recibiste el producto y que se aplicará el reembolso?')) resolverDevolucion('completar');
});

// ---------- Cupones ----------
const fechaInput = (f) => (f && f.toDate) ? f.toDate().toLocaleDateString('en-CA') : '';
const fechaCorta = (f) => (f && f.toDate) ? f.toDate().toLocaleDateString('es-MX') : 'Sin límite';

function estadoCupon(c) {
    const hoy = new Date();
    if (!c.activo) return 'inactivo';
    if (c.fecha_fin && c.fecha_fin.toDate && hoy > c.fecha_fin.toDate()) return 'vencido';
    if (c.fecha_inicio && c.fecha_inicio.toDate && hoy < c.fecha_inicio.toDate()) return 'programado';
    if (c.limite_usos && (c.usos || 0) >= c.limite_usos) return 'agotado';
    return 'vigente';
}

function pintarCupones() {
    $('tabla-cupones').innerHTML = cupones.map(c => {
        const est = estadoCupon(c);
        return `<tr><td><strong>${esc(c.id)}</strong></td><td class="num">${esc(c.valor)}%</td>
            <td>${fechaCorta(c.fecha_inicio)} – ${fechaCorta(c.fecha_fin)}</td>
            <td class="num">${esc(c.usos || 0)} / ${c.limite_usos ? esc(c.limite_usos) : '∞'}</td>
            <td class="num">${c.minimo_compra ? dinero(c.minimo_compra) : '—'}</td>
            <td>${c.un_uso_por_cliente ? 'Sí' : 'No'}</td>
            <td><span class="etiqueta ${est === 'vigente' ? 'entregado' : (est === 'programado' ? 'preparando' : 'cancelado')}">${est}</span></td>
            <td><button class="btn btn-secundario btn-chico" data-cupon="${esc(c.id)}">Editar</button></td></tr>`;
    }).join('') || '<tr><td colspan="8" class="vacio">Sin cupones.</td></tr>';
    document.querySelectorAll('[data-cupon]').forEach(b => b.addEventListener('click', () => abrirCupon(b.dataset.cupon)));
}

function abrirCupon(id) {
    cuponActual = id ? cupones.find(c => c.id === id) : null;
    const c = cuponActual || { activo: true, un_uso_por_cliente: false };
    $('pc-titulo').textContent = cuponActual ? 'Editar cupón ' + c.id : 'Nuevo cupón';
    $('pc-codigo').value = c.id || '';
    $('pc-codigo').disabled = !!cuponActual;
    $('pc-valor').value = c.valor ?? '';
    $('pc-inicio').value = fechaInput(c.fecha_inicio);
    $('pc-fin').value = fechaInput(c.fecha_fin);
    $('pc-limite').value = c.limite_usos ?? '';
    $('pc-minimo').value = c.minimo_compra ?? '';
    $('pc-unuso').checked = !!c.un_uso_por_cliente;
    $('pc-activo').checked = !!c.activo;
    $('pc-descripcion').value = c.descripcion || '';
    mostrarMsg($('pc-msg'), '');
    $('pc-guardar').disabled = false;
    $('modal-cupon').style.display = 'flex';
}
$('btn-nuevo-cupon').addEventListener('click', () => abrirCupon(null));

$('form-cupon').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('pc-msg');
    const codigo = $('pc-codigo').value.trim().toUpperCase();
    const valor = Number($('pc-valor').value);
    const inicio = $('pc-inicio').value;
    const fin = $('pc-fin').value;
    const limite = $('pc-limite').value ? Number($('pc-limite').value) : null;
    const minimo = $('pc-minimo').value ? Number($('pc-minimo').value) : 0;

    if (!/^[A-Z0-9]{4,20}$/.test(codigo)) return mostrarMsg(msg, 'El código debe tener de 4 a 20 letras o números, sin espacios.', 'error');
    if (!cuponActual && cupones.find(c => c.id === codigo)) return mostrarMsg(msg, 'Ya existe un cupón con ese código.', 'error');
    if (!(valor > 0 && valor <= 90)) return mostrarMsg(msg, 'El descuento debe ser de 1% a 90%.', 'error');
    if (inicio && fin && fin < inicio) return mostrarMsg(msg, 'La fecha final no puede ser antes de la inicial.', 'error');
    if (limite !== null && (!Number.isInteger(limite) || limite < 1)) return mostrarMsg(msg, 'El límite de usos debe ser un entero mayor a 0.', 'error');
    if (cuponActual && limite !== null && limite < (cuponActual.usos || 0)) return mostrarMsg(msg, `Ya se usó ${cuponActual.usos} veces; el límite no puede ser menor.`, 'error');
    if (minimo < 0) return mostrarMsg(msg, 'La compra mínima no puede ser negativa.', 'error');

    const TS = firebase.firestore.Timestamp;
    const datos = {
        codigo, tipo: 'porcentaje', valor,
        fecha_inicio: inicio ? TS.fromDate(new Date(inicio + 'T00:00:00')) : null,
        fecha_fin: fin ? TS.fromDate(new Date(fin + 'T23:59:59')) : null,
        limite_usos: limite,
        minimo_compra: minimo,
        un_uso_por_cliente: $('pc-unuso').checked,
        activo: $('pc-activo').checked,
        descripcion: $('pc-descripcion').value.trim(),
        actualizado: AHORA()
    };
    if (!cuponActual) datos.usos = 0;

    $('pc-guardar').disabled = true;
    mostrarMsg(msg, 'Guardando...');
    try {
        await db.collection('cupones').doc(codigo).set(datos, { merge: true });
        await registrarAuditoria(cuponActual ? 'edicion' : 'alta', 'cupon', codigo,
            `${valor}% · ${inicio || 'sin inicio'} a ${fin || 'sin fin'} · límite ${limite ?? '∞'} · mínimo ${minimo}`);
        mostrarMsg(msg, 'Cupón guardado.', 'ok');
        await cargarTodo();
        setTimeout(() => { $('modal-cupon').style.display = 'none'; }, 700);
    } catch (err) {
        console.error(err);
        mostrarMsg(msg, 'No se pudo guardar: ' + err.message, 'error');
        $('pc-guardar').disabled = false;
    }
});

// ---------- Cerrar modales ----------
document.querySelectorAll('[data-cerrar]').forEach(b =>
    b.addEventListener('click', () => b.closest('.adm-modal').style.display = 'none'));
document.querySelectorAll('.adm-modal').forEach(m =>
    m.addEventListener('click', (e) => { if (e.target === m) m.style.display = 'none'; }));
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') document.querySelectorAll('.adm-modal').forEach(m => m.style.display = 'none');
});