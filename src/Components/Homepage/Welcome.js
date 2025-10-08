import "../../Style/Body.css";
import { herop1, herop2, herop3, herop4 } from "../../Files/HomeImage.js";

function Welcome({setActivePage}) {
    return (
        <section class="hero" id="welcome">
        <div class="hero-content">
            <h2>Welcome to Psalmhe Photography</h2>
            <p>Some artists hold paintbrushes, others hold lenses...</p>
            <a
                onClick={()=>setActivePage("PorfolioPage")}
                class="btn"
            >
                View Gallery
            </a>
            <div className="hero-images">
            <img src={herop1} />
            <img src={herop2} />
            <img src={herop3} />
            <img src={herop4} />
            </div>
        </div>
        </section>
    );
}

export default Welcome;
