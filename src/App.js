import Header from "./Components/Header";
import activePage from "./Components/Header";
import Body from "./Components/Homepage/Body";
import PortfolioPage from "./Components/PortfolioPage/PortfolioPage";
import Footer from "./Components/Footer";
import "./App.css";
import ProjectPage from "./Components/PortfolioPage/ProjectPage.js";
import { useState } from "react";


function App() {
    const [activePage, setActivePage] = useState("Body")
    
  return (
    <div className="App">
      <div className="body">
  <Header activePage={activePage} setActivePage={setActivePage}/>
  {(activePage == "Body" )? <Body setActivePage={setActivePage} /> : <PortfolioPage />}
        <Footer />
      </div>
    </div>
  );
}

export default App;
