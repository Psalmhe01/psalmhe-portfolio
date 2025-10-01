import '../Style/Header.css'
import '../App.css'
import { useState } from 'react'
import psalmhe from '../Assets/psalmhe.png'

function Header() {
    const [active, setActive] = useState(false)

    return(
        <div class="header">
            <div className="container header-container">
                <div className="logo">
                    <img src= {psalmhe} className="fas fa-church">
                    </img>
                    <h1>PHOTOGRAPHY</h1>
                </div>
                
                <div class="nav-toggle" id="navToggle" onClick={() => setActive(!active)}>
                    <i class="fas fa-bars"></i>
                </div>
                <nav>
                    <ul id="navMenu" className={active ? 'nav-toggle active': ''}>
                        <li><a href="#">Home</a></li>
                        <li><a href="#about">About</a></li>
                        <li><a href="#sermons">Gallery</a></li>
                        <li><a href="#contact">Contact</a></li>
                    </ul>
                </nav>
            </div>
        </div>
    )
}

export default Header;