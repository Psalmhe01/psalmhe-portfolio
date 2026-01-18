import Header from "./Components/Header.jsx";
import Body from "./Components/Homepage/Body.jsx";
import PortfolioPage from "./Components/PortfolioPage/PortfolioPage.jsx";
import Footer from "./Components/Footer.jsx";
import "./App.css";
import ProjectPage from "./Components/PortfolioPage/ProjectPage.jsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Portfolio from "./Components/Homepage/Portfolio.jsx";

function App() {
  return (
    <Router>
      <div className="App">
        <div className="body">
          <Header />
          <Routes>
            <Route path="/" element={<Body />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/portfolio/:category" element={<ProjectPage />} />
          </Routes>
          <Footer />
        </div>
      </div>
    </Router>
  );
}

export default App;
