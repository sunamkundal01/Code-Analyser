// background.js
let popupWindowId = null; // Keep track of the popup window's ID
let lastSelectedText = "";

// (getSelectedTextFromActiveTab function remains the same as before)
async function getSelectedTextFromActiveTab() {
  try {
    const [currentWindow] = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
    if (!currentWindow) {
      console.log("[Background] No normal window found to get selection from.");
      return "";
    }
    const [activeTab] = await chrome.tabs.query({ active: true, windowId: currentWindow.id });
    if (!activeTab || activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('chrome-extension://') || activeTab.url.startsWith('https://chrome.google.com/webstore')) {
      console.log("[Background] Active tab is not a webpage or no active tab found.");
      return "";
    }
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: () => window.getSelection().toString(),
    });
    if (injectionResults && injectionResults[0] && injectionResults[0].result) {
      return injectionResults[0].result;
    }
    return "";
  } catch (e) {
    console.error("[Background] Error getting selected text in background:", e);
    return "";
  }
}


chrome.action.onClicked.addListener(async (tab) => {
  console.log("[Background] Action icon clicked on Tab ID:", tab.id, "URL:", tab.url);
  lastSelectedText = await getSelectedTextFromActiveTab();
  console.log("[Background] Captured selected text (first 100 chars):", lastSelectedText.substring(0, 100));

  const windowWidth = 400;
  const windowHeight = 650; // Or your preferred dimensions

  // Get the window that the action icon was clicked IN to position the new popup.
  chrome.windows.get(tab.windowId, {}, (clickedWindow) => {
    let left, top;
    if (chrome.runtime.lastError || !clickedWindow) {
        console.warn("[Background] Failed to get details of the window where icon was clicked. Using default positioning.");
        // Fallback positioning if needed, e.g., center screen or default.
        // For simplicity, we might let Chrome decide if clickedWindow details are unavailable.
    } else {
        left = clickedWindow.left + Math.round((clickedWindow.width - windowWidth) / 2);
        top = clickedWindow.top + Math.round((clickedWindow.height - windowHeight) / 2);
    }

    // Check if a popup window is already open
    if (popupWindowId !== null) {
      chrome.windows.get(popupWindowId, {}, (existingWindow) => {
        if (chrome.runtime.lastError) {
          // The previous popup window ID is invalid (likely closed by user)
          console.log("[Background] Previous popup window not found. Creating a new one.");
          popupWindowId = null; // Reset ID
          createPopupWindow(left, top, windowWidth, windowHeight);
        } else {
          // Popup window exists. Close it.
          console.log("[Background] Existing popup window found (ID:", popupWindowId, "). Closing it now.");
          chrome.windows.remove(popupWindowId, () => {
            if (chrome.runtime.lastError) {
                console.error("[Background] Error removing previous popup:", chrome.runtime.lastError.message);
            }
            popupWindowId = null; // Reset ID
            // OPTIONALLY: Re-open a new one. If you just want it to toggle close, stop here.
            // To make it toggle open/close, you might need a state variable to decide if you should reopen.
            // For the request "when i click on the extension again the prev open window get closed",
            // simply closing is the direct answer. If you want it to then REOPEN, uncomment createPopupWindow.
            // createPopupWindow(left, top, windowWidth, windowHeight);
            console.log("[Background] Previous popup closed. A new one will not be opened automatically by this logic block.");
          });
        }
      });
    } else {
      // No known popup window open, so create a new one
      console.log("[Background] No known popup window. Creating a new one.");
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
    left: left !== undefined ? Math.max(0, left) : undefined, // Ensure not off-screen
    top: top !== undefined ? Math.max(0, top) : undefined,     // Ensure not off-screen
    focused: true
  }, (win) => {
    if (win) {
      popupWindowId = win.id; // Store the new window's ID
      console.log("[Background] Popup window created with ID:", popupWindowId);
    } else {
      console.error("[Background] Failed to create popup window:", chrome.runtime.lastError?.message);
      popupWindowId = null; // Ensure it's null if creation failed
    }
  });
}

// Listener for when ANY window is closed
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === popupWindowId) {
    console.log("[Background] Monitored popup window (ID:", windowId, ") was closed by user or other means.");
    popupWindowId = null; // Reset our tracked ID
  }
});

// Message listener for popup to request selected text
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getSelectedText") {
    console.log("[Background] Popup requested selected text. Sending (first 100 chars):", lastSelectedText.substring(0,100));
    sendResponse({ text: lastSelectedText });
    return true; // Indicates you wish to send a response asynchronously
  }
  // Listener for when popup sends updated text (if already open)
  // This might be redundant if we close and reopen, but good for focusing an existing window.
  // Given the "close previous" logic, this specific message might not be hit often.
  if (message.action === "updateSelectedText") {
     // This case is less relevant if we always close and potentially reopen.
     // If we were just focusing, this would be important.
     console.log("[Background] Received 'updateSelectedText' from popup, new text:", message.text.substring(0,100));
     lastSelectedText = message.text;
     sendResponse({status: "Background received updated text"});
     return true;
  }
});
