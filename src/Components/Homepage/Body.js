import "../../Style/Body.css";
import { useState } from "react";
import Welcome from "./Welcome";
import About from "./About";
import Contact from "./Contact";
import Portfolio from "./Portfolio";
import Images from "../../Files/SliderImages";

function Body({ setActivePage }) {

  return (
    <div className="body">
      <Welcome setActivePage={setActivePage}/>
      <About />
      <Portfolio setActivePage={setActivePage} />
      <Contact />
    </div>
  );
}

export default Body;
