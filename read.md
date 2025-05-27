# Code Analyzer (Gemini) - Chrome Extension

Quickly analyze code snippets from any webpage for time/space complexity and code quality using Google's Gemini API. Ideal for developers on platforms like LeetCode, GeeksforGeeks, CodeChef, and Codeforces.

## Key Features

*   **Complexity Analysis:** Get Big O notation for time and space complexity.
*   **Detailed Explanations:** Understand how complexities are derived.
*   **Code Quality Feedback:** Receive tips on readability, efficiency, and best practices.

*   **Secure API Key Storage:** Your Gemini API key is stored locally and securely.

## Quick Install

1.  **Download:** Get the `code-analyzer-extension` folder. Ensure it includes:
    ```
    manifest.json, popup.html, popup.css, popup.js, options.html, options.js, background.js, marked.min.js, images/ (with icons)
    ```
2.  **Open Chrome Extensions:** Go to `chrome://extensions`.
3.  **Enable Developer Mode:** Toggle it on (usually top-right).
4.  **Load Unpacked:** Click "Load unpacked" and select the `code-analyzer-extension` folder.
    *   The extension icon will appear in your Chrome toolbar.

## How to Use

1.  **Set Your Gemini API Key (One-time setup):**
    *   Right-click the extension icon → "Options".
    *   Paste your Gemini API Key and click "Save Key".
    *   *(Need a key? See "Get Your Gemini API Key" below.)*

2.  **Analyze Code:**
    *   On any webpage, select the code snippet you want to analyze.
    *   **Important:** Press `Ctrl+C` (Windows/Linux) or `Cmd+C` (Mac) to copy the selected code. This ensures the tool works reliably, especially on sites like GFG, CodeChef, etc.
    *   Click the extension icon in your Chrome toolbar.
    *   Choose an analysis option:
        *   **Get Time/Space Complexity (O notation)**
        *   **Explain Time/Space Complexity**
        *   **Get Code Quality Feedback**
    *   View results in the popup. Click "Close" when done.

## Get Your Gemini API Key

1.  Visit [Google AI Studio](https://aistudio.google.com/apikey).
2.  Sign in and create a new API key.
    *   The free tier for the `gemini-1.5-flash-latest` model is recommended and usually sufficient.
3.  Copy the generated API key.
4.  Paste it into the extension's "Options" page as described in "How to Use".

## Notes & Troubleshooting

*   **Selection Issues on GFG, CodeChef, etc.?:** Always **copy (Ctrl+C / Cmd+C)** the code after selecting it. The extension will automatically use the clipboard content if direct page selection fails.
*   **"API Key not set":** Ensure your key is saved in the extension's "Options".
*   **API Errors:** Check your API key. You might have hit free tier limits (check Google AI Studio). Very long code snippets could also cause issues, but this is rare for typical selections.


## Future Ideas

*   User-selectable Gemini models.
*   Hints for users stuck on coding problems.
*   Analysis history.

## Attribution

Made by Sunam
git commit -m "Initial commit"