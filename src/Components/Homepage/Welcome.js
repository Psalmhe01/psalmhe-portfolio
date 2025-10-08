import "../../Style/Body.css";
import { heroPics } from "../../Files/HomeImage.js";


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
          <img src={heroPics[0]} alt="hero-1" id="hero1"/>
          <img src={heroPics[1]} alt="hero-2" id="hero2"/>
          <img src={heroPics[2]} alt="hero-3" id="hero3"/>
          <img src={heroPics[3]} alt="hero-4" id="hero4"/>
        </div>
      </div>
    </section>
  );
}

export default Welcome;
