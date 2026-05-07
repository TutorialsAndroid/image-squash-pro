function navActiveState() {
  // Set active nav link based on current URL hash or path
  const currentPage = window.location.pathname.split("/").pop(); // "index.html" or "about.html"
  const links = document.querySelectorAll(".nav-link");
  links.forEach((link) => {
    const href = link.getAttribute("href").split("/").pop();
    if (href === currentPage) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}