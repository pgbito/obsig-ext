
let currentUserSession = {
  userId: null,
  csrfToken: null,
  username: null,
  isLoggedIn: false
};

let analysisData = {
  targetUsername: null,
  targetUserId: null,
  followers: {},
  followings: {},
  mutuals: [],
  nomutuals: [],
  isAnalyzing: false
};

// UI Elements
const sessionBadge = document.getElementById("session-badge");
const sessionText = document.getElementById("session-text");
const targetInput = document.getElementById("target-input");
const useMyUserBtn = document.getElementById("use-my-user-btn");
const analyzeBtn = document.getElementById("analyze-btn");
const statusMsg = document.getElementById("status-message");
const progressContainer = document.getElementById("progress-container");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");

const statsBar = document.getElementById("stats-bar");
const statFollowers = document.getElementById("stat-followers");
const statFollowing = document.getElementById("stat-following");
const statMutuals = document.getElementById("stat-mutuals");
const statNomutuals = document.getElementById("stat-nomutuals");

const badgeNomutual = document.getElementById("badge-nomutual");
const badgeMutual = document.getElementById("badge-mutual");
const nomutualList = document.getElementById("nomutual-list");
const mutualList = document.getElementById("mutual-list");
const filterNomutual = document.getElementById("filter-nomutual");
const filterMutual = document.getElementById("filter-mutual");
const logsTerminal = document.getElementById("logs-terminal");

// Modals & Buttons
const confirmModal = document.getElementById("confirm-modal");
const modalTitle = document.getElementById("modal-title");
const modalDesc = document.getElementById("modal-desc");
const modalConfirmBtn = document.getElementById("modal-confirm-btn");
const modalCancelBtn = document.getElementById("modal-cancel-btn");

let pendingUnfollowList = [];

// Init on Load
document.addEventListener("DOMContentLoaded", async () => {
  setupTabs();
  setupEventListeners();
  await setupDeclarativeRules();
  await checkInstagramSession();
});

// Configure DeclarativeNetRequest dynamic rules
// 1. Overrides User-Agent on i.instagram.com to Android to avoid 400 Bad Request
// 2. Sets Origin and Referer on instagram.com requests to avoid CSRF rejection and HTML responses
// 3. Sets Instagram Referer + Access-Control-Allow-Origin on CDN images
async function setupDeclarativeRules() {
  if (!chrome.declarativeNetRequest) return;
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1, 2, 3, 4, 5],
      addRules: [
        {
          id: 1,
          priority: 2,
          action: {
            type: "modifyHeaders",
            requestHeaders: [
              {
                header: "User-Agent",
                operation: "set",
                value: "Instagram 300.0.0.29.110 Android (33/13; 420dpi; 1080x2400; Google/google; Pixel 7; cheetah; cheetah; en_US; 513948281)"
              }
            ]
          },
          condition: {
            requestDomains: ["i.instagram.com"],
            resourceTypes: ["xmlhttprequest"]
          }
        },
        {
          id: 2,
          priority: 1,
          action: {
            type: "modifyHeaders",
            requestHeaders: [
              {
                header: "Origin",
                operation: "set",
                value: "https://www.instagram.com"
              },
              {
                header: "Referer",
                operation: "set",
                value: "https://www.instagram.com/"
              }
            ]
          },
          condition: {
            requestDomains: ["instagram.com"],
            resourceTypes: ["xmlhttprequest"]
          }
        },
        {
          id: 3,
          priority: 1,
          action: {
            type: "modifyHeaders",
            requestHeaders: [
              {
                header: "Referer",
                operation: "set",
                value: "https://www.instagram.com/"
              }
            ]
          },
          condition: {
            requestDomains: ["cdninstagram.com", "fbcdn.net"],
            resourceTypes: ["image", "xmlhttprequest"]
          }
        },
        {
          id: 4,
          priority: 1,
          action: {
            type: "modifyHeaders",
            responseHeaders: [
              {
                header: "Access-Control-Allow-Origin",
                operation: "set",
                value: "*"
              }
            ]
          },
          condition: {
            requestDomains: ["cdninstagram.com", "fbcdn.net"],
            resourceTypes: ["image", "xmlhttprequest"]
          }
        }
      ]
    });
  } catch (err) {
    console.warn("No se pudieron configurar dynamic rules:", err);
  }
}

