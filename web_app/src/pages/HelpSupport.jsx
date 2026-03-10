import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  HelpCircle, Phone, Mail, MessageCircle, Send, 
  ChevronDown, ChevronUp, FileText, Video, MessageSquare 
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const HelpSupport = () => {
  const { t } = useTranslation();
  const { token, user } = useAuthStore();
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactMethods, setContactMethods] = useState([
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'Call Us',
      value: 'Loading...',
      description: 'Mon-Fri, 8AM-5PM',
      action: () => {}
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Email Us',
      value: 'Loading...',
      description: 'We respond within 24 hours',
      action: () => {}
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: 'WhatsApp',
      value: 'Loading...',
      description: 'Quick support via chat',
      action: () => {}
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Send Message',
      value: 'From this page',
      description: 'We will respond via email',
      action: () => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })
    }
  ]);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await axios.get('/system/settings');
      if (response.data.success) {
        const data = response.data.data;
        const supportPhone = data.support_phone || '+254 700 000 000';
        const supportEmail = data.support_email || 'support@cncms.go.ke';
        const supportWhatsApp = data.support_whatsapp || '+254 700 000 000';
        const supportHours = data.support_hours || 'Mon-Fri, 8AM-5PM';

        setContactMethods([
          {
            icon: <Phone className="w-6 h-6" />,
            title: 'Call Us',
            value: supportPhone,
            description: supportHours,
            action: () => window.open(`tel:${supportPhone}`, '_self')
          },
          {
            icon: <Mail className="w-6 h-6" />,
            title: 'Email Us',
            value: supportEmail,
            description: 'We respond within 24 hours',
            action: () => window.open(`mailto:${supportEmail}`, '_self')
          },
          {
            icon: <MessageCircle className="w-6 h-6" />,
            title: 'WhatsApp',
            value: supportWhatsApp,
            description: 'Quick support via chat',
            action: () => window.open(`https://wa.me/${supportWhatsApp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hello, I need support with AgriCertify.')}`, '_blank')
          },
          {
            icon: <MessageSquare className="w-6 h-6" />,
            title: 'Send Message',
            value: 'From this page',
            description: 'We will respond via email',
            action: () => document.getElementById('contact-form')?.scrollIntoView({ behavior: 'smooth' })
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to load support settings:', error);
    }
  };

  const faqs = [
    {
      question: 'How do I apply for a coffee nursery certificate?',
      answer: 'Navigate to the Applications page and click "New Application". Fill in your nursery details, upload required documents (land registration and ID), accept the terms and conditions, and submit. Your application will be reviewed within 7-14 business days.'
    },
    {
      question: 'What documents are required for application?',
      answer: 'You need to upload: 1) Land Registration Document or Lease Agreement, 2) National ID (front and back), 3) Business Registration Certificate (optional but recommended), and 4) Any other supporting documents.'
    },
    {
      question: 'How long does the approval process take?',
      answer: 'Applications are typically processed within 7-14 business days. You will receive notifications via email and SMS when your application status changes.'
    },
    {
      question: 'Can I edit my application after submission?',
      answer: 'Once submitted, applications cannot be edited. However, you can contact support if you need to make urgent corrections before the review is completed.'
    },
    {
      question: 'How do I check my application status?',
      answer: 'Visit the "My Applications" page to view all your applications and their current status. You will also receive notifications for any status changes.'
    },
    {
      question: 'What happens after my application is approved?',
      answer: 'Once approved, you can download your certificate from the "Certificates" page. The certificate is valid for 12 months and can be renewed before expiry.'
    },
    {
      question: 'Can I have multiple applications?',
      answer: 'Yes, you can have multiple applications for different nurseries. Each nursery must be registered separately with its own set of documents.'
    },
    {
      question: 'What if my application is rejected?',
      answer: 'If rejected, you will receive a reason from the reviewing officer. You can correct the issues and submit a new application.'
    }
  ];

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.subject || !contactForm.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Send as notification to admin
      await axios.post(
        '/notifications',
        {
          userId: user?.id,
          title: `Support Request: ${contactForm.subject}`,
          message: contactForm.message,
          type: 'system'
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      toast.success('Message sent successfully! We will respond soon.');
      setContactForm({ subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <HelpCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Help & Support
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          We're here to help you with any questions or issues
        </p>
      </div>

      {/* Quick Contact Methods */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {contactMethods.map((method, index) => (
          <button
            key={index}
            onClick={method.action}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 text-left
                       hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg 
                          flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
              {method.icon}
            </div>
            <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
              {method.title}
            </h3>
            <p className="text-sm text-green-600 dark:text-green-400 mb-1">
              {method.value}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {method.description}
            </p>
          </button>
        ))}
      </div>

      {/* FAQs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full px-4 py-3 flex items-center justify-between
                           bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <span className="font-medium text-gray-800 dark:text-white text-left">
                  {faq.question}
                </span>
                {expandedFaq === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
              {expandedFaq === index && (
                <div className="px-4 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              User Guides
            </h3>
          </div>
          <ul className="space-y-2">
            <li>
              <a href="#" className="text-green-600 hover:text-green-700 text-sm">
                → How to Apply for a Certificate (PDF)
              </a>
            </li>
            <li>
              <a href="#" className="text-green-600 hover:text-green-700 text-sm">
                → Document Requirements Guide (PDF)
              </a>
            </li>
            <li>
              <a href="#" className="text-green-600 hover:text-green-700 text-sm">
                → Terms and Conditions (PDF)
              </a>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Video className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              Video Tutorials
            </h3>
          </div>
          <ul className="space-y-2">
            <li>
              <a href="#" className="text-green-600 hover:text-green-700 text-sm">
                → Getting Started with AgriCertify
              </a>
            </li>
            <li>
              <a href="#" className="text-green-600 hover:text-green-700 text-sm">
                → How to Upload Documents
              </a>
            </li>
            <li>
              <a href="#" className="text-green-600 hover:text-green-700 text-sm">
                → Checking Application Status
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Contact Form */}
      <div id="contact-form" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Send Us a Message
        </h2>
        <form onSubmit={handleContactSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject *
            </label>
            <input
              type="text"
              value={contactForm.subject}
              onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
              placeholder="What is this about?"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message *
            </label>
            <textarea
              value={contactForm.message}
              onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
              placeholder="Describe your issue or question in detail..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-green-600 text-white font-semibold rounded-lg
                       hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin">⏳</span> Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" /> Send Message
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default HelpSupport;
