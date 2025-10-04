import Header from "../Header";
import Footer from "../Footer";
import "../../Style/Body.css";
import "../../Style/Portfolio.css";
import Images from "../../Files/SliderImages";
import { useState } from "react";
import ProjectPage from "./ProjectPage";

function PortfolioPage() {
    const [visibility, setIsVisible] = useState(false);
    const [selected, setSelected] = useState(null);

    // when a category title is clicked we show the ProjectPage for that category
    const openProject = (title) => {
        setSelected(title);
        setIsVisible(true);
    };

    // array of titles (not strictly required but helpful)
    const titles = Images.map((it) => it.title);
    // index of the currently selected category in Images
    const currentIndex = selected ? Images.findIndex((it) => it.title === selected) : -1;

    // if visible, render ProjectPage
    if (visibility && selected) {
        return <div>
                    <ProjectPage cat={selected} />
                    <div className="page-ref">
                        <button
                            onClick={() => {
                                if (currentIndex > -1) {
                                    const prev = (currentIndex - 1 + Images.length) % Images.length;
                                    setSelected(Images[prev].title);
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                }
                            }
                            }
                        >
                            <i className="fa-solid fa-angle-left" />
                            Previous Project
                        </button>
                        <button
                            onClick={() => {
                                setIsVisible(false);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                        >
                            Back to Portfolio
                        </button>
                        <button
                            onClick={() => {
                                if (currentIndex > -1) {
                                    const next = (currentIndex + 1) % Images.length;
                                    setSelected(Images[next].title);
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                }
                            }}
                        >
                            Next Project
                            <i className="fa-solid fa-angle-right" />
                        </button>
                    </div>
                </div>;
    }

    return (
        <section id="sermon" className="portfolio">
        <div className="section-title">
            <h2>My Portfolio</h2>
            <p>A display of my greatest works</p>
        </div>
        <div className="portfolio-grid">
            {Images.map((item, i) => (
            <div className="portfolio-item" key={i}>
                <img src={item.image} alt={item.title} />
                <h3
                id={item.title}
                onClick={() => (openProject(item.title), window.scrollTo({top: 0, behavior: "smooth"}))}
                style={{ cursor: "pointer" }}
                >
                {item.title}
                </h3>
            </div>
            ))}
        </div>
        </section>
    );
}

export default PortfolioPage;
