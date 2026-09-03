import React, { useState } from 'react';

/* ══════════════════════════════════════════════════════
   CSS — Footer styling (ported from Main.jsx's .mp-footer)
   ══════════════════════════════════════════════════════ */
const FOOTER_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/icon?family=Material+Icons+Round');

  .mp-footer .material-icons-round {
    font-family: 'Material Icons Round';
    font-weight: normal;
    font-style: normal;
    display: inline-block;
    line-height: 1;
    text-transform: none;
    letter-spacing: normal;
    word-wrap: normal;
    white-space: nowrap;
    direction: ltr;
    -webkit-font-smoothing: antialiased;
  }

  .mp-footer {
    background: transparent;
    border-top: 1px solid rgba(20,20,15,0.12);
    font-family: 'Poppins', sans-serif;
    overflow: hidden;
    position: relative; z-index: 2;
    width: 100%;
  }

  .mp-footer-body {
    padding: 2rem;
    box-sizing: border-box;
    max-width: 100%; margin: 0 auto;
    display: flex; align-items: stretch; gap: 0;
  }

  .mp-footer-brand {
    display: none;
  }

  .mp-footer-logo-row {
    display: flex; align-items: center; gap: 8px; margin-bottom: 0.2rem;
  }

  .mp-footer-logo-icon {
    width: 32px; height: 32px;
    object-fit: contain;
    border-radius: 6px;
    flex-shrink: 0;
  }

  .mp-footer-brand-name {
    font-size: 1.1rem; font-weight: 800; color: #14140F;
    letter-spacing: -0.01em;
  }

  .mp-footer-tagline {
    font-size: 0.82rem; color: rgba(20,20,15,0.4);
    line-height: 1.65; max-width: 220px;
  }

  .mp-footer-copyright {
    font-size: 0.68rem; color: rgba(20,20,15,0.2);
    margin-top: auto; padding-top: 1.5rem;
    letter-spacing: 0.04em;
  }

  .mp-footer-cols, .mp-footer-cols * {
    box-sizing: border-box;
  }

  .mp-footer-cols {
    border: 1.5px solid rgba(20,20,15,0.18);
    display: grid;
    grid-template-columns: 2fr 1.35fr 1.35fr;
    overflow: hidden;
    width: 100%;
    margin: 0;
    padding-bottom: 0;
    position: relative;
  }

  .mp-footer-row-top-item {
    border-bottom: 1.5px solid rgba(20,20,15,0.18);
  }

  .mp-footer-col.mp-footer-row-top-item {
    padding-bottom: 0.5rem;
  }

  .mp-footer-col {
    display: flex; flex-direction: column; gap: 0;
    padding: 1.5rem 2rem 1.5rem;
  }
  .mp-footer-col-contact,
  .mp-footer-col-designed {
    border-right: 1.5px solid rgba(20,20,15,0.18);
  }

  .mp-footer-social-icons {
    display: flex; flex-wrap: wrap; gap: 8px;
    margin-top: 0.5rem;
  }

  .mp-footer-social-icons--below {
    margin-top: 1.1rem;
  }

  .mp-footer-address-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-top: 0.9rem;
  }

  .mp-footer-address-row .mp-footer-social-btn {
    cursor: default;
    flex-shrink: 0;
  }

  .mp-footer-address-text {
    font-size: 0.82rem;
    color: rgba(20,20,15,0.6);
    letter-spacing: 0.01em;
    line-height: 1.55;
  }

  .mp-footer-email-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 0.5rem;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
  }

  .mp-footer-email-row:hover .mp-footer-social-btn {
    border-color: #ea580c;
    background: rgba(234,88,12,0.08);
    color: #ea580c;
  }

  .mp-footer-email-row:hover .mp-footer-email-text {
    color: rgba(20,20,15,0.85);
  }

  .mp-footer-email-text {
    font-size: 0.82rem;
    color: rgba(20,20,15,0.6);
    letter-spacing: 0.01em;
    transition: color 0.18s;
  }

  .mp-footer-social-btn {
    width: 36px; height: 36px;
    border-radius: 10px;
    border: 1.5px solid rgba(20,20,15,0.12);
    background: rgba(20,20,15,0.04);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: rgba(20,20,15,0.5);
    transition: border-color 0.18s, background 0.18s, color 0.18s;
  }
  .mp-footer-social-btn:hover {
    border-color: #ea580c;
    background: rgba(234,88,12,0.08);
    color: #ea580c;
  }

  button.mp-footer-social-btn {
    padding: 0;
    font-family: inherit;
    -webkit-appearance: none;
    appearance: none;
  }

  .mp-footer-dev-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 12px;
    margin-bottom: 0.4rem;
  }

  .mp-footer-dev-icons {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
  }

  .mp-footer-plain-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(20,20,15,0.55);
    transition: color 0.18s;
  }
  .mp-footer-plain-icon:hover {
    color: #14140F;
  }

  .mp-footer-linkedin-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 5px;
    overflow: hidden;
    line-height: 0;
    opacity: 0.9;
    transition: opacity 0.18s;
  }
  .mp-footer-linkedin-badge:hover {
    opacity: 1;
  }

  .mp-footer-col-heading {
    font-size: 0.85rem; font-weight: 700; color: rgba(20,20,15,0.9);
    margin-bottom: 1.25rem;
  }

  .mp-footer-col-link {
    font-size: 0.82rem; color: rgba(20,20,15,0.4);
    cursor: pointer; padding: 0.4rem 0;
    display: flex; align-items: center; gap: 4px;
    transition: color 0.18s;
  }
  .mp-footer-col-link:hover { color: #ea580c; }

  /* Contact Us — email / name / message, all fields shown together */
  .mp-contact-form {
    display: flex; flex-direction: column; gap: 10px;
    max-width: 340px; margin: 0.50rem 0 1rem 2.2rem;
    background: rgba(20,20,15,0.04);
    border: 1px solid rgba(20,20,15,0.15);
    border-radius: 20px;
    padding: 16px;
  }

  .mp-contact-input {
    background: rgba(20,20,15,0.05);
    border: 1px solid rgba(20,20,15,0.12);
    border-radius: 10px;
    padding: 12px 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #14140F;
    outline: none;
    width: 100%;
    transition: border-color 0.15s;
  }
  .mp-contact-input::placeholder { color: rgba(20,20,15,0.28); }
  .mp-contact-input:focus { border-color: #ea580c; }
  .mp-contact-input:-webkit-autofill,
  .mp-contact-input:-webkit-autofill:hover,
  .mp-contact-input:-webkit-autofill:focus {
    -webkit-text-fill-color: #14140F;
    -webkit-box-shadow: 0 0 0 1000px rgba(20,20,15,0.05) inset;
    caret-color: #14140F;
  }

  .mp-contact-static {
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .mp-contact-static-label {
    color: rgba(20,20,15,0.45);
  }
  .mp-contact-static-value {
    color: #14140F;
    font-weight: 600;
  }

  .mp-contact-chat-wrap { position: relative; display: flex; align-items: center; width: 100%; }
  .mp-contact-chat-input {
    flex: 1;
    background: rgba(20,20,15,0.05);
    border: 1px solid rgba(20,20,15,0.14);
    border-radius: 10px;
    padding: 12px 52px 12px 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 13px;
    color: #14140F;
    outline: none;
    width: 100%;
    transition: border-color 0.15s;
  }
  .mp-contact-chat-input::placeholder { color: rgba(20,20,15,0.32); }
  .mp-contact-chat-input:focus { border-color: rgba(20,20,15,0.3); }
  .mp-contact-chat-send {
    position: absolute; right: 6px; top: 50%; transform: translateY(-50%);
    width: 34px; height: 34px;
    border-radius: 10px; border: none;
    background: #ea580c; color: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: opacity 0.15s;
  }
  .mp-contact-chat-send:hover { opacity: 0.85; }
  .mp-contact-chat-send:disabled { opacity: 0.5; cursor: default; }

  .mp-contact-error {
    font-size: 12px; color: #ef6a5f;
    background: rgba(239,106,95,0.08);
    border: 1px solid rgba(239,106,95,0.4);
    padding: 8px 10px; border-radius: 8px;
  }
  .mp-contact-success {
    display: flex; align-items: center; gap: 8px;
    font-size: 13px; color: rgba(20,20,15,0.75);
    padding: 8px 0; margin-top: 0.75rem; max-width: 340px;
  }


  .mp-footer-col-connect {
  }

  .mp-footer-divider {
    width: calc(100% + 4rem);
    margin-left: -2rem;
    margin-right: -2rem;
    height: 1px;
    background: rgba(20,20,15,0.18);
    margin-top: 1.5rem;
    margin-bottom: 1.25rem;
    flex-shrink: 0;
  }

  .mp-footer-col-legal {
    grid-column: 3;
  }

  .mp-footer-bg {
    grid-column: 1 / 3;
    grid-row: 2;
    display: flex; align-items: center; gap: 0.25em;
    font-size: 9vw;
    font-weight: 800;
    color: #14140F;
    letter-spacing: -0.03em;
    white-space: nowrap;
    user-select: none; pointer-events: none;
    line-height: 1; 
    padding: 0 0 0 1.5rem;
    border-right: 1.5px solid rgba(20,20,15,0.18);
    overflow: hidden;
    max-width: 100%;
  }

  .mp-footer-wm-logo {
    height: 0.8em;
    width: auto;
    flex-shrink: 0;
    display: inline-block;
    vertical-align: middle;
  }

  .mp-footer-copyright-bottom {
    font-size: 0.68rem; color: rgba(20,20,15,0.7);
    letter-spacing: 0.04em;
    white-space: nowrap;
    flex-shrink: 0;
    margin-top: 2rem;
  }

  /* ════════════════════════════
     RESPONSIVE
  ════════════════════════════ */
  @media (max-width: 1024px) {
    /* Footer — tablet: 2-col grid */
    .mp-footer-cols {
      grid-template-columns: 1fr 1fr;
      margin: 0;
    }
    .mp-footer-body {
      padding: 1rem;
    }
    .mp-footer-col {
      padding: 2rem 1.25rem;
    }
    .mp-footer-col-contact { grid-column: 1 / -1; border-right: none; }
    .mp-footer-col-designed { border-right: none; }
    .mp-footer-col-connect { border-bottom: 1.5px solid rgba(20,20,15,0.1); }
    .mp-footer-col-legal {
      grid-column: 2;
      border-left: 1.5px solid rgba(20,20,15,0.18);
      border-bottom: 1.5px solid rgba(20,20,15,0.1);
    }
    .mp-footer-bg {
      grid-column: 1 / -1;
      grid-row: auto;
      font-size: clamp(2rem, 6vw, 4rem);
      padding: 1.5rem 0 1rem 1.25rem;
      width: 100%;
      max-width: 100%;
      overflow: hidden;
    }
  }

  @media (max-width: 768px) {
    /* Footer — mobile landscape: single column */
    .mp-footer-body { flex-direction: column; padding: 0.75rem; }
    .mp-footer-cols {
      grid-template-columns: 1fr;
      margin: 0;
    }
    .mp-footer-col {
      padding: 1.5rem 1rem;
      border-right: none !important;
      border-left: none !important;
      border-bottom: 1.5px solid rgba(20,20,15,0.1) !important;
    }
    .mp-footer-col-contact,
    .mp-footer-col-designed,
    .mp-footer-col-connect,
    .mp-footer-col-legal {
      grid-column: 1;
    }
    .mp-footer-copyright-bottom { margin-top: 1rem; white-space: normal; }

    /* Contact form was nudged right by a left margin for the desktop
       layout; on mobile it should sit centered instead. */
    .mp-contact-form {
      margin: 0.50rem auto 1rem;
    }
    .mp-contact-success {
      margin-left: auto;
      margin-right: auto;
    }

    /* Watermark — flow in document on mobile */
    .mp-footer-bg {
      grid-column: 1 / -1;
      grid-row: auto;
      font-size: clamp(1.8rem, 8vw, 3.5rem);
      padding: 1.25rem 0 1rem 1rem;
      width: 100%;
      max-width: 100%;
      overflow: hidden;
      border-top: 1.5px solid rgba(20,20,15,0.1);
    }
    .mp-footer-wm-logo { height: 0.75em; }
  }

  @media (max-width: 480px) {
    /* Footer — small mobile */
    .mp-footer-body { padding: 0.5rem; }
    .mp-footer-bg {
      font-size: clamp(1.5rem, 7vw, 2.5rem);
      padding: 1rem 0 0.75rem 0.75rem;
    }
    .mp-footer-wm-logo { height: 0.7em; }
  }
`;

/* ══════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════ */
const MI = ({ name, style }) => (
  <span className="material-icons-round" style={style}>{name}</span>
);

/**
 * ContactForm
 *
 * Contact Us panel: displays fixed contact details (name + phone number)
 * in the same box styling the form used, instead of a submittable form.
 */
function ContactForm() {
  return (
    <div className="mp-contact-form">
      <div className="mp-contact-input mp-contact-static">
        <span className="mp-contact-static-label">POC Name</span>
        <span className="mp-contact-static-value">Haneesh Yadav</span>
      </div>

      <div className="mp-contact-input mp-contact-static">
        <span className="mp-contact-static-label">Contact Number</span>
        <span className="mp-contact-static-value">9103355700</span>
      </div>
    </div>
  );
}

/**
 * Footer
 *
 * Central, reusable site footer for VIT Stellar. Drop this into any page:
 *
 *   <Footer />
 */
export default function Footer() {
  const [stellarEmailCopied, setStellarEmailCopied] = useState(false);
  const STELLAR_EMAIL = 'astronomy@vit.ac.in'; // TODO: replace with the actual Stellar contact email

  const copyToClipboard = (text, showCopied) => {
    // Fallback for browsers/webviews where navigator.clipboard is
    // unavailable or blocked (common on mobile, especially in-app
    // browsers and non-HTTPS contexts).
    const legacyCopy = () => {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        // Keep it out of view but still focusable/selectable on mobile
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '0';
        textarea.style.width = '1px';
        textarea.style.height = '1px';
        textarea.style.padding = '0';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.boxShadow = 'none';
        textarea.style.background = 'transparent';
        textarea.readOnly = true;
        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, text.length); // needed on iOS

        const success = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (success) showCopied();
      } catch (err) {
        // Nothing more we can do — fail silently, no UI to show "Copied!"
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(showCopied).catch(legacyCopy);
    } else {
      legacyCopy();
    }
  };

  const handleCopyStellarEmail = (e) => {
    e.preventDefault();
    copyToClipboard(STELLAR_EMAIL, () => {
      setStellarEmailCopied(true);
      setTimeout(() => setStellarEmailCopied(false), 1800);
    });
  };

  return (
    <>
      <style>{FOOTER_CSS}</style>

      <footer className="mp-footer" id="contactus">
        <div className="mp-footer-body">

          

          {/* Columns */}
          <div className="mp-footer-cols">
              <div className="mp-footer-col mp-footer-col-contact mp-footer-row-top-item">
                <div className="mp-footer-col-heading">Contact Us</div>
                <ContactForm />
              </div>
              <div className="mp-footer-col mp-footer-col-designed mp-footer-row-top-item">
                {/* Developed By — now shown first */}
                <div className="mp-footer-col-heading">Developed By</div>
                <div className="mp-footer-dev-row">
                    <span className="mp-footer-col-link">Sivaharini</span>
                    <div className="mp-footer-dev-icons">
                      {/* LinkedIn */}
                      <a
                        className="mp-footer-plain-icon"
                        
                        href="https://www.linkedin.com/in/sivaharini-ayyappan-16aba83ba/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      </a>
                      {/* GitHub */}
                      <a
                        className="mp-footer-plain-icon"
                        
                        href="https://github.com/harini835"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                      </a>
                    </div>
                  </div>
                  <div className="mp-footer-dev-row">
                    <span className="mp-footer-col-link">Rakshita Sree Senthil Kumar</span>
                    <div className="mp-footer-dev-icons">
                      {/* LinkedIn */}
                      <a
                        className="mp-footer-plain-icon"
                        
                        href="https://www.linkedin.com/in/rakshita-sree-senthil-kumar-a51a46375/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      </a>
                      {/* GitHub */}
                      <a
                        className="mp-footer-plain-icon"
                        
                        href="https://github.com/rakshita1926-a11y"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                      </a>
                    </div>
                  </div>
                  <div className="mp-footer-dev-row">
                    <span className="mp-footer-col-link">Sushant Singh </span>
                    <div className="mp-footer-dev-icons">
                      {/* LinkedIn */}
                      <a
                        className="mp-footer-plain-icon"
                        
                        href="https://www.linkedin.com/in/sushant-singh-663301378/"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      </a>
                      {/* GitHub */}
                      <a
                        className="mp-footer-plain-icon"
                        
                        href="https://github.com/singhsushant4684-eng"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                      </a>
                    </div>
                  </div>
                <div className="mp-footer-dev-row">
                    <span className="mp-footer-col-link">Haneesh Yadav</span>
                    <div className="mp-footer-dev-icons">
                      {/* LinkedIn */}
                      <a
                        className="mp-footer-plain-icon"
                        
                        href="https://www.linkedin.com/in/haneesh-yadav"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      </a>
                      {/* GitHub */}
                      <a
                        className="mp-footer-plain-icon"
                        
                        href="https://github.com/haneesh-yadav"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                      </a>
                      {/* Website */}
                      <a
                        className="mp-footer-plain-icon"
                        href="https://haneesh.vercel.app"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      </a>
                    </div>
                  </div>
              </div>

                {/* Designed By — now its own standalone column, in place of the old "Office of Student's Welfare" box */}
                <div className="mp-footer-col mp-footer-col-connect mp-footer-row-top-item">
                  <div className="mp-footer-col-heading">Designed By</div>
                    <div className="mp-footer-dev-row">
                      <span className="mp-footer-col-link">Sivaharini</span>
                      <div className="mp-footer-dev-icons">
                        {/* LinkedIn */}
                        <a
                          className="mp-footer-plain-icon"
                          
                          href="https://www.linkedin.com/in/sivaharini-ayyappan-16aba83ba/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        </a>
                        {/* GitHub */}
                        <a
                          className="mp-footer-plain-icon"
                          
                          href="https://github.com/harini835"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                        </a>
                      </div>
                    </div>
                    <div className="mp-footer-dev-row">
                      <span className="mp-footer-col-link">Rakshita Sree Senthil Kumar </span>
                      <div className="mp-footer-dev-icons">
                        {/* LinkedIn */}
                        <a
                          className="mp-footer-plain-icon"
                          
                          href="https://www.linkedin.com/in/rakshita-sree-senthil-kumar-a51a46375/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        </a>
                        {/* GitHub */}
                        <a
                          className="mp-footer-plain-icon"
                          
                          href="https://github.com/rakshita1926-a11y"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                        </a>
                      </div>
                    </div>
                    <div className="mp-footer-dev-row">
                      <span className="mp-footer-col-link">Sushant Singh </span>
                      <div className="mp-footer-dev-icons">
                        {/* LinkedIn */}
                        <a
                          className="mp-footer-plain-icon"
                          
                          href="https://www.linkedin.com/in/sushant-singh-663301378/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        </a>
                        {/* GitHub */}
                        <a
                          className="mp-footer-plain-icon"
                          
                          href="https://github.com/singhsushant4684-eng"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                        </a>
                      </div>
                    </div>
                    <div className="mp-footer-dev-row">
                      <span className="mp-footer-col-link">Haneesh Yadav</span>
                      <div className="mp-footer-dev-icons">
                        {/* LinkedIn */}
                        <a
                          className="mp-footer-plain-icon"
                          
                          href="https://www.linkedin.com/in/haneesh-yadav"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        </a>
                        {/* GitHub */}
                        <a
                          className="mp-footer-plain-icon"
                          
                          href="https://github.com/haneesh-yadav"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
                        </a>
                        {/* Website */}
                        <a
                          className="mp-footer-plain-icon"
                          href="https://haneesh.vercel.app"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        </a>
                      </div>
                    </div>
                </div>

              {/* Connect */}
              <div className="mp-footer-col mp-footer-col-legal">
                  <div className="mp-footer-col-heading">Connect with Stellar</div>
                  <div className="mp-footer-social-icons">
                    {/* Instagram */}
                    <a
                      className="mp-footer-social-btn"
                      href="https://www.instagram.com/vit_stellar"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                    </a>
                    {/* WhatsApp */}
                    <a
                      className="mp-footer-social-btn"
                      href="https://whatsapp.com/channel/0029VbDDEqe3GJP5VpaGoA0h"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.76.46 3.45 1.33 4.95L2 22l5.2-1.36c1.44.79 3.07 1.2 4.75 1.2h.01c5.52 0 10-4.48 10-10s-4.48-10-9.96-10zm5.86 14.24c-.25.7-1.45 1.34-2 1.43-.51.08-1.16.11-1.87-.12-.43-.13-.98-.32-1.69-.62-2.97-1.28-4.91-4.28-5.06-4.48-.15-.2-1.21-1.61-1.21-3.07s.76-2.18 1.03-2.48c.27-.3.59-.37.79-.37s.4 0 .57.01c.18.01.42-.07.66.5.25.6.85 2.07.92 2.22.07.15.12.33.02.53-.1.2-.15.32-.3.49-.15.17-.31.38-.44.51-.15.15-.3.31-.13.61.17.3.76 1.25 1.63 2.02 1.12.99 2.06 1.31 2.37 1.45.31.15.49.13.67-.08.18-.2.77-.9.98-1.21.2-.31.41-.25.68-.15.28.1 1.75.83 2.05.98.3.15.5.22.57.35.08.13.08.72-.17 1.42z"/></svg>
                    </a>
                    {/* LinkedIn */}
                    <a
                      className="mp-footer-social-btn"
                      
                      href="https://www.linkedin.com/company/vit-stellar"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    </a>
                    {/* Email — click to copy */}
                    <button
                      type="button"
                      className="mp-footer-social-btn"
                      onClick={handleCopyStellarEmail}
                      title={stellarEmailCopied ? 'Copied!' : `Copy email (${STELLAR_EMAIL})`}
                    >
                      {stellarEmailCopied ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      )}
                    </button>
                  </div>
                  <div className="mp-footer-copyright-bottom">COPYRIGHT © 2026 | VIT STELLAR</div>
              </div>

            {/* Watermark — inside the bordered box at the bottom */}
            <div className="mp-footer-bg">
              <img
                src="../assets/stellar-logo.webp"
                className="mp-footer-wm-logo"
                alt=""
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              VIT STELLAR
            </div>
          </div>{/* end mp-footer-cols */}

        </div>
      </footer>
    </>
  );
}