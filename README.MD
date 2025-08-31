# One Time Secret

A simple **one-time secret sharing application** that allows users to securely send sensitive data.  
The application ensures that the shared secret can be accessed **only once** and then is immediately destroyed.

---

## ✨ Features

- 🔒 **End-to-end encryption** — all encryption and decryption happens **in the browser** (client-side).
- 🔑 **One-time access** — after the secret is viewed once, it is **deleted permanently** from the server.
- ⏳ **Time-limited storage** — secrets expire automatically after **24 hours** if not accessed.
- 🌐 **Open-source** — you can review the code yourself and verify how it works.
- 🌓 **Light/Dark mode toggle** for a pleasant user experience.

---

## 🛠 How it works

1. Data are **encrypted directly in the browser** using a randomly generated key.
2. The encrypted data are sent to the server and assigned a **unique identifier**.
3. A **one-time link** is generated that contains both the identifier and the decryption key.
4. The encrypted data remain on the server for **up to 1 hour** or until the link is used.
5. When the recipient opens the link:
   - The server provides the encrypted data.
   - The data are immediately **deleted from the server**.
   - The key from the link is used in the browser to **decrypt** the message.

---

## 🚀 Usage

1. **Enter your secret** in the text area.
2. **Generate a link** by clicking the action button.
3. **Share the link** securely with the recipient.
4. Once the recipient opens the link, the secret:
   - Is decrypted in their browser.
   - Is **removed** from the server automatically.

---

## 🔧 Development

1. Clone the repository:
    ```bash
    git clone https://github.com/twoj-repo/one-time-secret.git
    cd one-time-secret
    ```

2. Set up `DB_FILE` environment variable.

3. Run with a simple HTTP server for local testing:

    ```bash
    php -S localhost:8000
    ```

4. Access the app at [http://localhost:8000](http://localhost:8000).

---

## 📜 License

This project is released under the **MIT License**.
You are free to use, modify, and distribute it under the terms of the license.

## Links

🔴 Live version: [[LINK]](https://chafften.net/one-time-secret/)
