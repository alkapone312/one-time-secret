// === THEME HANDLING ===
function applyStoredMode() {
    const stored = localStorage.getItem('theme');
    document.body.classList.toggle('dark', stored === 'dark');
}

function toggleMode() {
    const isDark = document.body.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// === MESSAGES ===
function showMessage(message, type = '') {
    const container = document.querySelector('.message');
    container.innerHTML = message;
    container.className = `message show ${type}`;
}
const error = (msg) => showMessage(msg, 'error');
const success = (msg) => showMessage(msg, 'success');

// === ANIMATION (SECTION VISIBILITY) ===
function checkVisibility() {
    const trigger = window.innerHeight * 0.9;
    document.querySelectorAll('section').forEach(section => {
        const top = section.getBoundingClientRect().top;
        section.classList.toggle('show', top < trigger);
    });
}

// === HELPERS ===
function fillText(selector, value) {
    document.querySelectorAll(selector).forEach(el => el.textContent = value);
}

function fillHref(selector, value) {
    document.querySelectorAll(selector).forEach(el => el.href = value);
}

function resetActionButton(label, handler) {
    let actionButton = document.querySelector('.action');
    const newButton = actionButton.cloneNode(true);
    newButton.textContent = label;
    newButton.addEventListener('click', handler);
    actionButton.replaceWith(newButton);

    return newButton;
}

// === ENCRYPTION / DECRYPTION ===
async function encryptData(plaintext) {
    const key = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        key,
        enc.encode(plaintext)
    );

    const rawKey = await crypto.subtle.exportKey("raw", key);
    const keyB64 = btoa(String.fromCharCode(...new Uint8Array(rawKey)));

    const cipherArray = new Uint8Array(ciphertext);
    const ivCipher = new Uint8Array(iv.length + cipherArray.length);
    ivCipher.set(iv);
    ivCipher.set(cipherArray, iv.length);

    return {
        cipherB64: btoa(String.fromCharCode(...ivCipher)),
        keyB64
    };
}

async function decryptData(cipherB64, keyB64) {
    const rawKey = Uint8Array.from(atob(keyB64), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", true, ["decrypt"]);

    const ivCipher = Uint8Array.from(atob(cipherB64), c => c.charCodeAt(0));
    const iv = ivCipher.slice(0, 12);
    const ciphertext = ivCipher.slice(12);

    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);

    return new TextDecoder().decode(decrypted);
}

// === COPY HANDLING ===
function initCopyHandlers() {
    document.querySelectorAll('.copy-action').forEach(el => {
        el.addEventListener('click', () => {
            const input = el.previousElementSibling;
            if (input?.value) {
                navigator.clipboard.writeText(input.value).catch(() => {
                    error("Failed to copy text.");
                });
            }
        });
    });
}

// === MAIN FLOW ===
const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const key = params.get("key");
const secretTextarea = document.querySelector('.secret-text');

function setupNextSecretButton() {
    resetActionButton("Generate next secret message", () => {
        window.location.href = window.location.origin + window.location.pathname;
    });
    secretTextarea.readOnly = true;
    secretTextarea.placeholder = '';
}

function setupGenerateLinkButton() {
    resetActionButton("Generate one-time link", async () => {
        const text = secretTextarea.value.trim();
        if (!text) return error("No data entered.");

        try {
            const { cipherB64, keyB64 } = await encryptData(text);
            const response = await fetch('api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({ encryptedData: cipherB64 })
            });

            const result = await response.json();
            if (!result.id) throw new Error("No ID returned from server.");

            const link = `${window.location.origin}${window.location.pathname}?id=${encodeURIComponent(result.id)}&key=${encodeURIComponent(keyB64)}`;
            document.querySelector('.result').value = link;
            document.querySelector('.result').parentElement.style.display = 'inline-flex';

            setupNextSecretButton();
            success("Link generated. Copy and share it with the recipient.");
        } catch (err) {
            error("An error occurred while generating the link.");
            console.error(err);
        }
    });
}

// === INITIALIZATION ===
applyStoredMode();
initCopyHandlers();
window.addEventListener('scroll', checkVisibility);
window.addEventListener('load', checkVisibility);
async function loadMetadata() {
    try {
        const data = await (await fetch("metadata.json")).json();
        fillText('.domain-name', data.domainName);
        fillHref('.source-link', data.sourceLink);
    } catch {
        console.warn("metadata.json could not be loaded.");
    }
}

async function revealSecret(id, key) {
    try {
        const response = await fetch(`api.php?id=${encodeURIComponent(id)}`);
        const result = await response.json();

        if (!result.data) {
            return error(result.error || "Failed to fetch data.");
        }

        const plaintext = await decryptData(result.data, key);
        secretTextarea.value = plaintext;
        secretTextarea.focus();
        success("Link revealed! Copy your data now—once you leave, it won’t be accessible again.");
    } catch (err) {
        error("Error fetching or decrypting data.");
        console.error(err);
    }
}

async function init() {
    await loadMetadata();

    if (id && key) {
        setupNextSecretButton();
        await revealSecret(id, key);
    } else {
        setupGenerateLinkButton();
    }
}

init();