// Setup tab navigation
function setupTabs() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPane = document.getElementById(btn.getAttribute("data-tab"));
      if (targetPane) targetPane.classList.add("active");
    });
  });
}

// Log message to UI terminal
function logMessage(msg, level = "info") {
  const timestamp = new Date().toLocaleTimeString();
  const div = document.createElement("div");
  div.className = "log-entry";

  const levelClass = { info: "log-info", success: "log-success", warn: "log-warn", error: "log-error" }[level] || "log-info";

  div.innerHTML = `<span class="log-time">[${timestamp}]</span><span class="${levelClass}">${escapeHtml(msg)}</span>`;
  logsTerminal.appendChild(div);
  logsTerminal.scrollTop = logsTerminal.scrollHeight;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Read cookie from browser
async function getCookie(name) {
  try {
    let cookie = await chrome.cookies.get({ url: "https://www.instagram.com", name: name });
    if (!cookie) {
      const all = await chrome.cookies.getAll({ domain: "instagram.com", name: name });
      if (all && all.length > 0) cookie = all[0];
    }
    return cookie ? cookie.value : null;
  } catch (err) {
    console.error("Error reading cookie:", err);
    return null;
  }
}

// Verify active Instagram session
async function checkInstagramSession() {
  logMessage("revisando si hay sesión de instagram abierta...");
  try {
    const dsUserId = await getCookie("ds_user_id");
    const csrfToken = await getCookie("csrftoken");
    const sessionId = await getCookie("sessionid");

    if (dsUserId && sessionId) {
      currentUserSession.userId = dsUserId;
      currentUserSession.csrfToken = csrfToken || "";
      currentUserSession.isLoggedIn = true;

      sessionBadge.className = "session-badge connected";
      sessionText.textContent = `conectado (id: ${dsUserId})`;
      logMessage(`sesión encontrada, user id: ${dsUserId}`, "success");
      if (!csrfToken) {
        logMessage("ojo: no se detectó csrftoken en cookies. Abrí instagram.com en una pestaña si vas a dar unfollow.", "warn");
      }
      statusMsg.textContent = "hay sesión. poné un usuario o analizá tu perfil.";

      // Try to resolve current username
      fetchCurrentUsername(dsUserId);
    } else {
      currentUserSession.isLoggedIn = false;
      sessionBadge.className = "session-badge disconnected";
      sessionText.textContent = "sin sesión";
      logMessage("no hay sesión abierta en instagram.com.", "warn");
      statusMsg.textContent = "no tenés sesión de instagram en este navegador. abrí instagram.com y logueate.";
    }
  } catch (e) {
    logMessage(`error revisando la sesión: ${e.message}`, "error");
  }
}

async function fetchCurrentUsername(userId) {
  try {
    const res = await fetch(`https://i.instagram.com/api/v1/users/${userId}/info/`, {
      headers: {
        "User-Agent": "Instagram 300.0.0.29.110 Android",
        "X-IG-App-ID": "936619743392459"
      },
      credentials: "include"
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user && data.user.username) {
        currentUserSession.username = data.user.username;
        sessionText.textContent = `@${data.user.username}`;
        logMessage(`sos @${data.user.username}`, "info");
      }
    }
  } catch (e) {
    // Non-critical, fallback to ID
  }
}

function setupEventListeners() {
  useMyUserBtn.addEventListener("click", () => {
    if (currentUserSession.username) {
      targetInput.value = currentUserSession.username;
    } else if (currentUserSession.userId) {
      targetInput.value = "yo";
    } else {
      alert("no hay sesión de instagram abierta.");
    }
  });

  analyzeBtn.addEventListener("click", startAnalysis);
  targetInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") startAnalysis();
  });

  document.getElementById("clear-logs-btn").addEventListener("click", () => {
    logsTerminal.innerHTML = "";
  });

  filterNomutual.addEventListener("input", () => renderUserList(analysisData.nomutuals, nomutualList, filterNomutual.value, true));
  filterMutual.addEventListener("input", () => renderUserList(analysisData.mutuals, mutualList, filterMutual.value, false));

  document.getElementById("select-all-btn").addEventListener("click", () => {
    document.querySelectorAll(".user-check").forEach(cb => cb.checked = true);
  });

  document.getElementById("deselect-all-btn").addEventListener("click", () => {
    document.querySelectorAll(".user-check").forEach(cb => cb.checked = false);
  });

  document.getElementById("copy-nomutual-btn").addEventListener("click", () => {
    if (analysisData.nomutuals.length === 0) return alert("no hay nada que copiar.");
    navigator.clipboard.writeText(analysisData.nomutuals.map(u => u.username).join("\n"));
    alert(`${analysisData.nomutuals.length} usuarios copiados.`);
  });

  document.getElementById("copy-mutual-btn").addEventListener("click", () => {
    if (analysisData.mutuals.length === 0) return alert("no hay nada que copiar.");
    navigator.clipboard.writeText(analysisData.mutuals.map(u => u.username).join("\n"));
    alert(`${analysisData.mutuals.length} mutuals copiados.`);
  });

  document.getElementById("export-nomutual-btn").addEventListener("click", () => {
    exportToJson(analysisData.nomutuals, `rogados_${analysisData.targetUsername || "ig"}.json`);
  });

  document.getElementById("export-mutual-btn").addEventListener("click", () => {
    exportToJson(analysisData.mutuals, `mutuals_${analysisData.targetUsername || "ig"}.json`);
  });

  document.getElementById("unfollow-btn").addEventListener("click", () => {
    const checked = Array.from(document.querySelectorAll(".user-check:checked")).map(cb => ({
      username: cb.dataset.username,
      userId: cb.dataset.userid
    }));
    if (checked.length === 0) return alert("marcá al menos uno pa dejar de seguir.");

    pendingUnfollowList = checked;
    modalTitle.textContent = "¿seguro?";
    modalDesc.textContent = `¿seguro que querés dejar de seguir a ${checked.length} usuario(s)? cada uno dura 3.5 segundos entre cada uno para que instagram no se ponga bravo.`;
    confirmModal.style.display = "flex";
  });

  modalCancelBtn.addEventListener("click", () => {
    confirmModal.style.display = "none";
    pendingUnfollowList = [];
  });

  modalConfirmBtn.addEventListener("click", () => {
    confirmModal.style.display = "none";
    executeUnfollows(pendingUnfollowList);
  });
}

