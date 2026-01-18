    import "../Style/Header.css";
    import "../App.css";
    import { useState, useRef, useEffect } from "react";
    import { logoAbt } from "../Files/HomeImage.jsx";
    import { Link, Navigate, useNavigate } from "react-router-dom";

    function Header() {
    const [active, setActive] = useState(false);
    const menuRef = useRef(null);
    const toggleRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        function handleDocClick(e) {
        // If menu isn't open, nothing to do
        if (!active) return;
        const menuEl = menuRef.current;
        const toggleEl = toggleRef.current;
        if (!menuEl || !toggleEl) return;

        // If the click target is inside menu or toggle, keep it open
        if (menuEl.contains(e.target) || toggleEl.contains(e.target)) return;

        // Otherwise close the menu
        setActive(false);
        }

        document.addEventListener("click", handleDocClick);
        return () => document.removeEventListener("click", handleDocClick);
    }, [active]);

    return (
        <div className="header">
        <div className="container header-container">
            <div className="logo">
            <Link to="/">
                <img src={logoAbt[0]} alt="Psalmhe Logo" />
            </Link>
            <h1>PHOTOGRAPHY</h1>
            </div>

            <div
            className="nav-toggle"
            id="navToggle"
            ref={toggleRef}
            onClick={() => setActive(!active)}
            onMouseOver={() => setActive(true)}
            >
            <i class="fas fa-bars"></i>
            </div>
            <nav>
            <ul id="navMenu" ref={menuRef} className={active ? "active" : ""}>
                <li>
                <Link to="/" onClick={() => setActive(false)}>
                    Home
                </Link>
                </li>
                <li>
                <a onClick={() => {setActive(false); navigate("/")}} href="#about">
                    About
                </a>
                </li>
                <li>
                <Link to="/portfolio" onClick={() => {setActive(false); window.scrollTo(top= 0, behavior=smooth)}}>
                    Gallery
                </Link>
                </li>
                <li>
                    <a href="#contact"  onClick={() => {setActive(false); navigate("/")}}>
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
