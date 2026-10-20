import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../layout/Navbar';
import { useBusiness } from '../../context/BusinessContext';
import {
  Mail,
  Phone,
  MessageSquare,
  Send,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  Bot,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ShieldCheck,
  Clock,
  HelpCircle,
  Terminal,
  AlertCircle
} from 'lucide-react';

const TOPICS = [
  {
    id: 'general',
    label: 'General Inquiries',
    subject: '[General Inquiry] Smart Financial Support',
    guide: 'Questions about platform navigation, account setup, or general information. Average reply time: under 2 hours.',
  },
  {
    id: 'accounting',
    label: 'Accounting & Ledgers',
    subject: '[Ledger Support] Double-Entry & Balancing Query',
    guide: 'Assistance with T-Accounts, Trial Balance discrepancy, journal entries, or financial statements.',
  },
  {
    id: 'bug',
    label: 'Bug / Discrepancy',
    subject: '[Bug Report] Smart Financial Incident',
    guide: 'Priority queue. If you noticed a calculation glitch or UI issue, mention the exact business name or Voucher #.',
  },
  {
    id: 'feature',
    label: 'Feature Requests',
    subject: '[Feature Request] Suggestion for Smart Financial',
    guide: 'We love feedback! Suggest custom report layouts, shortcut keys, or new ledger automation features.',
  },
  {
    id: 'enterprise',
    label: 'Enterprise & Plans',
    subject: '[Enterprise] Multi-Business & Premium Support',
    guide: 'Discuss unlimited business vaults, custom export templates, dedicated accounting team onboarding, and SLAs.',
  },
];

const FAQS = [
  {
    id: 'unbalanced-voucher',
    q: 'How do I resolve an unbalanced voucher in Edit Transaction?',
    a: 'In Smart Financial, double-entry integrity is strictly enforced. The Save button remains disabled until total debits exactly equal total credits. You can also utilize the "Recalculate balances" tool to sync every ledger balance from verified entries.',
  },
  {
    id: 'multiple-businesses',
    q: 'Can I manage multiple independent business vaults?',
    a: 'Yes. Each business created in Smart Financial operates with its own isolated chart of accounts, journal entries, trial balances, and financial statements without cross-contamination.',
  },
  {
    id: 'pdf-export',
    q: 'How do I print or export my General Journal and Reports?',
    a: 'You can use the dedicated "Print" and "Download PDF" buttons located on the Show Transactions, Trial Balance, Income Statement, and Balance Sheet pages to generate publication-grade, audit-ready PDF documents.',
  },
  {
    id: 'data-security',
    q: 'How is my financial and business data protected?',
    a: 'All transactions use ACID-compliant relational transactions with automatic rollback protection. Communications are protected with TLS 256-bit encryption and strict session access controls.',
  },
];

