import Slider from "./Slider.jsx";
import Images from "../../Files/SliderImages.jsx";

function Portfolio() {
  return (
    <section className="gallery" id="gallery">
      <div className="section-title">
        <h2>My Portfolio</h2>
        <p>A display of my greatest works</p>
      </div>
      <Slider items={Images} />
    </section>
  );
}

export default Portfolio;
