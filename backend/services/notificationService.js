/**
 * Smart Notification Service
 * Handles Email, SMS, and Push notifications
 */

const nodemailer = require('nodemailer');
const { pool } = require('../config/database');

// Email transporter configuration
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// SMS Service (using Africa's Talking for Kenya)
const sendSMS = async (phoneNumber, message) => {
  try {
    // Integration with Africa's Talking or Twilio
    const africasTalking = require('africastalking')({
      apiKey: process.env.AT_API_KEY,
      username: process.env.AT_USERNAME,
    });

    const sms = africasTalking.SMS;
    const result = await sms.send({
      to: phoneNumber,
      message: message,
      from: process.env.AT_SENDER_ID || 'AgriCertify',
    });

    return { success: true, result };
  } catch (error) {
    console.error('SMS sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Push Notification Service (using Firebase)
const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    const admin = require('firebase-admin');
    
    // Get user's FCM token
    const [tokens] = await pool.query(
      'SELECT fcm_token FROM user_devices WHERE user_id = ? AND is_active = TRUE',
      [userId]
    );

    if (tokens.length === 0) {
      return { success: false, error: 'No active devices found' };
    }

    const fcmTokens = tokens.map(t => t.fcm_token);

    const message = {
      notification: { title, body },
      data,
      tokens: fcmTokens,
    };

    const response = await admin.messaging().sendMulticast(message);
    return { success: true, response };
  } catch (error) {
    console.error('Push notification failed:', error);
    return { success: false, error: error.message };
  }
};

// Email Templates
const emailTemplates = {
  welcome: (name, language = 'en') => ({
    subject: language === 'sw' ? 'Karibu AgriCertify!' : language === 'fr' ? 'Bienvenue sur AgriCertify!' : 'Welcome to AgriCertify!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2E7D32, #4CAF50); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🌱 AgriCertify</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">${language === 'sw' ? 'Habari' : language === 'fr' ? 'Bonjour' : 'Hello'} ${name}!</h2>
          <p style="color: #666; line-height: 1.6;">
            ${language === 'sw' 
              ? 'Karibu kwenye mfumo wa usimamizi wa vyeti vya kitalu vya kahawa. Sasa unaweza kuomba cheti chako kwa urahisi na haraka.'
              : language === 'fr'
              ? 'Bienvenue dans le système de gestion des certificats de pépinière de café. Vous pouvez maintenant demander votre certificat facilement et rapidement.'
              : 'Welcome to the Coffee Nursery Certificate Management System. You can now apply for your certificate easily and quickly.'}
          </p>
          <a href="${process.env.APP_URL}/applications/new" 
             style="display: inline-block; background: #2E7D32; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; margin-top: 20px;">
            ${language === 'sw' ? 'Omba Cheti' : language === 'fr' ? 'Demander un Certificat' : 'Apply for Certificate'}
          </a>
        </div>
      </div>
    `
  }),

  applicationStatus: (name, status, appId, language = 'en') => {
    const statusMessages = {
      en: {
        submitted: { subject: 'Application Submitted', message: 'Your application has been submitted successfully.' },
        approved: { subject: 'Application Approved! 🎉', message: 'Congratulations! Your application has been approved.' },
        rejected: { subject: 'Application Update', message: 'Your application has been reviewed.' },
      },
      sw: {
        submitted: { subject: 'Maombi Yamewasilishwa', message: 'Maombi yako yamewasilishwa kwa mafanikio.' },
        approved: { subject: 'Maombi Yameidhinishwa! 🎉', message: 'Hongera! Maombi yako yameidhinishwa.' },
        rejected: { subject: 'Mabadiliko ya Maombi', message: 'Maombi yako yamekaguliwa.' },
      },
      fr: {
        submitted: { subject: 'Demande Soumise', message: 'Votre demande a été soumise avec succès.' },
        approved: { subject: 'Demande Approuvée! 🎉', message: 'Félicitations! Votre demande a été approuvée.' },
        rejected: { subject: 'Mise à jour de la Demande', message: 'Votre demande a été examinée.' },
      }
    };

    const msg = statusMessages[language]?.[status] || statusMessages.en[status];

    return {
      subject: msg.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${status === 'approved' ? '#4CAF50' : status === 'rejected' ? '#F44336' : '#2196F3'}; 
                      padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">🌱 AgriCertify</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2 style="color: #333;">${msg.subject}</h2>
            <p style="color: #666; line-height: 1.6;">${msg.message}</p>
            <p style="color: #333; font-weight: bold;">Application ID: ${appId}</p>
            <a href="${process.env.APP_URL}/applications/${appId}" 
               style="display: inline-block; background: #2E7D32; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; margin-top: 20px;">
              View Application
            </a>
          </div>
        </div>
      `
    };
  },

  certificateReady: (name, certNumber, language = 'en') => ({
    subject: language === 'sw' ? 'Cheti Chako Kiko Tayari!' : language === 'fr' ? 'Votre Certificat est Prêt!' : 'Your Certificate is Ready!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FFD700, #FFA000); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🏆 Certificate Ready!</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Congratulations ${name}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Your coffee nursery certificate has been generated and is ready for download.
          </p>
          <p style="color: #333; font-weight: bold;">Certificate Number: ${certNumber}</p>
          <a href="${process.env.APP_URL}/certificates/${certNumber}" 
             style="display: inline-block; background: #2E7D32; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; margin-top: 20px;">
            Download Certificate
          </a>
        </div>
      </div>
    `
  }),

  certificateExpiry: (name, certNumber, daysLeft, language = 'en') => ({
    subject: language === 'sw' ? `Cheti Chako Kitamalizika Muda Katika Siku ${daysLeft}` : 
             language === 'fr' ? `Votre Certificat Expire dans ${daysLeft} Jours` : 
             `Your Certificate Expires in ${daysLeft} Days`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #FF9800; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">⏰ Renewal Reminder</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #333;">Hello ${name},</h2>
          <p style="color: #666; line-height: 1.6;">
            Your certificate <strong>${certNumber}</strong> will expire in <strong>${daysLeft} days</strong>.
            Please renew it to continue operating your coffee nursery.
          </p>
          <a href="${process.env.APP_URL}/certificates/renew/${certNumber}" 
             style="display: inline-block; background: #FF9800; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; margin-top: 20px;">
            Renew Now
          </a>
        </div>
      </div>
    `
  }),
};

// Main notification function
const sendNotification = async ({
  userId,
  type,
  title,
  message,
  data = {},
  channels = ['inApp'], // ['inApp', 'email', 'sms', 'push']
  language = 'en'
}) => {
  try {
    // Save to database (in-app notification)
    if (channels.includes('inApp')) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, data) VALUES (?, ?, ?, ?, ?)`,
        [userId, title, message, type, JSON.stringify(data)]
      );
    }

    // Get user details for email/SMS
    const [users] = await pool.query(
      'SELECT email, phone_number, preferred_language FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) return { success: false, error: 'User not found' };

    const user = users[0];
    const userLang = user.preferred_language || language;

    // Send Email
    if (channels.includes('email') && user.email) {
      const transporter = createEmailTransporter();
      
      let emailContent;
      if (type === 'welcome') {
        emailContent = emailTemplates.welcome(user.full_name, userLang);
      } else if (type === 'application_status') {
        emailContent = emailTemplates.applicationStatus(user.full_name, data.status, data.appId, userLang);
      } else if (type === 'certificate_ready') {
        emailContent = emailTemplates.certificateReady(user.full_name, data.certNumber, userLang);
      } else if (type === 'certificate_expiry') {
        emailContent = emailTemplates.certificateExpiry(user.full_name, data.certNumber, data.daysLeft, userLang);
      } else {
        emailContent = {
          subject: title,
          html: `<p>${message}</p>`
        };
      }

      await transporter.sendMail({
        from: `"AgriCertify" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    }

    // Send SMS
    if (channels.includes('sms') && user.phone_number) {
      await sendSMS(user.phone_number, message);
    }

    // Send Push Notification
    if (channels.includes('push')) {
      await sendPushNotification(userId, title, message, data);
    }

    return { success: true };
  } catch (error) {
    console.error('Notification sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Notification preferences
const updateNotificationPreferences = async (userId, preferences) => {
  try {
    await pool.query(
      `INSERT INTO notification_preferences (user_id, email_enabled, sms_enabled, push_enabled, 
       application_updates, certificate_updates, reminders, marketing)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       email_enabled = VALUES(email_enabled),
       sms_enabled = VALUES(sms_enabled),
       push_enabled = VALUES(push_enabled),
       application_updates = VALUES(application_updates),
       certificate_updates = VALUES(certificate_updates),
       reminders = VALUES(reminders),
       marketing = VALUES(marketing)`,
      [
        userId,
        preferences.emailEnabled,
        preferences.smsEnabled,
        preferences.pushEnabled,
        preferences.applicationUpdates,
        preferences.certificateUpdates,
        preferences.reminders,
        preferences.marketing
      ]
    );
    return { success: true };
  } catch (error) {
    console.error('Failed to update preferences:', error);
    return { success: false, error: error.message };
  }
};

// Get notification preferences
const getNotificationPreferences = async (userId) => {
  try {
    const [prefs] = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = ?',
      [userId]
    );
    
    if (prefs.length === 0) {
      // Return default preferences
      return {
        emailEnabled: true,
        smsEnabled: true,
        pushEnabled: true,
        applicationUpdates: true,
        certificateUpdates: true,
        reminders: true,
        marketing: false,
      };
    }
    
    return prefs[0];
  } catch (error) {
    console.error('Failed to get preferences:', error);
    return null;
  }
};

module.exports = {
  sendNotification,
  sendSMS,
  sendPushNotification,
  updateNotificationPreferences,
  getNotificationPreferences,
  emailTemplates,
};
