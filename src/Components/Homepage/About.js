import "../../Style/Body.css";
import AboutIMG from "../../Assets/PortfolioPics/AboutIMG.jpg";

function About() {
  return (
    <section class="about" id="about">
      <div class="about-container">
        <div class="section-title">
          <h2>About the Artist</h2>
          <div className="name-about">
            <h6>Samuel Omosowone</h6>
            <p>
              I am a freelance photographer who is passionate about creating
              magic with my lens. I have an eye for detail and I am willing to
              explore different themes, presets, moods to create an artistic
              effect. I have no professional photography or editing training but
              I have significantly gotten better between when I first began in
              2021 and now. Not Hawkeye, but will never miss a shot!
            </p>
          </div>
          <a className="btn" href="#contact">
            Learn More
          </a>
        </div>
        <div className="about-img">
          <img src={AboutIMG}></img>
        </div>
      </div>
    </section>
  );
}

export default About;
