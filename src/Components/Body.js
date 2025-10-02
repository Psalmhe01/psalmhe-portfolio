import '../Style/Body.css'

import Welcome from '../Components/Welcome.js'
import About from '../Components/About.js'
import Contact from '../Components/Contact.js'
import Portfolio from '../Components/Portfolio.js'
import Slider from './Slider.js'
import Images from '../Files/SliderImages.js'

function Body(){

    return (
        <div className='body'>
            <Welcome />    
            <About/>
            <Portfolio />
            <Slider items={Images} />
            <Contact />
        </div>
    )

}

export default Body;