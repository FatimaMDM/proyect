# Verde Vida 🌿

Tienda virtual de plantas, macetas, semillas y accesorios de jardín. Proyecto integrador de la materia **Temas Selectos de Tecnología de la Información** (Ing. Alfredo Medrano).

> Proyecto académico: los productos, los pagos y los datos del proveedor son ficticios. No se cobra dinero real.

- **Demo:** https://verdevida-26b81.web.app
- **Panel administrativo:** https://verdevida-26b81.web.app/admin.html (requiere cuenta con rol `admin`)
- **Versión:** 1.0.0
- **Autora:** Fátima Monserrath Díaz Mones

## Funciones

**Tienda:** catálogo con filtros, carrito y favoritos, aviso de cookies, aceptación de términos, registro e inicio de sesión, recuperación de contraseña, checkout con cálculo de envío y cupones, pago simulado (aprobado o rechazado), historial "Mis pedidos" y solicitudes de cancelación o devolución.

**Panel administrativo:** dashboard, pedidos con estados controlados, productos e inventario con movimientos, devoluciones y reembolsos, cupones con vigencia y límites, clientes, reportes, bitácora de auditoría, respaldo y restauración.

## Tecnologías

| Capa | Tecnología |
| --- | --- |
| Interfaz | HTML5, CSS3, JavaScript sin frameworks |
| Autenticación | Firebase Authentication (correo y contraseña) |
| Base de datos | Cloud Firestore + reglas de seguridad |
| Alojamiento | Firebase Hosting (HTTPS) |
| SDK | Firebase JavaScript SDK 10.8.0 (compat) |

## Estructura

```
index.html / script.js / style.css     Tienda
admin.html / admin.js / admin.css      Panel administrativo
politicas.html / legal.css             Políticas, cookies y preguntas frecuentes
firestore.rules                        Reglas de seguridad (se publican en la consola de Firebase)
firebase.json / .firebaserc            Configuración de Firebase Hosting
images/                                Imágenes del sitio
```

## Ejecutar en local

Requisitos: Node.js 18 o superior y una cuenta de Google con acceso al proyecto `verdevida-26b81`.

```bash
npm install -g firebase-tools
firebase login
firebase serve          # abre http://localhost:5000
```

No abras `index.html` con doble clic: el inicio de sesión de Firebase no funciona desde un archivo local.

## Publicar

```bash
firebase deploy --only hosting
```

Las reglas de `firestore.rules` se pegan y publican en la consola: Firestore Database → Reglas → Publicar.

## Documentación

- Manual técnico y de instalación
- Diccionario de datos
- Ficha técnica
- Manual del comprador y manual del administrador
- Plan y reporte de pruebas

## Licencia

El código se distribuye bajo la licencia MIT (ver `LICENSE`). Las imágenes de productos no están cubiertas por esta licencia: algunas son propias o modificadas por la autora y otras se obtuvieron de internet con fines académicos; sus derechos pertenecen a sus autores.