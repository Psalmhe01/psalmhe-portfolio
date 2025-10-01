import '../Style/Footer.css'
import '../App.css'
import BackToTopButton from './TopButton';
import psalmhe from '../Assets/psalmhe.png'


function Footer(){


    return (
        <div className="footer">
            <div className="container footer-container">
                <div className="footer-section">
                    <img src={psalmhe} />
                    <div class="contact-details">
                                <p><i class="fas fa-map-marker-alt"></i>801 Pecan Street, Hammond LA 70402</p>
                                <p><i class="fas fa-phone"></i> (203) 994-1895</p>
                                <p><i class="fas fa-envelope"></i> psalmhe@gmail.com</p>
                    </div>
                </div>
                <div className="footer-section">
                    <h3>Connect Via Social Media</h3>
                    <p>Follow us on social media for updates and inspiration.</p>
                    <div className="social-links">
                        <a href="#"><i className="fab fa-facebook-f" /></a>
                        <a href="#"><i className="fab fa-instagram" /></a>
                        <a href="#"><i className="fab fa-youtube" /></a>
                        <a href="#"><i className="fab fa-twitter" /></a>
                    </div>
                </div>
                <div className="footer-section">
                    <div className='forms'>
                        <h3>Connect Via Email</h3>
                        <div className='form-title'>
                            <p>Email *</p>
                            <input placeholder='Enter your email'></input>
                        </div>
                        <div className='form-title'>
                            <p>Message *</p>
                            <input placeholder='Enter your message'></input>
                        </div>
                        <a className='btn'>Submit</a>
                    </div>
                </div>
            </div>
            <div className="copyright">
                <p>&copy; 2025 Samuel Omosowone. All rights reserved.</p>
                <BackToTopButton />
            </div>
        </div>
    )
}

export default Footer;