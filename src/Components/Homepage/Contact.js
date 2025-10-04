import "../../Style/Body.css";

function Contact() {
  return (
    <section class="contact" id="contact">
      <div class="container">
        <div class="contact-container">
          <div className="contact-box">
            <div class="contact-info">
              <h3>Get In Touch</h3>
              <p>
                For inquiries, collaborations, or to explore my artistic world,
                feel free to reach out.
              </p>
            </div>
            <div class="map">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d55280.805800794486!2d-90.4790016!3d30.516838399999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x862722985b04e61d%3A0xd65f00282c35660!2sSoutheastern%20Louisiana%20University!5e1!3m2!1sen!2sus!4v1759300991891!5m2!1sen!2sus"
                width="600"
                height="450"
                allowfullscreen=""
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
          <div className="forms">
            <div className="form-title">
              <p>First name *</p>
              <input placeholder="Enter your first name"></input>
            </div>
            <div className="form-title">
              <p>Last name *</p>
              <input placeholder="Enter your last name"></input>
            </div>
            <div className="form-title">
              <p>Email *</p>
              <input placeholder="Enter your email"></input>
            </div>
            <div className="form-title">
              <p>Message *</p>
              <input placeholder="Enter your message"></input>
            </div>
            <a className="btn">Submit</a>
          </div>
        </div>
      </div>
    </section>
  );
}
export default Contact;
