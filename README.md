<!-- <p align="center">
  <img src="https://raw.githubusercontent.com/your-username/image-squash-pro/main/og-image.png" alt="ImageSquash Pro Logo" width="120" />
</p> -->

<h1 align="center">ImageSquash Pro</h1>
<p align="center"><strong>Professional‑grade bulk image compressor that runs entirely in your browser</strong></p>

<p align="center">
  <a href="https://tutorialsandroid.github.io/image-squash-pro/"><strong>🚀 Live Demo</strong></a> ·
  <a href="#features">Features</a> ·
  <a href="#how-it-works">How It Works</a> ·
  <a href="#usage">Usage</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#license">License</a>
</p>

<br/>

## ✨ Features

- **Extreme Compression** – Transform 80 MB images down to ~200 KB using intelligent resizing and modern codecs (WebP, JPEG, PNG).
- **100% Private** – No files ever leave your device. Everything is processed locally using the HTML5 Canvas API.
- **Batch Processing** – Drag‑and‑drop dozens of files at once, then compress them all with a single click.
- **Instant Preview** – See side‑by‑side size comparisons before downloading.
- **ZIP Export** – Download all compressed images in one convenient `.zip` archive.
- **Responsive & Modern UI** – Clean, industry‑standard interface that works on desktop and mobile.
- **Customisable Presets** – Choose between Maximum, High, Medium, Low or tweak quality, dimensions and format manually.
- **Keyboard Shortcuts** – `Ctrl+Enter` to compress all, `Ctrl+D` to download ZIP.

<br/>

## 🚀 How It Works

1. **Drop or select** images – they’re listed as cards with original file size.
2. **Adjust settings** – use the built‑in presets (like **High** for razor‑thin results) or go custom.
3. **Compress All** – the tool resizes each image to your max‑dimension limit and re‑encodes it at the chosen quality.
4. **Download** – grab individual images or the whole batch as a ZIP.

Because everything runs client‑side, **your images are never uploaded** to any server. Privacy is absolute.

<br/>

## 🧰 Tech Stack

| Layer        | Technology |
|--------------|-----------|
| Markup       | HTML5 |
| Styling      | CSS3 (custom properties, flexbox, grid, animations) |
| Logic        | Vanilla JavaScript (ES6+) |
| Compression  | HTML5 Canvas API (2D context) |
| ZIP Archives | [JSZip](https://stuk.github.io/jszip/) |
| Hosting      | GitHub Pages |

<br/>

## 📦 Usage

### Run locally
Simply clone the repository and open `index.html` in any modern browser – no server required.

```bash
git clone https://github.com/TutorialsAndroid/image-squash-pro.git
cd image-squash-pro
open index.html   # or double-click it
```

### Deploy to GitHub Pages
1. Push the repository to your GitHub account.
2. Go to **Settings → Pages** and select the branch (usually `main`) and root folder.
3. Your app will be live at `https://tutorialsandroid.github.io/image-squash-pro/`.

<br/>

## ⚙️ Configuration

All compression settings are exposed in the UI. The default **High** preset uses:
- Quality: 35%  
- Max dimension: 1920 px  
- Output format: WebP  

These values strike a balance between tiny file size and acceptable visual quality. For even smaller files, switch to **Maximum** (20% quality, 1280 px).

<br/>

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!  
Feel free to check the [issues page](https://github.com/TutorialsAndroid/image-squash-pro/issues).

<br/>

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

<br/>

<p align="center">
  Made with ❤️ by <a href="https://github.com/TutorialsAndroid">TutorialsAndroid</a>
</p>