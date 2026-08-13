# Login — Romicars Flow

Pantalla de acceso al CRM multiagente. Diseño moderno oscuro con estética glassmorphism, animaciones sutiles y branding prominente.

---

## Estructura General

```
┌─────────────────────────────────────────────────────────────┐
│  FONDO OSCURO ANIMADO                                        │
│  • Gradientes radiales rojos/azules flotantes                │
│  • Grid sutil azul                                           │
│  • Anillos flotantes decorativos                             │
│                                                              │
│     ┌─────────────────────────────────────┐                  │
│     │  CARD GLASS                         │                  │
│     │  ┌─────────────────────────────┐    │                  │
│     │  │      [LOGO ROMICARS]        │    │                  │
│     │  │        240 px de alto         │    │                  │
│     │  │      drop-shadow azul         │    │                  │
│     │  └─────────────────────────────┘    │                  │
│     │                                     │                  │
│     │        Romicars Flow                │                  │
│     │    Accede al panel de gestión       │                  │
│     │                                     │                  │
│     │  CORREO ELECTRÓNICO                 │                  │
│     │  ┌─────────────────────────────┐    │                  │
│     │  │ ✉ │ correo@ejemplo.com      │    │                  │
│     │  └─────────────────────────────┘    │                  │
│     │                                     │                  │
│     │  CONTRASEÑA                         │                  │
│     │  ┌─────────────────────────────┐    │                  │
│     │  │ 🔒 │ ••••••••            │ 👁 │    │                  │
│     │  └─────────────────────────────┘    │                  │
│     │                                     │                  │
│     │  ┌─────────────────────────────┐    │                  │
│     │  │      Iniciar sesión         │    │                  │
│     │  └─────────────────────────────┘    │                  │
│     │                                     │                  │
│     │  Plataforma de gestión © Romicars   │                  │
│     └─────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Fondo

| Elemento | Descripción |
|---|---|
| **Color base** | `#070e1a` — azul muy oscuro, casi negro |
| **Orbe superior-izquierdo** | Gradiente radial rojo (`rgba(229,62,62,0.12)`) de 900×900 px, posición `(-200, -200)`, animación `drift-slow` 12s |
| **Orbe inferior-derecho** | Gradiente radial azul (`rgba(59,130,246,0.1)`) de 700×700 px, animación 15s con delay |
| **Orbe central** | Gradiente radial rojo tenue (`rgba(229,62,62,0.06)`) de 400×400 px, animación 10s |
| **Grid** | Líneas azules muy tenues (`rgba(59,130,246,0.03)`) formando cuadrícula de 60×60 px |
| **Anillos flotantes** | 2 círculos solo-borde (rojo y azul) que suben lentamente con animación `float-up` |

### Animaciones
- `drift-slow`: movimiento suave + escala entre 0.95 y 1.05
- `float-up`: subida vertical lenta con fade out
- Ambas usan `ease-in-out` y `linear` para sensación orgánica

---

## Card Principal

| Propiedad | Valor |
|---|---|
| **Fondo** | `rgba(13,26,46,0.85)` con `backdrop-filter: blur(24px)` |
| **Borde** | `1px solid rgba(59,130,246,0.12)` |
| **Radio** | `20px` |
| **Ancho** | `440px` (máx. `92vw`) |
| **Padding** | `44px 40px 36px` |
| **Sombra** | `0 8px 40px rgba(0,0,0,0.5)` + línea glow superior |
| **Glow superior** | Línea horizontal azul centrada en el borde superior (`rgba(59,130,246,0.5)`) |

### Comportamiento
- Aparece con clase `fade-in-up`
- No tiene hover ni transformación; el foco visual está en los inputs y el botón

---

## Logo y Título

### Logo
| Propiedad | Valor |
|---|---|
| **Imagen** | `/logotipo.png` |
| **Altura** | `240px` |
| **Margen inferior** | `8px` |
| **Filtro** | `drop-shadow(0 4px 20px rgba(59,130,246,0.2))` |
| **Alineación** | Centrado horizontal |

### Título
| Propiedad | Valor |
|---|---|
| **Texto** | `Romicars Flow` |
| **Fuente** | Hanken Grotesk |
| **Tamaño** | `24px` |
| **Peso** | `800` |
| **Color** | `#eaf1ff` |
| **Letter-spacing** | `-0.03em` |

