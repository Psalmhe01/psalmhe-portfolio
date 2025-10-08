import "../../Style/Body.css";
import { herop1, herop2, herop3, herop4 } from "../../Files/HomeImage.js";

// Debug: log resolved image URLs so we can see what the build produced at runtime
console.log("Welcome hero images resolved:", {
  herop1,
  herop2,
  herop3,
  herop4,
});

function Welcome({ setActivePage }) {
  return (
    <section class="hero" id="welcome">
      <div class="hero-content">
        <h2>Welcome to Psalmhe Photography</h2>
        <p>Some artists hold paintbrushes, others hold lenses...</p>
        <a onClick={() => setActivePage("PorfolioPage")} class="btn">
          View Gallery
        </a>
        <div className="hero-images">
          <img src={herop1} alt="hero-1" id="hero1"/>
          <img src={herop2} alt="hero-2" id="hero2"/>
          <img src={herop3} alt="hero-3" id="hero3"/>
          <img src={herop4} alt="hero-4" id="hero4"/>
        </div>
        {/* Debug output: shows the resolved URLs (visible on the page) */}
        <pre
          id="debug-hero-urls"
          style={{
            whiteSpace: "pre-wrap",
            background: "#ffffffcc",
            color: "#000",
            padding: "8px",
            marginTop: "12px",
          }}
        >
          {JSON.stringify({ herop1, herop2, herop3, herop4 }, null, 2)}
        </pre>
      </div>
    </section>
  );
}

export default Welcome;
