// background.js
let popupWindowId = null;
let lastSelectedText = ""; // Stores the most recently selected text

chrome.action.onClicked.addListener(async (tab) => {
  // 'tab' is the tab where the extension icon was clicked.
  console.log("[Background] Action icon clicked on Tab ID:", tab.id, "URL:", tab.url);

  // Reset selected text for this new invocation
  lastSelectedText = "";

  // Check if the tab URL is one where scripting might be restricted
  if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('https://chrome.google.com/webstore'))) {
    console.warn("[Background] Cannot inject script into restricted URL:", tab.url);
    // Popup will still open but will show no code selected.
  } else if (!tab.id) {
    console.error("[Background] Clicked tab has no ID. Cannot get selection.");
  }
  else {
    try {
      // Attempt to get selected text from the tab where the icon was clicked
      const injectionResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection().toString(),
      });

      if (injectionResults && injectionResults[0] && injectionResults[0].result) {
        lastSelectedText = injectionResults[0].result;
        console.log("[Background] Successfully captured selected text (first 100 chars):", lastSelectedText.substring(0, 100));
      } else {
        console.log("[Background] No text selected on the page, or failed to retrieve selection.");
      }
    } catch (e) {
      console.error("[Background] Error injecting script or getting selection:", e.message, "on Tab ID:", tab.id);
      // lastSelectedText remains empty
    }
  }

  const windowWidth = 400;
  const windowHeight = 650;

  // Get the window that the action icon was clicked IN to position the new popup.
  chrome.windows.get(tab.windowId, {}, (clickedWindow) => {
    let left, top;
    if (chrome.runtime.lastError || !clickedWindow) {
      console.error("[Background] Failed to get clicked window details:", chrome.runtime.lastError?.message);
      // Fallback positioning (center of screen or default)
    } else {
      left = clickedWindow.left + Math.round((clickedWindow.width - windowWidth) / 2);
      top = clickedWindow.top + Math.round((clickedWindow.height - windowHeight) / 2);
    }

    if (popupWindowId !== null) {
      chrome.windows.get(popupWindowId, {}, (existingWindow) => {
        if (chrome.runtime.lastError) { // Existing popup was closed
          popupWindowId = null;
          createPopupWindow(left, top, windowWidth, windowHeight);
        } else { // Popup already open, focus it and send new text
          chrome.windows.update(popupWindowId, { focused: true });
          chrome.runtime.sendMessage(
            { action: "updateSelectedText", text: lastSelectedText },
            (response) => {
              if (chrome.runtime.lastError) {
                console.log("[Background] Popup not listening or closed when trying to update text:", chrome.runtime.lastError.message);
              }
            }
          );
        }
      });
    } else {
      createPopupWindow(left, top, windowWidth, windowHeight);
    }
  });
});

function createPopupWindow(left, top, width, height) {
  chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"),
    type: "popup",
    width: width,
    height: height,
    left: left !== undefined ? Math.max(0, left) : undefined,
    top: top !== undefined ? Math.max(0, top) : undefined,
    focused: true // Give focus to the new popup window
  }, (win) => {
    if (win) {
      popupWindowId = win.id;
      console.log("[Background] Popup window created with ID:", win.id);
    } else {
      console.error("[Background] Failed to create popup window:", chrome.runtime.lastError?.message);
    }
  });
}

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === popupWindowId) {
    console.log("[Background] Popup window with ID:", windowId, "was closed.");
    popupWindowId = null;
  }
});

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getSelectedText") {
    console.log("[Background] Popup requested selected text. Sending:", lastSelectedText.substring(0,100));
    sendResponse({ text: lastSelectedText });
    return true; // Required for async sendResponse
  }
});
