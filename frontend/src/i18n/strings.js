// ---------------------------------------------------------------------------
// ShilpSetu translations
// ---------------------------------------------------------------------------
// The app speaks three "interface languages". These are deliberately NOT the
// same list as LANGUAGES in constants.js - that longer list is what the AI
// writes an artisan's catalogue in, and it can grow freely. This shorter list
// is what the buttons, labels and help text on screen are translated into,
// and every one of them has to actually be written out by hand below.
//
// THE HINGLISH RULE
// -----------------
// Hinglish here is not "Hindi in Roman letters". It is what an Indian
// first-time smartphone user actually reads most comfortably:
//
//   * Feature names, buttons and labels stay in ENGLISH.
//     ("Photo Studio", "Save", "Smart Pricing", "Dashboard")
//     These are the words they will see in every other app on their phone,
//     the words a shopkeeper or their child will use when helping them, and
//     the words they would have to search for online. Translating them into
//     Devanagari actively makes the app harder to get help with.
//
//   * Explanations, instructions and descriptions are in HINGLISH.
//     ("AI se apni product photos ko professional banayein")
//     This is the sentence that has to actually be understood, so it goes
//     into the language they think in - just written in letters they can
//     already read, with no Devanagari keyboard needed.
//
// So a Hinglish user gets an app whose buttons look like every other app,
// but whose explanations sound like a person talking to them. That mix is
// the whole point, and it is why Hinglish is a separate option rather than
// just a spelling variant of Hindi.
// ---------------------------------------------------------------------------

// The three interface languages, in the order the chooser screen shows them.
export const UI_LANGUAGES = [
  {
    code: 'Hindi',
    // Written in the language itself, so someone who cannot read the other
    // two options can still find their own.
    native: 'हिंदी',
    sample: 'पूरा ऐप हिंदी में',
    flag: '🇮🇳',
  },
  {
    code: 'Hinglish',
    native: 'Hinglish',
    sample: 'Buttons English mein, samjhaane wali baatein Hinglish mein',
    flag: '💬',
  },
  {
    code: 'English',
    native: 'English',
    sample: 'The whole app in English',
    flag: '🌐',
  },
]

export const DEFAULT_LANGUAGE = 'Hinglish'

// Any language in constants.js that is not one of the three above still gets
// an interface - it just falls back to this one, while the AI keeps writing
// in their real chosen language.
export const FALLBACK_UI_LANGUAGE = 'English'

