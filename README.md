# obsig

extensión para navegadores chromium (chrome, brave, edge) hecha por pgbito, para ver quién te sigue y quién no en instagram directamente en el navegador.  
interfaz minimalista, oscura, con fuente custom, tarjetas limpias y checklist para gestionar mutuals y rogados (no mutuals).

---

**⚠️ seguridad y transparencia ante todo**

esta extensión **no guarda, no almacena ni comparte tus credenciales de instagram con ningún servidor externo**.  
todo corre 100% local en tu propio navegador. la extensión se comunica directamente con los endpoints oficiales de instagram usando las cookies de tu sesión activa (`sessionid`, `ds_user_id`, `csrftoken`), por lo que **no tenés que copiar ni pegar cookies a mano**.

> ⚠️ **importante sobre las sesiones y rate limits:**
>
> - instagram puede **limitar temporalmente las solicitudes (error 429)** si la cuenta tiene **demasiados seguidores o seguidos** o si hacés muchas consultas seguidas en poco tiempo.
> - la extensión incluye un **limitador de velocidad (throttling)** entre páginas y pausas automáticas de 3.5 segundos al dejar de seguir usuarios para evitar bloqueos temporales de acción.
> - la sesión expira naturalmente si cerrás sesión en instagram.com o después de unos días.
> - tus credenciales nunca salen de tu máquina ni tocan bases de datos de terceros.

---

## features

- **cero configuración manual de cookies:** detecta automáticamente si estás logueado en instagram.com. ya no ocupás CookieEditor ni andar copiando `sessionid`.
- **un clic para tu perfil:** botón rápido `yo` para cargar tu usuario activo automáticamente, o podés escribir el @ de cualquier cuenta para inspeccionarla.
- **separación limpia:**
  - `rogados`: cuentas que vos seguís pero que no te siguen de vuelta.
  - `mutuals`: cuentas que se siguen mutuamente.
- **unfollow masivo seguro:** checklist para marcar usuarios de la lista de rogados y dejarlos de seguir con confirmación previa y pausas de seguridad entre peticiones.
- **consola de logs en vivo:** pestaña dedicada para ver cada petición, código de respuesta HTTP, número de página y reintentos en tiempo real.
- **avatares instantáneos sin broncas de CORS:** carga y optimización rápida de fotos de perfil mediante proxy en Cloudflare con fallback automático a avatar con la inicial del usuario.
- **exportar y copiar:** botones para copiar la lista de usernames al portapapeles o descargarla en formato `.json`.
- **filtro en vivo:** buscador instantáneo dentro de cada pestaña para encontrar usuarios específicos por @ o nombre completo.

---

## instalación (chrome / brave / edge)

no ocupa compilar nada, solo cargar la carpeta de la extensión en modo desarrollador:

1. abrí tu navegador y andá a la página de extensiones:
   - **chrome / brave:** `chrome://extensions/`
   - **edge:** `edge://extensions/`
2. activá el interruptor de **Modo de desarrollador** (Developer mode) en la esquina superior derecha.
3. hacé clic en el botón **Cargar descomprimida** (Load unpacked).
4. seleccioná esta carpeta (`ext`).
5. fijá el icono de **obsig** en la barra de extensiones de tu navegador para tenerlo a mano.

---

## cómo usarla

1. abrí [instagram.com](https://www.instagram.com) en tu navegador y asegurate de tener la sesión iniciada.
2. abrí el popup de **obsig** haciendo clic en el icono de la extensión.
3. el indicador en la esquina superior derecha te mostrará si la sesión está conectada (`conectado (@usuario)`).
4. dejá el campo vacío o dale al botón `yo` para analizar tu propia cuenta (o poné el @ de otra cuenta).
5. dale a **analizar**:
   - podés ver el progreso en tiempo real en la pestaña **consola**.
   - al terminar, te pasa directo a la pestaña de **rogados** con el resumen y los conteos.
6. marcá las cuentas que querás y usá los botones para copiar, exportar a json o dejar de seguir.
