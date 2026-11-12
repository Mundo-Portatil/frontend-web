# Mundo-Portátil — Frontend Web

Aplicación web del proyecto **Mundo-Portátil**, construida con **React + Vite + TypeScript** y estilizada con **Tailwind CSS v4**. Este repositorio contiene la interfaz de usuario que consume la API del backend (`backend-api/`).

---

## 📋 Requisitos previos

Antes de empezar, asegúrate de tener instalado:

| Herramienta | Versión mínima | Verificación |
| --- | --- | --- |
| Node.js | `^20.19.0` o `>=22.12.0` | `node -v` |
| npm | `>=10` | `npm -v` |
| Git | `>=2.40` | `git --version` |
| GitHub CLI (opcional) | `>=2.40` | `gh --version` |

> Se recomienda Node.js 22 LTS o superior. La versión de Node está alineada con los requisitos de Vite 8.

---

## 🚀 Guía de inicio rápido

```bash
# 1. Clonar el repositorio
git clone https://github.com/Mundo-Portatil/frontend-web.git
cd frontend-web

# 2. Instalar dependencias
npm install

# 3. Levantar el servidor de desarrollo
npm run dev
```

La aplicación estará disponible en **http://localhost:5173**.

### Comandos disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo con HMR |
| `npm run build` | Compila TypeScript y genera la build de producción en `dist/` |
| `npm run preview` | Sirve localmente la build de producción |
| `npm run lint` | Ejecuta ESLint sobre todo el proyecto |

> Ejecuta `npm run lint` y `npm run build` antes de abrir un Pull Request.

---

## 🧱 Stack tecnológico

- **React 19** — Librería de interfaz de usuario.
- **Vite 8** — Bundler y servidor de desarrollo.
- **TypeScript 6** — Tipado estático estricto.
- **Tailwind CSS v4** — Framework de estilos utilitarios.
- **ESLint 10** — Reglas de calidad y estilo de código.

---

## 📁 Estructura del Proyecto

```text
frontend-web/
├── public/                  # Recursos estáticos servidos tal cual
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/              # Imágenes y recursos importados por el código
│   ├── App.tsx              # Componente raíz de la aplicación
│   ├── App.css              # Estilos propios del componente App
│   ├── main.tsx             # Punto de entrada de React
│   └── index.css            # Estilos globales + import de Tailwind
├── index.html               # Plantilla HTML base
├── eslint.config.js         # Configuración de ESLint (flat config)
├── postcss.config.js        # Configuración de PostCSS (Tailwind v4)
├── tsconfig.json            # Configuración raíz de TypeScript
├── tsconfig.app.json        # Configuración de TS para el código de la app
├── tsconfig.node.json       # Configuración de TS para archivos de Node
├── vite.config.ts           # Configuración de Vite
├── package.json             # Dependencias y scripts
└── README.md
```

> **Nota:** Tailwind CSS v4 **no requiere** `tailwind.config.js`. La configuración se declara directamente en CSS mediante `@theme` y el import `@import "tailwindcss";`.

---

## 🎨 Tailwind CSS v4

Tailwind se integra a través del plugin oficial de PostCSS. La configuración actual es:

**`postcss.config.js`**

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

**`src/index.css`**

```css
@import "tailwindcss";
```

### Personalizar el tema

En v4, los tokens de diseño se definen en CSS, por ejemplo:

```css
@theme {
  --color-brand: #aa3bff;
  --font-sans: "Inter", system-ui, sans-serif;
}
```

---

## 🌿 Flujo de Trabajo en Git (GitFlow)

- **`main`**: Rama de producción (código estable).
- **`develop`**: Rama base de integración diaria.
- **Características nuevas**: Crear ramas hijas desde `develop` con la nomenclatura `feature/nombre-modulo` (ej. `feature/m1-inventory`).

Para subir tus cambios:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/tu-funcionalidad
# ... realiza tus cambios ...
git add .
git commit -m "feat: descripción de los cambios"
git push origin feature/tu-funcionalidad
```

### Convención de commits

| Prefijo | Uso |
| --- | --- |
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de errores |
| `docs:` | Cambios en documentación |
| `refactor:` | Refactorización sin cambio de comportamiento |
| `style:` | Cambios de formato/estilos |
| `chore:` | Tareas de mantenimiento/configuración |

---

## 🔐 Variables de entorno

Vite expone las variables con prefijo `VITE_` a través de `import.meta.env`. Crea un archivo `.env` local (no se sube a Git):

```env
VITE_API_URL=http://localhost:3000
```

Consumo en el código:

```ts
const apiUrl = import.meta.env.VITE_API_URL
```

> El archivo `.env` está excluido por `.gitignore`. Nunca subas secretos al repositorio.
