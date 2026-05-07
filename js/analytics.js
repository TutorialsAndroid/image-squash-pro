(function() {
  const GA_ID = 'G-NSDYYX3BV8';   // ← your real measurement ID

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  script.onload = function() {
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    // Explicitly send the current page path and title
    gtag('config', GA_ID, {
      page_path: window.location.pathname + window.location.search,
      page_title: document.title
    });
  };
})();