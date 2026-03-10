/**
 * Time-based greeting system with multi-language support
 */

const greetings = {
  en: {
    morning: 'Good morning',
    afternoon: 'Good afternoon',
    evening: 'Good evening',
    night: 'Good night',
    emoji: {
      morning: '☀️',
      afternoon: '🌤️',
      evening: '🌅',
      night: '🌙'
    }
  },
  sw: {
    morning: 'Habari za asubuhi',
    afternoon: 'Habari za mchana',
    evening: 'Habari za jioni',
    night: 'Usiku mwema',
    emoji: {
      morning: '☀️',
      afternoon: '🌤️',
      evening: '🌅',
      night: '🌙'
    }
  },
  fr: {
    morning: 'Bonjour',
    afternoon: 'Bon après-midi',
    evening: 'Bonsoir',
    night: 'Bonne nuit',
    emoji: {
      morning: '☀️',
      afternoon: '🌤️',
      evening: '🌅',
      night: '🌙'
    }
  }
};

/**
 * Get current time period
 * @param {Date} date - Date object (defaults to now)
 * @returns {string} - Time period (morning, afternoon, evening, night)
 */
const getTimePeriod = (date = new Date()) => {
  const hour = date.getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'morning';
  } else if (hour >= 12 && hour < 17) {
    return 'afternoon';
  } else if (hour >= 17 && hour < 21) {
    return 'evening';
  } else {
    return 'night';
  }
};

/**
 * Get greeting message based on time and language
 * @param {string} name - User's name
 * @param {string} lang - Language code (en, sw, fr)
 * @param {Date} date - Date object (defaults to now)
 * @returns {object} - Greeting object with text and emoji
 */
const getGreeting = (name = '', lang = 'en', date = new Date()) => {
  const period = getTimePeriod(date);
  const language = greetings[lang] || greetings.en;
  
  const greetingText = language[period];
  const emoji = language.emoji[period];
  
  return {
    text: name ? `${greetingText}, ${name}!` : `${greetingText}!`,
    emoji: emoji,
    period: period,
    fullMessage: name ? `${greetingText}, ${name}! ${emoji}` : `${greetingText}! ${emoji}`
  };
};

/**
 * Get all available greetings for a specific time
 * @param {string} name - User's name
 * @param {Date} date - Date object (defaults to now)
 * @returns {object} - All language greetings
 */
const getAllGreetings = (name = '', date = new Date()) => {
  const period = getTimePeriod(date);
  const result = {};
  
  Object.keys(greetings).forEach(lang => {
    const greetingText = greetings[lang][period];
    const emoji = greetings[lang].emoji[period];
    result[lang] = {
      text: name ? `${greetingText}, ${name}!` : `${greetingText}!`,
      emoji: emoji,
      fullMessage: name ? `${greetingText}, ${name}! ${emoji}` : `${greetingText}! ${emoji}`
    };
  });
  
  return result;
};

/**
 * Get welcome message with system info
 * @param {string} name - User's name
 * @param {string} lang - Language code
 * @param {string} role - User role
 * @returns {object} - Welcome package
 */
const getWelcomePackage = (name = '', lang = 'en', role = 'user') => {
  const greeting = getGreeting(name, lang);
  const period = getTimePeriod();
  
  const welcomeMessages = {
    en: {
      farmer: 'Ready to manage your coffee nursery certificates?',
      officer: 'You have applications waiting for review.',
      admin: 'System is running smoothly.',
      user: 'Welcome to AgriCertify!'
    },
    sw: {
      farmer: 'Tayari kusimamia vyeti vya kitalu vya kahawa?',
      officer: 'Una maombi yanayosubiri ukaguzi.',
      admin: 'Mfumo unafanya kazi vizuri.',
      user: 'Karibu AgriCertify!'
    },
    fr: {
      farmer: 'Prêt à gérer vos certificats de pépinière de café?',
      officer: 'Vous avez des demandes en attente de révision.',
      admin: 'Le système fonctionne bien.',
      user: 'Bienvenue sur AgriCertify!'
    }
  };
  
  const messages = welcomeMessages[lang] || welcomeMessages.en;
  
  return {
    greeting: greeting,
    welcomeMessage: messages[role] || messages.user,
    timeOfDay: period,
    language: lang,
    tips: getDailyTip(lang, role)
  };
};

/**
 * Get daily tip based on role and language
 * @param {string} lang - Language code
 * @param {string} role - User role
 * @returns {string} - Daily tip
 */
const getDailyTip = (lang = 'en', role = 'farmer') => {
  const tips = {
    en: {
      farmer: [
        'Keep your nursery records up to date for faster certification.',
        'Upload clear documents to avoid application delays.',
        'Renew your certificate 30 days before expiry.',
        'Check your application status regularly.',
        'Ensure your contact information is always current.'
      ],
      officer: [
        'Review applications within 3 business days.',
        'Add detailed comments when rejecting applications.',
        'Verify all documents before approval.',
        'Communicate clearly with farmers.',
        'Keep your workload organized.'
      ],
      admin: [
        'Monitor system performance regularly.',
        'Backup data weekly.',
        'Review user activity logs.',
        'Keep software updated.',
        'Ensure data security compliance.'
      ]
    },
    sw: {
      farmer: [
        'Weka rekodi za kitalu zako sawa kwa uhalalishaji wa haraka.',
        'Pakia nyaraka wazi ili kuepuka ucheleweshaji.',
        'Fanya upya cheti chako siku 30 kabla ya kumalizika.',
        'Angalia hali ya maombi yako mara kwa mara.',
        'Hakikisha maelezo yako ya mawasiliano ni ya siku zote.'
      ],
      officer: [
        'Kagua maombi ndani ya siku 3 za kazi.',
        'Ongeza maoni ya kina unapokataa maombi.',
        'Thibitisha nyaraka zote kabla ya kuidhinisha.',
        'Wasiliana vizuri na wakulima.',
        'Weka kazi yako kwa mpangilio.'
      ],
      admin: [
        'Fuatilia utendaji wa mfumo mara kwa mara.',
        'Hifadhi nakala za data kila wiki.',
        'Kagua kumbukumbu za shughuli za watumiaji.',
        'Weka programu ya sasa.',
        'Hakikisha kufuata usalama wa data.'
      ]
    },
    fr: {
      farmer: [
        'Gardez vos registres de pépinière à jour pour une certification plus rapide.',
        'Téléchargez des documents clairs pour éviter les retards.',
        'Renouvelez votre certificat 30 jours avant expiration.',
        'Vérifiez régulièrement le statut de votre demande.',
        'Assurez-vous que vos coordonnées sont toujours à jour.'
      ],
      officer: [
        'Examinez les demandes dans les 3 jours ouvrables.',
        'Ajoutez des commentaires détaillés lors du rejet.',
        'Vérifiez tous les documents avant approbation.',
        'Communiquez clairement avec les agriculteurs.',
        'Gardez votre charge de travail organisée.'
      ],
      admin: [
        'Surveillez régulièrement les performances du système.',
        'Sauvegardez les données chaque semaine.',
        'Consultez les journaux d\'activité des utilisateurs.',
        'Gardez le logiciel à jour.',
        'Assurez la conformité de la sécurité des données.'
      ]
    }
  };
  
  const roleTips = tips[lang]?.[role] || tips.en.farmer;
  const today = new Date().getDay();
  return roleTips[today % roleTips.length];
};

module.exports = {
  getGreeting,
  getTimePeriod,
  getAllGreetings,
  getWelcomePackage,
  getDailyTip,
  greetings
};
