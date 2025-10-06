import '../Style/Header.css'
import '../App.css'
import { useState } from 'react'
import psalmhe from '../Assets/psalmhe.png'
import PortfolioPage from './PortfolioPage/PortfolioPage';

function Header({activePage, setActivePage}) {
    const [active, setActive] = useState(false);
    
    return(
        <div class="header">
            <div className="container header-container">
                <div className="logo">
                    <img src= {psalmhe} className="fas fa-church" />
                    <h1>PHOTOGRAPHY</h1>
                </div>
                
                <div class="nav-toggle" id="navToggle" onClick={() => setActive(!active)}>
                </div>
                <nav>
                    <ul id="navMenu" className={active ? 'nav-toggle active': ''}>
                        <li><a onClick={() => (setActivePage("Body"))} href='#'>Home</a></li>
                        <li><a onClick={() => (setActivePage("Body"))} href="#about">About</a></li>
                        <li><a onClick={() => (setActivePage("PorfolioPage"))} href='#'>Gallery</a></li>
                        <li><a onClick={() => (setActivePage("Body"))} href="#contact">Contact</a></li>
                    </ul>
                </nav>
            </div>
        </div>
    )
}

export default Header;