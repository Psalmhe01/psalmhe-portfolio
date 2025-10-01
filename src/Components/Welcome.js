import '../Style/Body.css'
import herop1 from '../Assets/PortfolioPics/herop1.jpg'
import herop2 from '../Assets/PortfolioPics/herop2.jpg'
import herop3 from '../Assets/PortfolioPics/herop3.jpg'
import herop4 from '../Assets/PortfolioPics/herop4.jpg'

function Welcome(){

    return (
        <div class="hero" id='welcome'>
                <div class="hero-content">
                    <h2>Welcome to Psalmhe Photography</h2>
                    <p>Some artists hold paintbrushes, others hold lenses...</p>
                    <a href="#" class="btn">View Gallery</a>
                    <div className='hero-images'>
                        <img src={herop1} />
                        <img src={herop2} />
                        <img src={herop3} />
                        <img src={herop4} />
                    </div>
                </div>
        </div>
    )
}

export default Welcome;