import '../Style/Footer.css'
import '../App.css'
import BackToTopButton from './TopButton';
import psalmhe from '../Assets/psalmhe.png'
import React, { useState } from 'react';
import { useForm, ValidationError } from '@formspree/react';


function Footer(){

    const [state, handleSubmit] = useForm("xkgqzeey");
    const [filled, setFilled] = useState(false);


    return (
        <div className="footer">
            <div className="container footer-container">
                <div className="footer-section">
                    <img src={psalmhe} alt="Psalmhe footer logo" id="footer logo"/>
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
                        <a href="https://www.facebook.com/share/16yzrQv8zf/" target="_blank" rel="noopener noreferrer"><i className="fab fa-facebook-f" /></a>
                        <a href="https://www.instagram.com/psalmhe01?igsh=MTR5YTZrNGduMHM5aA==" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram" /></a>
                        <a href="https://x.com/Darasola24?t=eo9Tnigl5qcSiIER00w3kA&s=09" target="_blank" rel="noopener noreferrer"><i className="fab fa-twitter" /></a>
                    </div>
                </div>
                <div className="footer-section">
                    <div className='forms'>
                        <h3>Connect Via Email</h3>
                        <form onSubmit={e => { setFilled(true); handleSubmit(e); }}>
                        {
                            filled ? (
                                <p>Thank you for reaching out!</p>
                            ) : (
                                <>
                                    <div className="form-title">
                                        <label htmlFor="email">Email Address *</label>
                                        <input id="email" type="email" name="Email" placeholder="Enter your email"/>
                                        <ValidationError prefix="Email" field="email" errors={state.errors}/>
                                    </div>
                                    <div className="form-title">
                                        <label htmlFor="message">Message *</label>
                                        <textarea id="message" name="Message" placeholder="Enter your message" /> 
                                        <ValidationError prefix="Message" field="message" errors={state.errors}/>
                                    </div>
                                    <button type="submit" disabled={state.submitting}>Submit</button>
                                </>
                            )
                        }
                        </form>
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