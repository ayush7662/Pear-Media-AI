import Navbar from "./components/layout/Navbar";
import TextToImage from "./components/features/TextToImage";
import ImageUpload from "./components/features/ImageUpload";
import { ThemeProvider } from "./context/ThemeContext";
import "./styles/global.css";

function App() {
  return (
    <ThemeProvider>
      <div className="app-bg" aria-hidden="true" />
      <div className="app-shell">
        <Navbar />
        <main className="main-content">
          <header className="hero">
            <span className="hero-badge">Pear Media · assignment prototype</span>
            <h2>Text &amp; image generation workspace</h2>
            <p>
              NLP analysis → enhanced prompts → approval → images; upload or URL
              → captioning → variations. APIs: Hugging Face Inference + Pollinations.
            </p>
          </header>
          <div className="card-grid">
            <TextToImage />
            <ImageUpload />
          </div>
          <p className="footer-note">
            Pear Media AI · React · Express · Hugging Face · Pollinations
          </p>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
