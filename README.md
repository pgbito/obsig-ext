# obsig

extensión para navegadores chromium (google chrome, brave, microsoft edge, opera) hecha por **pgbito** para ver quién te sigue y quién no te sigue de vuelta en instagram, directamente desde tu navegador y sin pedirte contraseñas.

---

## ⚠️ seguridad y privacidad (100% transparente)

- **no te pide contraseña ni guarda tus datos:** la extensión funciona con tu sesión activa de instagram en el navegador.
- **cero servidores externos:** todo corre de forma local en tu computadora. no se envía información a ninguna base de datos ni a terceros.
- **no ocupás instalar python ni saber programar.**

> 💡 **nota sobre instagram:** instagram tiene límites para evitar spam. si tenés miles de seguidores o hacés muchas consultas seguidas, instagram puede poner pausas temporales (error 429). la extensión ya incluye tiempos de espera automáticos para proteger tu cuenta.

---

## 📥 cómo descargar e instalar (paso a paso para principiantes)

No ocupás saber nada de git ni de código. Solo seguí estos 3 pasos:

### paso 1: descargar los archivos a tu compu
1. En esta misma página de GitHub, arriba a la derecha, hacé clic en el botón verde que dice **`<> Code`** (o **Código**).
2. En el menú que se despliega, hacé clic en **`Download ZIP`** (Descargar ZIP).
3. Buscá el archivo descargado (`obsig-ext-main.zip`) en tu carpeta de *Descargas* y **descomprimilo** (clic derecho -> *Extraer todo* / *Extract all*).  
   *(¡Ojo! Tenés que descomprimirlo; no podés cargar el archivo .zip directamente).*

### paso 2: activar el modo desarrollador en tu navegador
1. Abrí tu navegador (Chrome, Brave, Edge) y pegá este enlace en la barra de direcciones:
   - **En Google Chrome o Brave:** `chrome://extensions/`
   - **En Microsoft Edge:** `edge://extensions/`
2. En la esquina superior derecha de la pantalla, prendé el interruptor que dice **Modo de desarrollador** (*Developer mode*).

### paso 3: cargar la extensión
1. Hacé clic en el botón que dice **Cargar descomprimida** (*Load unpacked*) en la esquina superior izquierda.
2. Se abrirá una ventana para elegir carpeta: buscá y seleccioná la carpeta que descomprimiste (**`obsig-ext-main`**, la que contiene el archivo `manifest.json`).
3. ¡Listo! Ya te va a aparecer **obsig** en tu lista de extensiones.
4. **Recomendación:** Hacé clic en el icono de la pieza de rompecabezas (Extensiones) en la barra superior de tu navegador y dale al botón de fijar (pin 📌) para tener el icono de **obsig** siempre visible.

---

## 🚀 cómo se usa

1. Abrí una pestaña normal en [instagram.com](https://www.instagram.com) y asegurate de tener tu cuenta abierta.
2. Hacé clic en el icono de **obsig** en la barra de tu navegador.
3. Arriba a la derecha verás una luz verde indicando **`conectado`** con tu sesión.
4. Hacé clic en el botón **`ver mi propia cuenta`** (o escribí el `@usuario` de cualquier perfil público que querás revisar).
5. Dale al botón azul **`analizar`**:
   - Podés ir a la pestaña **`consola`** para ver el progreso de descarga de seguidores en vivo.
   - Cuando termine, verás el resumen y la lista de **`rogados`** (cuentas que vos seguís pero que ellos no te siguen a vos) y **`mutuals`** (cuentas que se siguen mutuamente).
6. Podés usar el buscador para filtrar nombres o usuarios, o los botones de **`copiar`** y **`exportar json`** para guardar la lista en tu compu.

---

## 🔄 cómo actualizar la extensión si sale una versión nueva

1. Descargás el nuevo ZIP desde este repo y reemplazás los archivos en tu carpeta.
2. Vas de nuevo a `chrome://extensions/`.
3. Buscás **obsig** y le hacés clic al icono de la flechita circular (**Recargar**).
