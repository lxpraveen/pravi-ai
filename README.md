# Pravi AI

A beginner-friendly AI chatbot starter project built with HTML, CSS, JavaScript, Node.js, Express, and Google's Gemini API.

## Requirements
- Node.js LTS and npm
- A Gemini API key from https://aistudio.google.com/apikey

## Run on Windows
1. Extract `pravi-ai.zip`.
2. Open the extracted `pravi-ai` folder in VS Code.
3. In VS Code, choose **Terminal → New Terminal**.
4. Install dependencies:
   ```bash
   npm install
   ```
5. Copy `.env.example` and name the copy `.env` (keep the original example file).
   - In File Explorer, you may need to enable **View → Show → File name extensions**.
   - Open `.env` and replace `paste_your_gemini_api_key_here` with your key.
   - Do not add quotes around the key and do not share it.
6. Start the app:
   ```bash
   npm start
   ```
7. Open http://localhost:3000 in your browser.

To stop the server, return to the terminal and press `Ctrl + C`.

## Security notes
- The browser calls your own Express backend. The API key is read only by the server from `.env`.
- `.env` is listed in `.gitignore`. Do not upload it, screenshot it, or paste the key into frontend files.
- Never publish this local development server directly to the internet without adding appropriate production protections such as rate limiting, authentication where appropriate, and usage monitoring.
- API access and pricing/quotas depend on Google's current terms and your account.

## Troubleshooting
- **API key missing:** ensure the file is named exactly `.env` and restart `npm start`.
- **AI request failed:** check that the key is valid, Gemini API is enabled for your project, your account has quota/access, and you have internet.
- **Port already in use:** close the other server using port 3000, or set another `PORT` in `.env`.
