import "../../Style/Body.css";
import ContactForm from "../ContactBox";
import React from "react";
import { useForm, ValidationError } from "@formspree/react";
import ContactBox from "../ContactBox";

function Contact() {
  const [state, handleSubmit] = useForm("xkgqzeey");

  if (state.succeeded) {
    return (
      <section className="contact" id="contact">
        <div className="container">
          <div className="contact-container">
            <ContactBox />
            <p>Thanks for reaching out!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="contact" id="contact">
      <div className="container">
        <div className="contact-container">
          <ContactBox />
          <div className="forms">
            <form onSubmit={handleSubmit}>
              <div className="form-title">
                <label htmlFor="firstName">First Name *</label>
                <input
                  id="firstName"
                  type="firstName"
                  name="First Name"
                  placeholder="Enter your first name"
                />
                <ValidationError
                  prefix="firstName"
                  field="firstName"
                  errors={state.errors}
                />
              </div>
              <div className="form-title">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  id="lastName"
                  type="lastName"
                  name="Last Name"
                  placeholder="Enter your last name"
                />
                <ValidationError
                  prefix="lastName"
                  field="lastName"
                  errors={state.errors}
                />
              </div>
              <div className="form-title">
                <label htmlFor="email">Email Address *</label>
                <input
                  id="email"
                  type="email"
                  name="Email"
                  placeholder="Enter your email"
                />
                <ValidationError
                  prefix="Email"
                  field="email"
                  errors={state.errors}
                />
              </div>
              <div className="form-title">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="Message"
                  placeholder="Enter your message"
                />
                <ValidationError
                  prefix="Message"
                  field="message"
                  errors={state.errors}
                />
              </div>
              <button type="submit" disabled={state.submitting}>
                Submit
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
export default Contact;
