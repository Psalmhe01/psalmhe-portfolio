import Slider from "./Slider";
import Images from "../../Files/SliderImages";

function Portfolio({ setActivePage }) {
  return (
    <section className="gallery" id="gallery">
        <div className="section-title">
            <h2>My Portfolio</h2>
            <p>A display of my greatest works</p>
        </div>
        <Slider items={Images} setActivePage={setActivePage} />
    </section>
  );
}

export default Portfolio;