export const STRINGS = {
  // ---------------------------------------------------------------- common
  'common.save': {
    English: 'Save',
    Hindi: 'सेव करें',
    Hinglish: 'Save',
  },
  'common.cancel': {
    English: 'Cancel',
    Hindi: 'रद्द करें',
    Hinglish: 'Cancel',
  },
  'common.next': {
    English: 'Next',
    Hindi: 'आगे बढ़ें',
    Hinglish: 'Next',
  },
  'common.back': {
    English: 'Back',
    Hindi: 'पीछे',
    Hinglish: 'Back',
  },
  'common.continue': {
    English: 'Continue',
    Hindi: 'जारी रखें',
    Hinglish: 'Continue',
  },
  'common.loading': {
    English: 'Loading...',
    Hindi: 'लोड हो रहा है...',
    Hinglish: 'Load ho raha hai...',
  },
  'common.seeAll': {
    English: 'See all',
    Hindi: 'सभी देखें',
    Hinglish: 'See all',
  },
  'common.optional': {
    English: 'optional',
    Hindi: 'वैकल्पिक',
    Hinglish: 'optional',
  },
  'common.speak': {
    English: 'Speak',
    Hindi: 'बोलें',
    Hinglish: 'Bolein',
  },
  'common.voiceHint': {
    English: 'Tap the mic and speak instead of typing.',
    Hindi: 'माइक दबाएँ और टाइप करने के बजाय बोलें।',
    Hinglish: 'Mic dabaayein aur typing ki jagah bol kar likhein.',
  },

  // ------------------------------------------------------------- languages
  'lang.title': {
    English: 'Choose your language',
    Hindi: 'अपनी भाषा चुनें',
    Hinglish: 'Apni language chunein',
  },
  'lang.subtitle': {
    English: 'Which language are you most comfortable reading? You can change this later.',
    Hindi: 'आप किस भाषा में सबसे आसानी से पढ़ पाते हैं? इसे आप बाद में भी बदल सकते हैं।',
    Hinglish: 'Aap kis language mein sabse aaraam se padh paate hain? Ise baad mein bhi badal sakte hain.',
  },
  'lang.confirm': {
    English: 'Continue',
    Hindi: 'आगे बढ़ें',
    Hinglish: 'Continue',
  },
  'lang.changeLater': {
    English: 'You can change this any time from Profile & Settings.',
    Hindi: 'आप इसे कभी भी प्रोफ़ाइल व सेटिंग्स से बदल सकते हैं।',
    Hinglish: 'Ise aap kabhi bhi Profile & Settings se badal sakte hain.',
  },
  'lang.settingLabel': {
    English: 'App language',
    Hindi: 'ऐप की भाषा',
    Hinglish: 'App language',
  },

  // --------------------------------------------------------------- landing
  'landing.tagline': {
    English: 'Your Virtual Business Manager — turning your craft into a digital business.',
    Hindi: 'आपका वर्चुअल बिज़नेस मैनेजर — आपकी कारीगरी को डिजिटल बिज़नेस बनाता है।',
    Hinglish: 'Aapka Virtual Business Manager — aapki kaarigari ko digital business banata hai.',
  },
  'landing.getStarted': {
    English: 'Get Started',
    Hindi: 'शुरू करें',
    Hinglish: 'Get Started',
  },
  'landing.haveAccount': {
    English: 'Already have an account? Log in',
    Hindi: 'पहले से खाता है? लॉग इन करें',
    Hinglish: 'Pehle se account hai? Log in karein',
  },
  'landing.builtFor': {
    English: 'Built for every craft',
    Hindi: 'हर कारीगरी के लिए बना',
    Hinglish: 'Har craft ke liye banaya gaya',
  },
  'landing.needHelp': {
    English: 'Need help or have a question? Contact us',
    Hindi: 'मदद चाहिए या कोई सवाल है? हमसे संपर्क करें',
    Hinglish: 'Madad chahiye ya koi sawaal hai? Humse contact karein',
  },

  // ----------------------------------------------------------------- login
  'login.title': {
    English: 'Welcome back',
    Hindi: 'फिर से स्वागत है',
    Hinglish: 'Welcome back',
  },
  'login.subtitle': {
    English: 'Log in to manage your craft business.',
    Hindi: 'अपना कारीगरी का बिज़नेस चलाने के लिए लॉग इन करें।',
    Hinglish: 'Apna craft business chalaane ke liye log in karein.',
  },
  'login.phone': {
    English: 'Phone Number',
    Hindi: 'फ़ोन नंबर',
    Hinglish: 'Phone Number',
  },
  'login.password': {
    English: 'Password',
    Hindi: 'पासवर्ड',
    Hinglish: 'Password',
  },
  'login.submit': {
    English: 'Log In',
    Hindi: 'लॉग इन करें',
    Hinglish: 'Log In',
  },
  'login.submitting': {
    English: 'Logging in...',
    Hindi: 'लॉग इन हो रहा है...',
    Hinglish: 'Log in ho raha hai...',
  },
  'login.forgot': {
    English: 'Forgot password?',
    Hindi: 'पासवर्ड भूल गए?',
    Hinglish: 'Password bhool gaye?',
  },
  'login.noAccount': {
    English: "Don't have an account?",
    Hindi: 'खाता नहीं है?',
    Hinglish: 'Account nahi hai?',
  },
  'login.register': {
    English: 'Register',
    Hindi: 'रजिस्टर करें',
    Hinglish: 'Register',
  },

  // -------------------------------------------------------------- register
  'register.title': {
    English: 'Create your account',
    Hindi: 'अपना खाता बनाएँ',
    Hinglish: 'Apna account banayein',
  },
  'register.subtitle': {
    English: 'Tell us about you and your craft. It takes about two minutes.',
    Hindi: 'हमें अपने और अपनी कारीगरी के बारे में बताएँ। इसमें लगभग दो मिनट लगेंगे।',
    Hinglish: 'Apne aur apne craft ke baare mein batayein. Sirf do minute lagenge.',
  },
  'register.step1': {
    English: 'About you',
    Hindi: 'आपके बारे में',
    Hinglish: 'About you',
  },
  'register.step1desc': {
    English: 'Your basic details, so we know who you are.',
    Hindi: 'आपकी बुनियादी जानकारी, ताकि हम आपको पहचान सकें।',
    Hinglish: 'Aapki basic details, taaki hum aapko pehchaan sakein.',
  },
  'register.step2': {
    English: 'Security Question',
    Hindi: 'सुरक्षा प्रश्न',
    Hinglish: 'Security Question',
  },
  'register.step2desc': {
    English:
      'If you ever forget your password, we will ask you this question to make sure it is really you. Choose one you will always remember.',
    Hindi:
      'अगर आप कभी पासवर्ड भूल जाएँ, तो हम यही सवाल पूछेंगे ताकि पक्का हो कि यह वाकई आप हैं। ऐसा सवाल चुनें जो आपको हमेशा याद रहे।',
    Hinglish:
      'Agar aap kabhi password bhool jaayein, to hum yahi sawaal poochenge taaki confirm ho ki yeh sach mein aap hain. Aisa sawaal chunein jo aapko hamesha yaad rahe.',
  },
  'register.step3': {
    English: 'Your Business',
    Hindi: 'आपका बिज़नेस',
    Hinglish: 'Your Business',
  },
  'register.step3desc': {
    English: 'This is what buyers will see on your store page.',
    Hindi: 'यही जानकारी खरीदार आपके स्टोर पेज पर देखेंगे।',
    Hinglish: 'Yahi cheezein buyers aapke store page par dekhenge.',
  },
  'register.name': {
    English: 'Your Name',
    Hindi: 'आपका नाम',
    Hinglish: 'Your Name',
  },
  'register.phone': {
    English: 'Phone Number',
    Hindi: 'फ़ोन नंबर',
    Hinglish: 'Phone Number',
  },
  'register.email': {
    English: 'Email (optional)',
    Hindi: 'ईमेल (वैकल्पिक)',
    Hinglish: 'Email (optional)',
  },
  'register.password': {
    English: 'Password',
    Hindi: 'पासवर्ड',
    Hinglish: 'Password',
  },
  'register.passwordHint': {
    English: 'At least 6 characters.',
    Hindi: 'कम से कम 6 अक्षर।',
    Hinglish: 'Kam se kam 6 characters.',
  },
  'register.preferredLanguage': {
    English: 'Language for AI writing',
    Hindi: 'AI लेखन की भाषा',
    Hinglish: 'Language for AI writing',
  },
  'register.preferredLanguageHint': {
    English: 'The AI will write your product descriptions in this language.',
    Hindi: 'AI आपके प्रोडक्ट का विवरण इसी भाषा में लिखेगा।',
    Hinglish: 'AI aapke product ka description isi language mein likhega.',
  },
  'register.chooseQuestion': {
    English: 'Choose your question',
    Hindi: 'अपना सवाल चुनें',
    Hinglish: 'Choose your question',
  },
  'register.yourAnswer': {
    English: 'Your answer',
    Hindi: 'आपका जवाब',
    Hinglish: 'Your answer',
  },
  'register.answerPlaceholder': {
    English: 'Write your answer here',
    Hindi: 'अपना जवाब यहाँ लिखें',
    Hinglish: 'Apna jawaab yahaan likhein',
  },
  'register.answerHint': {
    English: 'Capital letters and extra spaces do not matter. Keep this answer private.',
    Hindi: 'बड़े-छोटे अक्षर और अतिरिक्त स्पेस से फर्क नहीं पड़ता। यह जवाब गुप्त रखें।',
    Hinglish: 'Capital letters aur extra spaces se koi fark nahi padta. Yeh jawaab private rakhein.',
  },
  'register.questionsError': {
    English: 'Could not load the security questions.',
    Hindi: 'सुरक्षा प्रश्न लोड नहीं हो सके।',
    Hinglish: 'Security questions load nahi ho paaye.',
  },
  'register.businessName': {
    English: 'Business / Craft Name',
    Hindi: 'बिज़नेस / कारीगरी का नाम',
    Hinglish: 'Business / Craft Name',
  },
  'register.craftCategory': {
    English: 'Craft Category',
    Hindi: 'कारीगरी की श्रेणी',
    Hinglish: 'Craft Category',
  },
  'register.description': {
    English: 'Describe your business',
    Hindi: 'अपने बिज़नेस के बारे में बताएँ',
    Hinglish: 'Apne business ke baare mein batayein',
  },
  'register.location': {
    English: 'Location (City/Town)',
    Hindi: 'स्थान (शहर/कस्बा)',
    Hinglish: 'Location (City/Town)',
  },
  'register.state': {
    English: 'State',
    Hindi: 'राज्य',
    Hinglish: 'State',
  },
  'register.submit': {
    English: 'Create Account',
    Hindi: 'खाता बनाएँ',
    Hinglish: 'Create Account',
  },
  'register.submitting': {
    English: 'Creating your account...',
    Hindi: 'आपका खाता बन रहा है...',
    Hinglish: 'Aapka account ban raha hai...',
  },
  'register.haveAccount': {
    English: 'Already have an account?',
    Hindi: 'पहले से खाता है?',
    Hinglish: 'Pehle se account hai?',
  },
  'register.login': {
    English: 'Log in',
    Hindi: 'लॉग इन करें',
    Hinglish: 'Log in',
  },
  'register.errPassword': {
    English: 'Password must be at least 6 characters.',
    Hindi: 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए।',
    Hinglish: 'Password kam se kam 6 characters ka hona chahiye.',
  },
  'register.errQuestion': {
    English: 'Please choose a security question.',
    Hindi: 'कृपया एक सुरक्षा प्रश्न चुनें।',
    Hinglish: 'Kripya ek security question chunein.',
  },
  'register.errAnswer': {
    English: 'Please write the answer to your security question.',
    Hindi: 'कृपया अपने सुरक्षा प्रश्न का जवाब लिखें।',
    Hinglish: 'Kripya apne security question ka jawaab likhein.',
  },

  // ------------------------------------------------------------------- nav
  'nav.home': {
    English: 'Home',
    Hindi: 'होम',
    Hinglish: 'Home',
  },
  'nav.products': {
    English: 'Products',
    Hindi: 'प्रोडक्ट',
    Hinglish: 'Products',
  },
  'nav.store': {
    English: 'Store',
    Hindi: 'स्टोर',
    Hinglish: 'Store',
  },
  'nav.aiChat': {
    English: 'AI Chat',
    Hindi: 'AI चैट',
    Hinglish: 'AI Chat',
  },
  'nav.profile': {
    English: 'Profile',
    Hindi: 'प्रोफ़ाइल',
    Hinglish: 'Profile',
  },

  // ----------------------------------------------------------- page titles
  'page.dashboard': {
    English: 'Dashboard',
    Hindi: 'डैशबोर्ड',
    Hinglish: 'Dashboard',
  },
  'page.products': {
    English: 'My Products',
    Hindi: 'मेरे प्रोडक्ट',
    Hinglish: 'My Products',
  },
  'page.photoStudio': {
    English: 'AI Photo Studio',
    Hindi: 'AI फोटो स्टूडियो',
    Hinglish: 'AI Photo Studio',
  },
  'page.catalogue': {
    English: 'AI Catalogue',
    Hindi: 'AI कैटलॉग',
    Hinglish: 'AI Catalogue',
  },
  'page.pricing': {
    English: 'Smart Pricing',
    Hindi: 'स्मार्ट प्राइसिंग',
    Hinglish: 'Smart Pricing',
  },
  'page.businessManager': {
    English: 'AI Business Manager',
    Hindi: 'AI बिज़नेस मैनेजर',
    Hinglish: 'AI Business Manager',
  },
  'page.digitalise': {
    English: 'Digitalise My Business',
    Hindi: 'मेरा बिज़नेस डिजिटल करें',
    Hinglish: 'Digitalise My Business',
  },
  'page.myStore': {
    English: 'My Digital Store',
    Hindi: 'मेरा डिजिटल स्टोर',
    Hinglish: 'My Digital Store',
  },
  'page.marketLinkage': {
    English: 'Market Opportunities',
    Hindi: 'बाज़ार के अवसर',
    Hinglish: 'Market Opportunities',
  },
  'page.profile': {
    English: 'Profile & Settings',
    Hindi: 'प्रोफ़ाइल व सेटिंग्स',
    Hinglish: 'Profile & Settings',
  },
  'page.help': {
    English: 'Help & Support',
    Hindi: 'मदद व सहायता',
    Hinglish: 'Help & Support',
  },

  // -------------------------------------------------------------- features
  // Feature NAMES stay English in Hinglish; only the descriptions switch.
  'feature.products.label': {
    English: 'My Products',
    Hindi: 'मेरे प्रोडक्ट',
    Hinglish: 'My Products',
  },
  'feature.products.desc': {
    English: 'Add, edit and manage your listings',
    Hindi: 'अपने प्रोडक्ट जोड़ें, बदलें और संभालें',
    Hinglish: 'Apne products add karein, edit karein aur manage karein',
  },
  'feature.photoStudio.label': {
    English: 'Photo Studio',
    Hindi: 'फोटो स्टूडियो',
    Hinglish: 'Photo Studio',
  },
  'feature.photoStudio.desc': {
    English: 'AI-enhance your product photos',
    Hindi: 'AI से अपनी प्रोडक्ट फोटो बेहतर बनाएँ',
    Hinglish: 'AI se apni product photos ko professional banayein',
  },
  'feature.catalogue.label': {
    English: 'AI Catalogue',
    Hindi: 'AI कैटलॉग',
    Hinglish: 'AI Catalogue',
  },
  'feature.catalogue.desc': {
    English: 'Auto-write titles & descriptions',
    Hindi: 'अपने आप शीर्षक और विवरण लिखवाएँ',
    Hinglish: 'Title aur description apne aap likhwayein',
  },
  'feature.pricing.label': {
    English: 'Smart Pricing',
    Hindi: 'स्मार्ट प्राइसिंग',
    Hinglish: 'Smart Pricing',
  },
  'feature.pricing.desc': {
    English: 'Fair, cost-based price suggestions',
    Hindi: 'लागत के हिसाब से सही दाम की सलाह',
    Hinglish: 'Lagat ke hisaab se sahi price ka suggestion',
  },
  'feature.businessManager.label': {
    English: 'AI Manager',
    Hindi: 'AI मैनेजर',
    Hinglish: 'AI Manager',
  },
  'feature.businessManager.desc': {
    English: 'Ask about product, business or budget',
    Hindi: 'प्रोडक्ट, बिज़नेस या बजट के बारे में पूछें',
    Hinglish: 'Product, business ya budget ke baare mein poochein',
  },
  'feature.digitalise.label': {
    English: 'Digitalise',
    Hindi: 'डिजिटल बनाएँ',
    Hinglish: 'Digitalise',
  },
  'feature.digitalise.desc': {
    English: 'Step-by-step to go fully online',
    Hindi: 'पूरी तरह ऑनलाइन जाने के आसान कदम',
    Hinglish: 'Poori tarah online jaane ke aasaan steps',
  },
  'feature.myStore.label': {
    English: 'My Store',
    Hindi: 'मेरा स्टोर',
    Hinglish: 'My Store',
  },
  'feature.myStore.desc': {
    English: 'Your public storefront & QR code',
    Hindi: 'आपका सार्वजनिक स्टोर और QR कोड',
    Hinglish: 'Aapka public store aur QR code',
  },
  'feature.marketLinkage.label': {
    English: 'Market Linkage',
    Hindi: 'बाज़ार जुड़ाव',
    Hinglish: 'Market Linkage',
  },
  'feature.marketLinkage.desc': {
    English: 'Discover buyers & opportunities',
    Hindi: 'खरीदार और नए मौके खोजें',
    Hinglish: 'Buyers aur naye mauke dhoondhein',
  },

  // ------------------------------------------------------------- dashboard
  'dash.welcome': {
    English: 'Welcome',
    Hindi: 'स्वागत है',
    Hinglish: 'Welcome',
  },
  'dash.discover': {
    English: 'Discover what you can do',
    Hindi: 'देखें आप क्या-क्या कर सकते हैं',
    Hinglish: 'Dekhein aap kya kya kar sakte hain',
  },
  'dash.quickAccess': {
    English: 'Quick access',
    Hindi: 'तुरंत पहुँच',
    Hinglish: 'Quick access',
  },
  'dash.statProducts': {
    English: 'Products',
    Hindi: 'प्रोडक्ट',
    Hinglish: 'Products',
  },
  'dash.statPublished': {
    English: 'Published',
    Hindi: 'प्रकाशित',
    Hinglish: 'Published',
  },
  'dash.statDrafts': {
    English: 'Drafts',
    Hindi: 'ड्राफ्ट',
    Hinglish: 'Drafts',
  },
  'dash.readiness': {
    English: 'Digital Readiness Score',
    Hindi: 'डिजिटल तैयारी स्कोर',
    Hinglish: 'Digital Readiness Score',
  },
  'dash.readinessHint': {
    English: 'Complete these steps to improve your score.',
    Hindi: 'अपना स्कोर बढ़ाने के लिए ये कदम पूरे करें।',
    Hinglish: 'Apna score badhaane ke liye yeh steps poore karein.',
  },
  'dash.recent': {
    English: 'Recent Products',
    Hindi: 'हाल के प्रोडक्ट',
    Hinglish: 'Recent Products',
  },
  'dash.explore': {
    English: 'Explore ShilpSetu',
    Hindi: 'ShilpSetu देखें',
    Hinglish: 'Explore ShilpSetu',
  },
  'dash.insight': {
    English: 'AI Insight',
    Hindi: 'AI सुझाव',
    Hinglish: 'AI Insight',
  },
  'dash.addFirst': {
    English: 'Add your first',
    Hindi: 'पहला जोड़ें',
    Hinglish: 'Add your first',
  },
  'dash.itemsSuffix': {
    English: 'items',
    Hindi: 'प्रोडक्ट',
    Hinglish: 'items',
  },
  'dash.itemSuffix': {
    English: 'item',
    Hindi: 'प्रोडक्ट',
    Hinglish: 'item',
  },
  'dash.live': {
    English: 'live',
    Hindi: 'लाइव',
    Hinglish: 'live',
  },
  'dash.ready': {
    English: 'ready',
    Hindi: 'तैयार',
    Hinglish: 'ready',
  },

  // ---------------------------------------------------------- input mode
  // Typing vs speaking is the artisan's choice, not ours - see
  // components/InputModeToggle.jsx for why this is an explicit setting
  // rather than something the app decides for them.
  'input.label': {
    English: 'How would you like to fill this in?',
    Hindi: 'आप इसे कैसे भरना चाहेंगे?',
    Hinglish: 'Aap ise kaise bharna chahenge?',
  },
  'input.keyboard': {
    English: 'Type',
    Hindi: 'टाइप करें',
    Hinglish: 'Type',
  },
  'input.voice': {
    English: 'Speak',
    Hindi: 'बोलें',
    Hinglish: 'Bolein',
  },
  'input.keyboardHint': {
    English: 'Keyboard only. The microphones stay hidden.',
    Hindi: 'सिर्फ़ कीबोर्ड। माइक छिपे रहेंगे।',
    Hinglish: 'Sirf keyboard. Mic chhupe rahenge.',
  },
  'input.voiceHint': {
    English: 'A microphone appears next to each box — and you can still type in any box.',
    Hindi: 'हर बॉक्स के पास माइक दिखेगा — और आप किसी भी बॉक्स में टाइप भी कर सकते हैं।',
    Hinglish: 'Har box ke paas mic dikhega — aur aap kisi bhi box mein type bhi kar sakte hain.',
  },
  'input.changeAnytime': {
    English: 'You can switch between these at any time.',
    Hindi: 'आप इनके बीच कभी भी बदल सकते हैं।',
    Hinglish: 'Aap inke beech kabhi bhi switch kar sakte hain.',
  },

  // --------------------------------------------------------------- profile
  'profile.email': {
    English: 'Email',
    Hindi: 'ईमेल',
    Hinglish: 'Email',
  },
  'profile.save': {
    English: 'Save Changes',
    Hindi: 'बदलाव सेव करें',
    Hinglish: 'Save Changes',
  },
  'profile.saving': {
    English: 'Saving...',
    Hindi: 'सेव हो रहा है...',
    Hinglish: 'Save ho raha hai...',
  },
  'profile.updated': {
    English: 'Profile updated.',
    Hindi: 'प्रोफ़ाइल अपडेट हो गई।',
    Hinglish: 'Profile update ho gayi.',
  },
  'profile.logout': {
    English: 'Log Out',
    Hindi: 'लॉग आउट',
    Hinglish: 'Log Out',
  },
  'profile.appLanguageHint': {
    English: 'This changes the buttons and labels across the whole app.',
    Hindi: 'इससे पूरे ऐप के बटन और लेबल बदल जाएँगे।',
    Hinglish: 'Isse poore app ke buttons aur labels badal jaayenge.',
  },
}

/**
 * Look up one string.
 *
 * Falls back English -> the key itself, so a missing translation shows
 * readable English rather than blowing up or rendering "undefined". That
 * matters because this dictionary will keep growing after this release, and
 * a half-translated screen must never be a broken screen.
 */
export function translate(key, language) {
  const entry = STRINGS[key]
  if (!entry) return key
  return entry[language] || entry[FALLBACK_UI_LANGUAGE] || key
}