const ContactForm = () => {
  const navigate = useNavigate();
  const { selectedBusiness } = useBusiness();

  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [iframeLoadCount, setIframeLoadCount] = useState(0);
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  // Interactive UI State
  const [selectedTopic, setSelectedTopic] = useState('general');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [openFaq, setOpenFaq] = useState('unbalanced-voucher');

  const currentTopic = TOPICS.find((t) => t.id === selectedTopic) || TOPICS[0];

  const handleIframeLoad = () => {
    setIsIframeLoading(false);
    setIframeLoadCount((count) => {
      const next = count + 1;
      if (next >= 2) {
        setAlert({
          show: true,
          message: '✓ Inquiry submitted successfully! Our financial engineering team will review your message shortly.',
          type: 'success',
        });
        setTimeout(() => setAlert({ show: false, message: '', type: '' }), 6000);
      }
      return next;
    });
  };

  const handleCopyEmail = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText('support@khushifinances.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2200);
  };

  const handleOpenChatbot = () => {
    window.dispatchEvent(new CustomEvent('open-smart-chatbot'));
  };

  const toggleFaq = (id) => {
    setOpenFaq((prev) => (prev === id ? null : id));
  };

  return (
    <div className="sf-contact-page">
      <Navbar />

      <main className="sf-contact-wrap">
        {/* Breadcrumb Navigation */}
        <p className="text-brand-muted text-[15px] mb-3">
          <button
            type="button"
            onClick={() => navigate('/list')}
            className="hover:underline text-brand-muted cursor-pointer"
          >
            {selectedBusiness?.business_name || 'Businesses'}
          </button>
          {' / '}
          <span className="text-brand-ink font-medium">Contact & Support Hub</span>
        </p>

        {/* Hero Section */}
        <div className="sf-contact-hero">
          <div className="sf-contact-badge">
            <span className="sf-contact-pulse"></span>
            <span>Direct Support & Concierge</span>
          </div>

          <h1 className="sf-contact-title">
            Get in touch<span style={{ color: '#C8F135' }}>.</span>
          </h1>

          <p className="sf-contact-lead">
            Questions regarding ledger balancing, business vaults, report customization, or enterprise features?
            Our accounting engineers and support desk are ready to assist.
          </p>
        </div>

        {/* Interactive Topic Selector */}
        <div className="sf-topic-bar" role="tablist" aria-label="Support Topics">
          {TOPICS.map((topic) => (
            <button
              key={topic.id}
              type="button"
              className={`sf-topic-chip ${selectedTopic === topic.id ? 'active' : ''}`}
              onClick={() => setSelectedTopic(topic.id)}
            >
              <span>{topic.label}</span>
            </button>
          ))}
        </div>

        {/* Topic Dynamic Guidance Pill */}
        <div className="sf-topic-guide">
          <Clock className="w-4 h-4 flex-shrink-0" style={{ color: '#0E1A14' }} />
          <span>
            <b>Guidance:</b> {currentTopic.guide}
          </span>
        </div>

        {/* 2-Column Content Grid */}
        <div className="sf-contact-grid">
          {/* Left Column: Interactive Support Channels & FAQs */}
          <div className="sf-contact-sidebar">
            {/* Card 1: Instant AI Copilot */}
            <div className="sf-contact-card">
              <div className="sf-contact-card-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div className="sf-contact-icon-box">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="sf-contact-card-title">Financial AI Copilot</h2>
                    <p className="sf-contact-card-sub">Instant 24/7 Ledger Analysis</p>
                  </div>
                </div>
                <span
                  style={{
                    padding: '3px 8px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: '1.5px solid #0E1A14',
                    background: '#C8F135',
                    color: '#0E1A14',
                  }}
                >
                  ⚡ Active
                </span>
              </div>

              <p style={{ fontSize: '14px', color: '#44544B', lineHeight: 1.5, marginBottom: '18px' }}>
                Need instant assistance with T-account formulas, transaction journal entries, or balance sheet queries in{' '}
                <b>{selectedBusiness?.business_name || 'your active business'}</b>? Ask our integrated AI assistant right now.
              </p>

              <button
                type="button"
                className="sf-btn sf-btn-lime"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                onClick={handleOpenChatbot}
              >
                <Bot className="w-4 h-4" />
                <span>Launch Financial AI Copilot</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Card 2: Direct Communication Channels */}
            <div className="sf-contact-card">
              <div className="sf-contact-card-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div className="sf-contact-icon-box" style={{ background: '#FFF' }}>
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="sf-contact-card-title">Direct Channels</h2>
                    <p className="sf-contact-card-sub">Official response desks</p>
                  </div>
                </div>
              </div>

              {/* Email channel */}
              <div className="sf-channel-row">
                <div className="sf-channel-info">
                  <span className="sf-channel-label">Official Support Desk</span>
                  <span className="sf-channel-val">support@khushifinances.com</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className={`sf-copy-btn ${copiedEmail ? 'copied' : ''}`}
                    onClick={handleCopyEmail}
                    title="Copy email address"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-[#0E1A14]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEmail ? 'Copied!' : 'Copy'}</span>
                  </button>
                  <a
                    href={`mailto:support@khushifinances.com?subject=${encodeURIComponent(currentTopic.subject)}`}
                    className="sf-copy-btn"
                    title="Open mail client"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Mail</span>
                  </a>
                </div>
              </div>

              {/* Hours & SLA */}
              <div className="sf-channel-row">
                <div className="sf-channel-info">
                  <span className="sf-channel-label">Office & Engineering Hours</span>
                  <span className="sf-channel-val" style={{ fontSize: '14px' }}>Mon – Sat, 9:00 AM – 7:00 PM PKT</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#0E1A14',
                    }}
                  >
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        background: '#27C93F',
                        display: 'inline-block',
                      }}
                    ></span>
                    SLA &lt; 2h
                  </span>
                </div>
              </div>

              {/* Security info */}
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px 14px',
                  background: '#F8FAF5',
                  border: '1.5px solid #0E1A14',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '13px',
                  color: '#44544B',
                }}
              >
                <ShieldCheck className="w-4 h-4 flex-shrink-0" style={{ color: '#0E1A14' }} />
                <span>All communication is logged and backed by end-to-end enterprise privacy.</span>
              </div>
            </div>

            {/* Card 3: Interactive FAQ Accordions */}
            <div className="sf-contact-card">
              <div className="sf-contact-card-head" style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div className="sf-contact-icon-box" style={{ background: '#F8FAF5' }}>
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="sf-contact-card-title">Quick Answers</h2>
                    <p className="sf-contact-card-sub">Common platform questions</p>
                  </div>
                </div>
              </div>

              <div>
                {FAQS.map((faq) => {
                  const isOpen = openFaq === faq.id;
                  return (
                    <div className="sf-faq-item" key={faq.id}>
                      <button
                        type="button"
                        className="sf-faq-trigger"
                        onClick={() => toggleFaq(faq.id)}
                        aria-expanded={isOpen}
                      >
                        <span>{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && <div className="sf-faq-content">{faq.a}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Dispatch Terminal with Google Form */}
          <div className="sf-contact-main">
            <div className="sf-terminal-card">
              {/* Terminal Top Window Bar */}
              <div className="sf-terminal-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div className="sf-terminal-dots">
                    <span className="sf-terminal-dot" style={{ background: '#FF5F56' }}></span>
                    <span className="sf-terminal-dot" style={{ background: '#FFBD2E' }}></span>
                    <span className="sf-terminal-dot" style={{ background: '#27C93F' }}></span>
                  </div>
                  <span className="sf-terminal-title">dispatch_inquiry_ticket.sh</span>
                </div>

                <div className="sf-terminal-status">
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#C8F135',
                      display: 'inline-block',
                    }}
                  ></span>
                  <span>SSL SECURE TERMINAL</span>
                </div>
              </div>

              {/* Terminal Body */}
              <div className="sf-terminal-body">
                {/* Alert message if submitted */}
                {alert.show && (
                  <div className="sf-terminal-alert" role="status">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-[#0E1A14]" />
                    <span>{alert.message}</span>
                  </div>
                )}

                {/* Sub-header info */}
                <div style={{ marginBottom: '16px' }}>
                  <h3
                    style={{
                      fontFamily: "'Bricolage Grotesque', sans-serif",
                      fontSize: '22px',
                      fontWeight: 700,
                      color: '#0E1A14',
                      margin: '0 0 6px 0',
                    }}
                  >
                    Direct Inquiry Form
                  </h3>
                  <p style={{ fontSize: '14px', color: '#44544B', margin: 0 }}>
                    Please fill out the form fields below. Responses are routed directly into our support desk queue.
                  </p>
                </div>

                {/* Embedded Iframe Container */}
                <div className="sf-iframe-container">
                  {isIframeLoading && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#FCFDFB',
                        zIndex: 10,
                        gap: '14px',
                      }}
                    >
                      <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#0E1A14] border-t-[#C8F135]"></div>
                      <span style={{ fontSize: '15px', fontWeight: 600, color: '#0E1A14' }}>
                        Loading dispatch terminal...
                      </span>
                    </div>
                  )}

                  <iframe
                    src="https://docs.google.com/forms/d/e/1FAIpQLScHrLwnLzDbdEYpl0Mp8IebiwMQWWhTLOtJGPU1KBqJX8XYEQ/viewform?embedded=true"
                    width="100%"
                    height="883"
                    frameBorder="0"
                    marginHeight="0"
                    marginWidth="0"
                    onLoad={handleIframeLoad}
                    className="w-full bg-transparent"
                    title="Smart Financial Support Form"
                    style={{
                      position: 'relative',
                      zIndex: 20,
                      display: 'block',
                      minHeight: '883px',
                      border: 'none',
                    }}
                  >
                    Loading form…
                  </iframe>
                </div>
              </div>

              {/* Terminal Footer */}
              <div className="sf-terminal-foot">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal className="w-4 h-4 text-[#0E1A14]" />
                  <span>Smart Financial Support Engine v2.4</span>
                </div>
                <span>
                  Active Context: <b>{selectedBusiness?.business_name || 'Standard Account'}</b>
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContactForm;
