import "../../Style/Body.css";
import { useState } from "react";
import Welcome from "./Welcome.jsx";
import About from "./About.jsx";
import Contact from "./Contact.jsx";
import Portfolio from "./Portfolio.jsx";
import Images from "../../Files/SliderImages.jsx";

function Body() {
  return (
    <div className="body">
      <Welcome />
      <About />
      <Portfolio />
      <Contact />
    </div>
  );
}

export default Body;
