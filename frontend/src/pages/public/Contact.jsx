import React, { useState } from 'react';
import { 
  Building, 
  Phone, 
  Mail, 
  FileText, 
  MapPin, 
  Send, 
  CheckCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Construct the WhatsApp message details
    const whatsappNumber = "919342215498"; // WhatsApp number from user request
    const textMessage = `*NEW CONTACT MESSAGE (Grit & Hue)*\n\n` +
                        `👤 *Name:* ${formData.name}\n` +
                        `📞 *Phone:* ${formData.phone || 'N/A'}\n` +
                        `✉️ *Email:* ${formData.email}\n` +
                        `🏷️ *Subject:* ${formData.subject}\n\n` +
                        `💬 *Message:*\n${formData.message}`;
    
    const encodedText = encodeURIComponent(textMessage);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedText}`;

    // Simulate API request and open WhatsApp
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      
      // Open WhatsApp web or app in a new tab
      window.open(whatsappUrl, '_blank');
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    }, 1200);
  };

  return (
    <div className="contact-page-container">
      {/* Header Section */}
      <section className="contact-header">
        <span className="contact-subtitle">CONTACT US</span>
        <h1 className="contact-title">Get in touch</h1>
        <p className="contact-tagline">
          Have questions about sizing, shipping, or returns? We are here to help you.
        </p>
      </section>

      {/* Main Grid Section */}
      <div className="contact-grid">
        
        {/* Info Column */}
        <div className="contact-info-col">
          
          {/* Shop Card */}
          <div className="info-card shop-card">
            <div className="card-header-icon">
              <Building size={24} />
            </div>
            <div className="card-details">
              <h3>Principal Place of Business</h3>
              <p className="shop-name">Grit And Hue</p>
              
              <div className="address-lines">
                <div className="address-item">
                  <span className="address-label">Building / Flat:</span>
                  <span className="address-value">8/3110</span>
                </div>
                <div className="address-item">
                  <span className="address-label">Street / Road:</span>
                  <span className="address-value">PANDIYAN NAGAR</span>
                </div>
                <div className="address-item">
                  <span className="address-label">Locality:</span>
                  <span className="address-value">P N ROAD, CHETTIPALAIYAM, SATHYA COLONY</span>
                </div>
                <div className="address-item">
                  <span className="address-label">City & State:</span>
                  <span className="address-value">Tiruppur, Tamil Nadu</span>
                </div>
                <div className="address-item">
                  <span className="address-label">PIN Code:</span>
                  <span className="address-value">641602</span>
                </div>
              </div>
            </div>
          </div>

          {/* Legal / GSTIN Card */}
          <div className="info-card legal-card">
            <div className="card-header-icon">
              <FileText size={24} />
            </div>
            <div className="card-details">
              <h3>Official Registration</h3>
              <div className="gstin-container">
                <span className="gstin-label">GSTIN No:</span>
                <span className="gstin-value">33CRIPN7506B1Z1</span>
              </div>
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="info-card channels-card">
            <div className="card-header-icon">
              <Phone size={24} />
            </div>
            <div className="card-details">
              <h3>Direct Channels</h3>
              
              <div className="channel-item">
                <Phone size={16} className="channel-icon" />
                <div>
                  <span className="channel-title">Phone Support:</span>
                  <a href="tel:+919342215498" className="channel-link">+91 93422 15498</a>
                </div>
              </div>

              <div className="channel-item">
                <Mail size={16} className="channel-icon" />
                <div>
                  <span className="channel-title">Official E-Mail:</span>
                  <span className="channel-value text-muted">N/A</span>
                </div>
              </div>

              <div className="channel-item">
                <Mail size={16} className="channel-icon" />
                <div>
                  <span className="channel-title">Support Desk:</span>
                  <a href="mailto:support@gritandhue.com" className="channel-link">support@gritandhue.com</a>
                </div>
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div className="info-card hours-card">
            <div className="card-header-icon">
              <Clock size={24} />
            </div>
            <div className="card-details">
              <h3>Support Hours</h3>
              <p>24/7 Customer Support</p>
              <p className="text-muted">Our support team is available round-the-clock to assist you.</p>
            </div>
          </div>

        </div>

        {/* Form Column */}
        <div className="contact-form-col">
          {isSubmitted ? (
            <div className="success-state">
              <div className="success-icon-wrapper">
                <CheckCircle size={64} />
              </div>
              <h2>Message Sent Successfully!</h2>
              <p>
                Thank you for reaching out. A representative from Grit & Hue will review your request and get back to you shortly.
              </p>
              <button 
                onClick={() => setIsSubmitted(false)} 
                className="btn-back-form"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <div className="form-card">
              <h2>Send Us a Message</h2>
              <p>Use the form below to submit your inquiry directly to our support desk.</p>
              
              <form onSubmit={handleSubmit} className="contact-form-element">
                <div className="form-row-two">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name" 
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. John Doe"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      name="phone" 
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. +91 98765 43210"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. john@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject *</label>
                  <input 
                    type="text" 
                    id="subject" 
                    name="subject" 
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="e.g. Order Tracking, Custom Request"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea 
                    id="message" 
                    name="message" 
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Write your query in detail..."
                    rows="6"
                    required
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn-submit-contact"
                >
                  {isSubmitting ? (
                    <span className="loading-spinner-text">Sending message...</span>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Contact;