function exportToJson(data, filename) {
  if (!data || data.length === 0) return alert("no hay nada que exportar.");
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Resolve Username to Instagram Numerical User ID
async function resolveUserId(username) {
  logMessage(`buscando el id de @${username}...`);

  // If target matches current user
  if (
    username === "" ||
    username.toLowerCase() === "yo" ||
    username.toLowerCase() === "me" ||
    (currentUserSession.username && username.toLowerCase() === currentUserSession.username.toLowerCase())
  ) {
    logMessage(`usando el id de tu cuenta: ${currentUserSession.userId}`, "success");
    return { id: currentUserSession.userId, username: currentUserSession.username || username };
  }

  // 1. Search using mobile endpoint with declarative header
  try {
    const searchUrl = `https://i.instagram.com/api/v1/fbsearch/topsearch_flat/?query=${encodeURIComponent(username)}&context=blended`;
    const res = await fetch(searchUrl, {
      headers: {
        "X-IG-App-ID": "936619743392459"
      },
      credentials: "include"
    });

    if (res.ok) {
      const data = await res.json();
      const list = data.list || [];
      for (const item of list) {
        const u = item.user;
        if (u && u.username && u.username.toLowerCase() === username.toLowerCase()) {
          const pk = (u.pk || u.id).toString();
          logMessage(`encontré a @${u.username} (ID: ${pk})`, "success");
          return { id: pk, username: u.username };
        }
      }
      if (list.length > 0 && list[0].user) {
        const u = list[0].user;
        const pk = (u.pk || u.id).toString();
        logMessage(`no hay uno exacto, el más parecido: @${u.username} (ID: ${pk})`, "warn");
        return { id: pk, username: u.username };
      }
    } else {
      logMessage(`búsqueda móvil devolvió status ${res.status}, intentando fallback...`, "warn");
    }
  } catch (e) {
    logMessage(`falló la búsqueda móvil: ${e.message}`, "warn");
  }

  // 2. Fallback: web_profile_info
  try {
    const webUrl = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`;
    const res = await fetch(webUrl, {
      headers: {
        "X-IG-App-ID": "936619743392459",
        "X-Requested-With": "XMLHttpRequest"
      },
      credentials: "include"
    });
    if (res.ok) {
      const data = await res.json();
      if (data.data && data.data.user && data.data.user.id) {
        const pk = data.data.user.id.toString();
        logMessage(`encontré a @${username} por web_profile_info (ID: ${pk})`, "success");
        return { id: pk, username: data.data.user.username || username };
      }
    }
  } catch (e) {
    // continue to next fallback
  }

  // 3. Fallback: profile HTML scraping
  try {
    const htmlUrl = `https://www.instagram.com/${encodeURIComponent(username)}/`;
    const res = await fetch(htmlUrl, { credentials: "include" });
    if (res.ok) {
      const html = await res.text();
      const idMatch = html.match(new RegExp(`"id":"(\\d+)","[^"]*":"[^"]*","username":"${username}"`, "i")) ||
        html.match(new RegExp(`"username":"${username}"[\\s\\S]*?"id":"(\\d+)"`, "i")) ||
        html.match(/"page_id":"profilePage_(\d+)"/);
      if (idMatch && idMatch[1]) {
        const pk = idMatch[1];
        logMessage(`encontré a @${username} por html del perfil (ID: ${pk})`, "success");
        return { id: pk, username: username };
      }
    }
  } catch (e) {
    // continue
  }

  throw new Error(`no pude sacar el id de @${username}. fijate que el usuario exista.`);
}

// Fetch followers or following with pagination
async function fetchFriendships(userId, target, onProgress) {
  logMessage(`bajando ${target.toUpperCase()}...`);
  const storage = {};
  let hasNextPage = true;
  let maxId = null;
  let page = 1;
  let retries = 0;
  const maxRetries = 3;

  while (hasNextPage && retries < maxRetries) {
    let url = `https://www.instagram.com/api/v1/friendships/${userId}/${target}/?count=48`;
    if (maxId) url += `&max_id=${encodeURIComponent(maxId)}`;

    logMessage(`[${target.toUpperCase()}] pidiendo página ${page}...`);
    try {
      const res = await fetch(url, {
        headers: {
          "X-IG-App-ID": "936619743392459",
          "X-ASBD-ID": "129477",
          "X-CSRFToken": currentUserSession.csrfToken,
          "X-Requested-With": "XMLHttpRequest"
        },
        credentials: "include"
      });

      if (res.status === 429) {
        retries++;
        const waitMs = 4000 * Math.pow(2, retries);
        logMessage(`[${target.toUpperCase()}] rate limit (429), esperando ${waitMs / 1000}s...`, "warn");
        await new Promise(r => setTimeout(r, waitMs));
        continue;
      }

      if (!res.ok) {
        retries++;
        logMessage(`[${target.toUpperCase()}] error http ${res.status}, reintentando (${retries}/${maxRetries})...`, "warn");
        await new Promise(r => setTimeout(r, 3000));
        continue;
      }

      const data = await res.json();
      const users = data.users || [];
      for (const u of users) {
        if (u.username) storage[u.username] = u;
      }

      logMessage(`[${target.toUpperCase()}] pág ${page}: +${users.length} usuarios (total: ${Object.keys(storage).length})`, "success");
      onProgress(Object.keys(storage).length);

      if (data.next_max_id && (data.has_more !== false || users.length > 0)) {
        maxId = data.next_max_id;
        page++;
        retries = 0;
        await new Promise(r => setTimeout(r, 700)); // Throttling
      } else {
        hasNextPage = false;
        logMessage(`[${target.toUpperCase()}] listo, total: ${Object.keys(storage).length} usuarios.`, "success");
      }
    } catch (e) {
      retries++;
      logMessage(`[${target.toUpperCase()}] se cayó la red: ${e.message}`, "error");
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  return storage;
}

// Main Analysis Workflow
async function startAnalysis() {
  if (analysisData.isAnalyzing) return;
  if (!currentUserSession.isLoggedIn) {
    alert("primero logueate en instagram en el navegador.");
    return;
  }

  const rawUsername = targetInput.value.trim();
  analysisData.isAnalyzing = true;
  analyzeBtn.disabled = true;
  progressContainer.style.display = "block";
  progressBar.style.width = "10%";
  statsBar.style.display = "none";

  // Switch to logs tab
  document.querySelector('.tab-btn[data-tab="tab-logs"]').click();

  try {
    // 1. Resolve User
    progressText.textContent = "buscando usuario...";
    const targetInfo = await resolveUserId(rawUsername);
    analysisData.targetUserId = targetInfo.id;
    analysisData.targetUsername = targetInfo.username;

    // 2. Fetch Followers
    progressBar.style.width = "30%";
    progressText.textContent = "bajando seguidores...";
    analysisData.followers = await fetchFriendships(targetInfo.id, "followers", (count) => {
      progressText.textContent = `bajando seguidores (${count})...`;
    });

    // 3. Fetch Following
    progressBar.style.width = "65%";
    progressText.textContent = "bajando seguidos...";
    analysisData.followings = await fetchFriendships(targetInfo.id, "following", (count) => {
      progressText.textContent = `bajando seguidos (${count})...`;
    });

    // 4. Compute Mutuals & Nomutuals
    progressBar.style.width = "90%";
    progressText.textContent = "calculando...";
    const followerKeys = new Set(Object.keys(analysisData.followers));
    const followingKeys = new Set(Object.keys(analysisData.followings));

    analysisData.mutuals = Array.from(followingKeys)
      .filter(u => followerKeys.has(u))
      .map(u => analysisData.followings[u] || analysisData.followers[u])
      .sort((a, b) => a.username.localeCompare(b.username));

    analysisData.nomutuals = Array.from(followingKeys)
      .filter(u => !followerKeys.has(u))
      .map(u => analysisData.followings[u])
      .sort((a, b) => a.username.localeCompare(b.username));

    progressBar.style.width = "100%";
    progressText.textContent = "listo";
    logMessage(`listo con @${analysisData.targetUsername}: ${analysisData.mutuals.length} mutuals, ${analysisData.nomutuals.length} rogados.`, "success");

    // 5. Update UI
    statFollowers.textContent = followerKeys.size;
    statFollowing.textContent = followingKeys.size;
    statMutuals.textContent = analysisData.mutuals.length;
    statNomutuals.textContent = analysisData.nomutuals.length;
    statsBar.style.display = "flex";

    badgeNomutual.textContent = analysisData.nomutuals.length;
    badgeMutual.textContent = analysisData.mutuals.length;

    renderUserList(analysisData.nomutuals, nomutualList, filterNomutual.value, true);
    renderUserList(analysisData.mutuals, mutualList, filterMutual.value, false);

    statusMsg.textContent = `@${analysisData.targetUsername}: ${analysisData.nomutuals.length} cuentas no te siguen de vuelta.`;

    // Switch to nomutual tab
    document.querySelector('.tab-btn[data-tab="tab-nomutual"]').click();

  } catch (err) {
    logMessage(`falló el análisis: ${err.message}`, "error");
    alert(`error: ${err.message}`);
    statusMsg.textContent = `error: ${err.message}`;
  } finally {
    analysisData.isAnalyzing = false;
    analyzeBtn.disabled = false;
    setTimeout(() => { progressContainer.style.display = "none"; }, 1500);
  }
}

// Avatares: usamos images.weserv.nl (proxy de imágenes libre en Cloudflare)
// que quita el referer, habilita CORS al 100%, optimiza el peso y nunca se cae.
// Si falla, muestra el avatar de la letra.
function fallbackAvatar(username) {
  const letter = escapeHtml((username || "?").charAt(0).toUpperCase());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#2a2a2a"/><text x="20" y="26" font-size="18" font-family="sans-serif" text-anchor="middle" fill="#a3a3a3">${letter}</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function setupAvatar(img, user) {
  const url = user.profile_pic_url || user.profile_pic_url_hd;
  const fallback = fallbackAvatar(user.username);
  if (!url) {
    img.src = fallback;
    return;
  }

  // images.weserv.nl redimensiona a 68x68, cachea en Cloudflare y envía CORS *
  const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=68&h=68&fit=cover`;
  img.onerror = () => {
    img.src = fallback;
  };
  img.src = proxyUrl;
}

// Render User Cards
function renderUserList(users, container, query = "", hasCheckbox = false) {
  container.innerHTML = "";
  const filter = query.toLowerCase().trim();

  const filtered = users.filter(u => {
    const uname = (u.username || "").toLowerCase();
    const fname = (u.full_name || "").toLowerCase();
    return uname.includes(filter) || fname.includes(filter);
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state">${users.length === 0 ? "no hay nadie en esta lista." : "no salió nada con ese filtro."}</div>`;
    return;
  }

  const fragment = document.createDocumentFragment();
  filtered.forEach(u => {
    const card = document.createElement("div");
    card.className = "user-item";

    const displayName = u.full_name ? escapeHtml(u.full_name) : `@${escapeHtml(u.username)}`;

    card.innerHTML = `
      <div class="user-left">
        <img class="user-avatar" alt="" width="34" height="34" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
        <div class="user-meta">
          <h4><a href="https://www.instagram.com/${escapeHtml(u.username)}/" target="_blank">@${escapeHtml(u.username)}</a></h4>
          <p>${displayName}</p>
        </div>
      </div>
      ${hasCheckbox ? `<input type="checkbox" class="user-check" data-username="${escapeHtml(u.username)}" data-userid="${escapeHtml(u.pk || u.id || '')}" />` : ""}
    `;
    setupAvatar(card.querySelector(".user-avatar"), u);
    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

// Execute Unfollows
async function executeUnfollows(targets) {
  logMessage(`arrancando unfollow de ${targets.length} usuario(s)...`, "warn");
  document.querySelector('.tab-btn[data-tab="tab-logs"]').click();

  await setupDeclarativeRules();

  const csrf = (await getCookie("csrftoken")) || currentUserSession.csrfToken;
  if (!csrf) {
    logMessage("error crítico: no se encontró csrftoken en las cookies de Instagram. Abrí instagram.com en una pestaña.", "error");
    alert("No se encontró el token CSRF de Instagram. Por favor abrí instagram.com en una pestaña para refrescar tu sesión y volvé a intentar.");
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < targets.length; i++) {
    const item = targets[i];
    const username = typeof item === "string" ? item : item.username;
    let userId = typeof item === "object" && item.userId ? item.userId : null;

    if (!userId) {
      const userObj = analysisData.followings[username];
      userId = userObj ? (userObj.pk || userObj.id) : null;
    }

    if (!userId) {
      logMessage(`[${i + 1}/${targets.length}] no encontré el id de @${username}, lo salto.`, "warn");
      failCount++;
      continue;
    }

    logMessage(`[${i + 1}/${targets.length}] dejando de seguir a @${username} (id: ${userId})...`);
    try {
      const url = `https://www.instagram.com/api/v1/friendships/destroy/${userId}/`;
      const bodyData = new URLSearchParams({ user_id: String(userId) }).toString();

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "X-CSRFToken": csrf,
          "X-IG-App-ID": "936619743392459",
          "X-ASBD-ID": "129477",
          "X-Requested-With": "XMLHttpRequest",
          "X-Instagram-AJAX": "1",
          "Content-Type": "application/x-www-form-urlencoded"
        },
        credentials: "include",
        body: bodyData
      });

      const rawText = await res.text();
      let data = null;
      try {
        data = JSON.parse(rawText);
      } catch (_) {
        data = null;
      }

      if (res.ok && data && (data.status === "ok" || (data.friendship_status && !data.friendship_status.following))) {
        logMessage(`ya no seguís a @${username}.`, "success");
        successCount++;
        analysisData.nomutuals = analysisData.nomutuals.filter(u => u.username !== username);
        delete analysisData.followings[username];
      } else {
        failCount++;
        if (data && data.message) {
          logMessage(`error con @${username}: ${data.message}`, "error");
        } else if (rawText.includes("<!DOCTYPE") || rawText.includes("<html")) {
          logMessage(`error con @${username}: Instagram bloqueó la petición o devolvió HTML (verificá que estés logueado en instagram.com).`, "error");
        } else {
          logMessage(`error (${res.status}) con @${username}: ${rawText.slice(0, 100)}`, "error");
        }
      }
    } catch (e) {
      logMessage(`no conectó el unfollow de @${username}: ${e.message}`, "error");
      failCount++;
    }

    // Safety throttle between unfollows
    if (i < targets.length - 1) {
      logMessage(`pausa de 3.5 segundos...`, "info");
      await new Promise(r => setTimeout(r, 3500));
    }
  }

  badgeNomutual.textContent = analysisData.nomutuals.length;
  renderUserList(analysisData.nomutuals, nomutualList, filterNomutual.value, true);
  logMessage(`unfollow listo: ${successCount} bien, ${failCount} fallidos.`, "success");
  alert(`listo, ${successCount} unfollows hechos.`);
}
