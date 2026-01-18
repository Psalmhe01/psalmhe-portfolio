    import Header from "../Header.jsx";
    import Footer from "../Footer.jsx";
    import "../../Style/Body.css";
    import "../../Style/Portfolio.css";
    import Images from "../../Files/SliderImages.jsx";
    import { Link } from "react-router-dom";

    function PortfolioPage() {
    return (
        <section id="sermon" className="portfolio">
        <div className="section-title">
            <h2>My Portfolio</h2>
            <p>A display of my greatest works</p>
        </div>
        <div className="portfolio-grid">
            {Images.map((item, i) => (
            <Link 
                to={`/portfolio/${item.title}`}
                className="portfolio-item"
            >
                <div
                    key={i}
                    style={{ cursor: "pointer" }}
                >
                    <img src={item.image} alt={item.title} />
                    <h3 id={item.title}>{item.title}</h3>
                    <h6>Click to view</h6>
                </div>
            </Link>
            ))}
        </div>
        </section>
    );
    }

    export default PortfolioPage;