### Subtítulo
| Propiedad | Valor |
|---|---|
| **Texto** | `Accede al panel de gestión` |
| **Tamaño** | `14px` |
| **Color** | `rgba(148,163,184,0.8)` |
| **Margen superior** | `6px` |

---

## Inputs

### Estilo General
| Propiedad | Valor |
|---|---|
| **Fondo** | `rgba(15,23,42,0.6)` |
| **Borde** | `1px solid rgba(59,130,246,0.12)` |
| **Borde focus** | `1px solid rgba(59,130,246,0.5)` |
| **Radio** | `12px` |
| **Padding interno** | `12px 14px 12px 42px` (con icono izquierdo) |
| **Color texto** | `#eaf1ff` |
| **Placeholder** | `rgba(148,163,184,0.5)` |
| **Shadow focus** | `0 0 0 3px rgba(59,130,246,0.1)` |

### Label
| Propiedad | Valor |
|---|---|
| **Tamaño** | `12px` |
| **Peso** | `700` |
| **Color** | `rgba(148,163,184,0.9)` |
| **Transform** | `uppercase` |
| **Letter-spacing** | `0.04em` |
| **Margen inferior** | `6px` |

### Input de Correo
- Icono `Mail` a la izquierda (16px)
- Icono cambia a azul (`#60a5fa`) en focus
- Placeholder: `correo@ejemplo.com`

### Input de Contraseña
- Icono `Lock` a la izquierda
- Botón de mostrar/ocultar a la derecha:
  - Iconos: `Eye` / `EyeOff` (16px)
  - Fondo: `rgba(59,130,246,0.1)`
  - Hover: fondo azul más intenso + icono azul
  - Radio: `8px`
- Placeholder: `••••••••`

---

## Botón de Inicio de Sesión

| Propiedad | Valor |
|---|---|
| **Fondo** | `linear-gradient(135deg, #3b82f6, #2563eb)` |
| **Color texto** | `#fff` |
| **Tamaño** | `14px` |
| **Peso** | `700` |
| **Letter-spacing** | `0.01em` |
| **Radio** | `12px` |
| **Padding** | `13px 0` |
| **Ancho** | `100%` |
| **Sombra** | `0 4px 20px rgba(59,130,246,0.3)` |
| **Hover** | `translateY(-2px)` + sombra más grande |
| **Disabled** | Opacidad baja, cursor `not-allowed`, sin sombra |

### Estado de Carga
- Muestra icono `Loader2` animado (spin 1s)
- Texto cambia a `Iniciando sesión...`

---

## Mensaje de Error

| Propiedad | Valor |
|---|---|
| **Fondo** | `rgba(239,68,68,0.1)` |
| **Borde** | `1px solid rgba(239,68,68,0.2)` |
| **Radio** | `10px` |
| **Color texto** | `#FCA5A5` |
| **Tamaño** | `13px` |
| **Dot indicator** | Círculo rojo de 6px a la izquierda |

---

## Footer

| Propiedad | Valor |
|---|---|
| **Texto** | `Plataforma de gestión de clientes © Romicars` |
| **Tamaño** | `12px` |
| **Color** | `rgba(148,163,184,0.5)` |
| **Alineación** | Centrado |
| **Margen superior** | `24px` |

---

## Responsividad

| Breakpoint | Comportamiento |
|---|---|
| **Desktop** | Card centrada, 440px de ancho |
| **Mobile** | Card usa `max-width: 92vw`, logo mantiene proporción, padding se adapta |

---

## Archivos Relacionados

- `frontend/src/pages/Login.tsx` — Componente principal
- `frontend/src/index.css` — Keyframes `drift-slow`, `float-up`, `spin`
- `frontend/public/logotipo.png` — Logo de Romicars

---

## Notas de Diseño

- Todo el login está en español, incluyendo labels, placeholders y botones.
- No usa `var(--*)` del tema global; los colores están hardcodeados para garantizar la estética oscura independientemente del tema del sistema.
- La experiencia busca transmitir: profesionalismo, tecnología y confianza.
