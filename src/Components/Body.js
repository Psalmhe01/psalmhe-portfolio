import '../Style/Body.css'

import Welcome from '../Components/Welcome.js'
import About from '../Components/About.js'
import Contact from '../Components/Contact.js'
import Portfolio from '../Components/Portfolio.js'

function Body(){

    return (
        <div>
            <Welcome />    
            <About/>
            <Portfolio />
            <Contact />
        </div>
    )

}

export default Body;