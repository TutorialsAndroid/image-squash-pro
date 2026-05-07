(function () {
  const STORAGE_KEY = "imagesquash_welcome_seen";

  // Only show if not seen before
  if (localStorage.getItem(STORAGE_KEY)) return;

  // Build overlay
  const overlay = document.createElement("div");
  overlay.className = "welcome-overlay";
  overlay.innerHTML = `
    <div class="welcome-dialog">
      <div class="welcome-icon">
        <img src="assets/logo/picture.png" alt="ImageSquash Pro" style="width:36px; height:36px; object-fit:contain;">
      </div>
      <div class="welcome-title">Welcome to ImageSquash Pro</div>
      <div class="welcome-subtitle">
        Professional‑grade bulk image compression that runs entirely on your device.<br/>
        <strong>No uploads, 100% private.</strong>
      </div>
      <div class="welcome-actions">
        <button class="btn btn-primary" id="welcomeDismiss">Get Started</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Dismiss handler
  const close = () => {
    overlay.remove();
    localStorage.setItem(STORAGE_KEY, "1");
  };

  overlay.querySelector("#welcomeDismiss").addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
})();
