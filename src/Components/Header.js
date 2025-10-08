import "../Style/Header.css";
import "../App.css";
import { useState } from "react";
import { logoAbt } from "../Files/HomeImage.js";

function Header({ activePage, setActivePage }) {
    const [active, setActive] = useState(false);

    return (
        <div className="header">
        <div className="container header-container">
            <div className="logo">
            <img src={logoAbt[0]} alt="Psalmhe Logo" />
            <h1>PHOTOGRAPHY</h1>
            </div>

            <div className="nav-toggle" id="navToggle" onClick={() => setActive(!active)}>
                <i class="fas fa-bars"></i>
            </div>
            <nav>
            <ul id="navMenu" className={active ? "active" : ""}>
                <li>
                <a onClick={() => setActivePage("Body")} href="#">
                    Home
                </a>
                </li>
                <li>
                <a onClick={() => setActivePage("Body")} href="#about">
                    About
                </a>
                </li>
                <li>
                <a onClick={() => setActivePage("PorfolioPage")} href="#">
                    Gallery
                </a>
                </li>
                <li>
                <a onClick={() => setActivePage("Body")} href="#contact">
                    Contact
                </a>
                </li>
            </ul>
            </nav>
        </div>
        </div>
    );
}

export default Header;
