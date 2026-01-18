import "../../Style/Body.css";
import { heroPics } from "../../Files/HomeImage.jsx";
import { Link } from "react-router-dom";

function Welcome() {
  return (
    <section className="hero" id="welcome">
      <div className="hero-content">
        <h2>Welcome to Psalmhe Photography</h2>
        <p>Some artists hold paintbrushes, others hold lenses...</p>
        <Link to="/portfolio" className="btn">
          View Gallery
        </Link>
        <div className="hero-images">
          <img src={heroPics[0]} alt="hero-1" id="hero1" />
          <img src={heroPics[1]} alt="hero-2" id="hero2" />
          <img src={heroPics[2]} alt="hero-3" id="hero3" />
          <img src={heroPics[3]} alt="hero-4" id="hero4" />
        </div>
      </div>
    </section>
  );
}

export default Welcome;
