const app = document.getElementById("app");

let entropy = { mouseMoves: [], keyPresses: [], startTime: Date.now() };

// Collectors
document.addEventListener("mousemove", (e) => {
  if (entropy.mouseMoves.length < 50)
    entropy.mouseMoves.push({
      x: e.clientX,
      y: e.clientY,
      t: Date.now() - entropy.startTime,
    });
});
document.addEventListener("keydown", (e) => {
  if (entropy.keyPresses.length < 50)
    entropy.keyPresses.push({ k: e.code, t: Date.now() - entropy.startTime });
});

async function boot() {
  await new Promise((r) => setTimeout(r, 600));

  if (navigator.webdriver) {
    return;
  }

  // Check if Turnstile is ready
  if (typeof turnstile === "undefined") {
    return;
  }

  turnstile.render("#captcha-container", {
    sitekey: "0x4AAAAAACN4ebRWQhDuAqeS", // Updated from user screenshot
    callback: async (token) => {
      await fetchContent(token);
    },
  });
}

// Universal Content Mode: All paths load the same home content
function getRequestedKey() {
  return "home_content";
}

async function fetchContent(token) {
  try {
    const key = getRequestedKey();

    const proof = {
      t: token,
      k: key, // Send the requested key
      env: { ua: navigator.userAgent },
      bhv: { m: entropy.mouseMoves.length, k: entropy.keyPresses.length },
    };

    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proof),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Server Verification Failed");
    }

    const data = await res.json();
    // updateProgress(100); // Removed progress bar logic earlier
    // STATUS_EL.textContent = "REDIRECTING...";

    // Redirect Mode: The 'content' from server is now a URL
    window.location.href = data.content;
  } catch (e) {
    console.error(e);
    // Error handling visual (optional)
  }
}

// unlock function removed as we are redirecting
// function unlock(htmlContent) { ... }

boot();
