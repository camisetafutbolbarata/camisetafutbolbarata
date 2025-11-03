
Camisetafutbolbarata - Vercel-ready project (Tailwind)
=====================================================

CONTENIDO:
- React + Vite + Tailwind project.
- src/data/ligas_equipos.json -> ligas & equipos (edítalo para añadir/quitar equipos).
- src/data/discounts.json -> códigos de descuento (editable). Default: debatealgol = 10%.
- PayPal Payments Standard checkout -> recibe pedidos en gorka0804@gmail.com (el campo 'invoice' contiene JSON con datos del pedido y cliente).
- Galería vacía para cada producto: añade imágenes en the JSON 'images' array or in public/ and reference them.

RUN LOCAL (optional):
1. Install Node.js LTS
2. npm install
3. npm run dev

DEPLOY TO VERCEL:
1. Zip this folder and upload in Vercel (New Project -> Import -> Upload) OR push to GitHub and import
2. Vercel will detect Vite and deploy automatically

EDITABLE AREAS:
- src/data/ligas_equipos.json -> add/remove teams
- src/data/discounts.json -> add/remove discount codes
- public/logo-placeholder.png -> replace with your logo
- public/images/ -> add product images and reference in the JSON
