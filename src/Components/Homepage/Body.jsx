import "../../Style/Body.css";
import ScrollReveal from "../ScrollReveal.jsx";
import Welcome from "./Welcome.jsx";
import About from "./About.jsx";
import Contact from "./Contact.jsx";
import Portfolio from "./Portfolio.jsx";

function Body() {
  return (
    <div className="body">
      <ScrollReveal>
        <Welcome />
      </ScrollReveal>
      <ScrollReveal>
        <About />
      </ScrollReveal>
      <ScrollReveal>
        <Portfolio />
      </ScrollReveal>
      <ScrollReveal>
        <Contact />
      </ScrollReveal>
    </div>
  );
}

export default Body;
