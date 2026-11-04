import type { Dictionary } from '../types.ts';

export const en: Dictionary = {
  meta: {
    siteName: 'VIRELUMA',
    tagline: 'Every life deserves to be found.',
    languageName: 'English',
    ogLocale: 'en_US',
  },
  a11y: {
    skipToContent: 'Skip to content',
    primaryNav: 'Main navigation',
    footerNav: 'Footer navigation',
    breadcrumbs: 'Breadcrumb',
    homeLink: 'VIRELUMA, go to home page',
    opensInNewTab: '(opens in a new tab)',
  },
  nav: {
    howItWorks: 'How it works',
    useCases: 'Use cases',
    qrNfc: 'QR & NFC',
    security: 'Security & privacy',
    faq: 'FAQ',
    menu: 'Menu',
    language: 'Language',
    theme: 'Theme',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
  },
  status: {
    label: 'In development',
    message:
      'VIRELUMA is under construction. Profiles cannot be created yet; we share our progress in the open.',
  },
  cta: {
    howItWorks: 'See how it works',
    followProject: 'Follow the project',
    readFaq: 'Read the FAQ',
    learnMore: 'Learn more',
    backHome: 'Back to home',
  },
  footer: {
    description:
      'Personal emergency identification with permanent QR codes, NFC accessories and trusted contacts.',
    disclaimer:
      'VIRELUMA does not replace emergency services, medical professionals or the authorities. In an emergency, call your local emergency number.',
    product: 'Product',
    project: 'Project',
    sourceCode: 'Source code',
    security: 'Report a vulnerability',
    legalPending: 'Formal legal documents are pending qualified legal review.',
    version: 'Version',
  },
  sample: {
    badge: 'Illustrative example',
    scanned: 'Emergency profile',
    name: 'Elena',
    message: 'I live with Alzheimer’s and sometimes get disoriented. Please stay with me and call my family.',
    needsTitle: 'How to help me',
    needs: ['Speak to me slowly and calmly', 'I wear a hearing aid in my right ear'],
    contactsTitle: 'Emergency contacts',
    contactRelation: 'Daughter',
    contactName: 'María',
    call: 'Call',
    emergency: 'Local emergency services',
    wristband: 'QR and NFC wristband',
    scanHint: 'Scan this code to see how VIRELUMA works',
  },
  pages: {
    home: {
      title: 'VIRELUMA — Every life deserves to be found',
      description:
        'QR and NFC emergency identification for older adults, people living with dementia, children and people with disabilities. You decide what is shown.',
      hero: {
        eyebrow: 'Emergency identification · QR · NFC',
        title: 'Every life deserves to be found.',
        lead: 'A permanent digital identity that connects someone who needs help with the people who love them most. Anyone can scan it with a phone, with nothing to install.',
        points: [
          'No apps or sign-up for the person helping',
          'You decide which information is visible',
          'The same code keeps working when details change',
        ],
      },
      how: {
        eyebrow: 'How it works',
        title: 'Three steps between confusion and a reunion',
        steps: [
          {
            title: 'Create a profile',
            body: 'You, a relative or an authorised caregiver records what matters: how to help, who to call and what is useful to know.',
          },
          {
            title: 'Carry the code',
            body: 'A QR code or NFC tag on a wristband, card or keyring. The code holds no personal data, only a secure link.',
          },
          {
            title: 'Someone can help',
            body: 'Whoever finds the person scans the code, sees only what you allowed and reaches the family in seconds.',
          },
        ],
      },
      audiences: {
        eyebrow: 'Who it is for',
        title: 'Designed for the people we care for',
        items: [
          {
            title: 'Older adults',
            body: 'More independence to go out for a walk, knowing someone will understand how to help.',
          },
          {
            title: 'Alzheimer’s and dementia',
            body: 'Clear instructions and immediate contacts when memory or orientation fail.',
          },
          {
            title: 'Children',
            body: 'Profiles created and managed only by parents or legal guardians.',
          },
          {
            title: 'Disability and communication',
            body: 'Explain how to communicate with the person and what they need, even if they cannot say it.',
          },
        ],
      },
      privacy: {
        eyebrow: 'Privacy by design',
        title: 'You decide what is shown',
        body: 'An emergency ID should never become a risk. VIRELUMA clearly separates public emergency information from private information.',
        points: [
          {
            title: 'The QR code holds no personal data',
            body: 'Only a random identifier that cannot be guessed.',
          },
          {
            title: 'Layered visibility',
            body: 'Each detail is public in emergencies, protected or private — your choice.',
          },
          {
            title: 'Kept out of search engines',
            body: 'Personal profiles are never indexed and never appear on Google.',
          },
          {
            title: 'Revocable at any time',
            body: 'Lost a wristband? Deactivate its code and issue a new one.',
          },
        ],
      },
      compatibility: {
        eyebrow: 'Compatibility',
        title: 'One link, many formats',
        body: 'The permanent code works on any carrier. Change the wristband or the design whenever you like: the link stays the same.',
        items: ['QR wristbands', 'NFC wristbands and cards', 'NFC stickers', 'Printed cards'],
        note: 'We will only publish an accessory as compatible after testing it.',
      },
      faq: {
        eyebrow: 'FAQ',
        title: 'What people ask us most',
      },
      final: {
        title: 'Let’s build a network that helps people be found.',
        body: 'VIRELUMA is developed in the open. Follow the project and see every step.',
      },
    },
    howItWorks: {
      title: 'How VIRELUMA works — QR and NFC emergency identification',
      description:
        'How an emergency profile is created, what the person scanning sees, and why the permanent link keeps working when details change.',
      eyebrow: 'How it works',
      h1: 'From a code on the wrist to a call to the family',
      intro:
        'VIRELUMA links a permanent identifier to an emergency profile that you control. Here is how each part works.',
      steps: [
        {
          title: '1. Create the profile',
          body: 'One account can manage several people: your parents, your children or the people you care for. We only ask for what is needed to help in an emergency.',
        },
        {
          title: '2. Choose what is visible',
          body: 'Each detail has a level: visible in emergencies, protected or private. Private details are only seen by authorised family members.',
        },
        {
          title: '3. Get the code',
          body: 'We generate a permanent QR code you can download, print or write to an NFC tag. You can change its design without changing where it points.',
        },
        {
          title: '4. Receive help',
          body: 'Whoever scans the code opens a simple page in their language, with clear instructions and buttons to call emergency contacts.',
        },
      ],
      helperSees: {
        title: 'What the helper sees',
        items: [
          'The name the person prefers to be called',
          'A short message and instructions to help',
          'Alerts you chose to show, such as serious allergies',
          'Buttons to call emergency contacts',
        ],
      },
      neverShown: {
        title: 'What is never shown automatically',
        items: ['Home address', 'Real-time location', 'Identity documents', 'Anything marked as private'],
      },
      permanent: {
        title: 'A link that does not expire',
        body: 'The code contains only a link with a random identifier. You can edit the profile, change the QR design or replace the wristband: codes already printed keep working. If a code is lost, you can revoke it and issue a new one.',
      },
    },
    useCases: {
      title: 'Use cases — Families, caregivers and people who need support',
      description:
        'How VIRELUMA helps families, caregivers, older adults, children and people with disabilities be found and assisted.',
      eyebrow: 'Use cases',
      h1: 'Every family cares in its own way',
      intro: 'VIRELUMA adapts to the person who needs support and to those who stand beside them.',
      cases: [
        {
          title: 'A daughter caring for her mother and grandfather',
          body: 'She manages two profiles from one account and invites her brother to share the care. Each person has their own code.',
        },
        {
          title: 'A person with Alzheimer’s who likes to walk',
          body: 'They wear a QR and NFC wristband. If they become disoriented, anyone can learn how to reassure them and who to call.',
        },
        {
          title: 'A professional caregiver',
          body: 'They only access the profiles the family authorised, with permissions that can be withdrawn at any time.',
        },
        {
          title: 'A girl on a school trip',
          body: 'Her parent or legal guardian creates the profile and decides what is shown. Her address and location are never shown.',
        },
        {
          title: 'A person with communication difficulties',
          body: 'The profile explains how to communicate with them, what helps and what to avoid.',
        },
        {
          title: 'An independent adult',
          body: 'They create their own profile with critical allergies and contacts, in case they ever cannot speak for themselves.',
        },
      ],
    },
    qrNfc: {
      title: 'QR, NFC and accessories — VIRELUMA compatibility',
      description:
        'How VIRELUMA QR codes and NFC tags work, which phones can read them, and how VIRELUMA relates to Apple AirTag.',
      eyebrow: 'QR & NFC',
      h1: 'One permanent link on the accessory you prefer',
      intro:
        'Every format points to the same secure link. None of them stores personal information on the accessory itself.',
      qr: {
        title: 'QR codes',
        body: 'They work with the camera of almost any smartphone, without apps. Download them in high resolution to print on wristbands, cards or labels.',
      },
      nfc: {
        title: 'NFC tags',
        body: 'Just hold the phone close. iPhone XS and later read NFC tags without opening an app; on Android, NFC must be turned on. The tag stores only the link.',
      },
      printed: {
        title: 'Printed cards',
        body: 'A wallet card with the QR code and a short identifier that can also be typed by hand.',
      },
      airtag: {
        title: 'What about Apple AirTag?',
        body: 'AirTag is Apple’s item tracker. Its location is only visible to its owner in Apple’s Find My app, and Apple designed it for items, not people. VIRELUMA cannot read an AirTag’s location or control it. You can use one as a complement: in Lost Mode, anyone who holds it to an NFC phone sees the message you set.',
      },
      testing: {
        title: 'Verified compatibility',
        body: 'We will publish the list of compatible accessories and phones only after testing them. We do not promise universal compatibility.',
      },
    },
    security: {
      title: 'Security and privacy — How VIRELUMA protects your data',
      description:
        'VIRELUMA security and privacy principles: data minimisation, visibility levels, unguessable identifiers and full family control.',
      eyebrow: 'Security & privacy',
      h1: 'Designed to protect, not to expose',
      intro:
        'An emergency profile holds sensitive information. These commitments guide every technical decision.',
      principles: [
        {
          title: 'Only what is needed',
          body: 'We ask for the minimum information needed to help in an emergency. Health details are optional and require explicit consent.',
        },
        {
          title: 'Unguessable identifiers',
          body: 'Each code uses a random 130-bit identifier unrelated to names, emails or phone numbers. Profiles cannot be enumerated.',
        },
        {
          title: 'Permissions enforced on the server',
          body: 'Who can view or edit each profile is checked in the database, not only in the interface.',
        },
        {
          title: 'No search engines',
          body: 'Personal profiles carry a no-index directive and never appear in sitemaps.',
        },
        {
          title: 'Your rights',
          body: 'You will be able to access, correct, export and delete your data, and withdraw any family member’s permissions.',
        },
        {
          title: 'Minors',
          body: 'Only parents or legal guardians can create and manage a minor’s profile.',
        },
      ],
      legal: {
        title: 'Legal framework',
        body: 'We are starting in Colombia, under Law 1581 of 2012 on personal data protection, and designing to meet rules such as the EU GDPR and Brazil’s LGPD. Formal policies will be published after qualified legal review; we do not claim compliance before obtaining it.',
      },
      report: {
        title: 'Report a vulnerability',
        body: 'If you find a security issue, please report it privately by following our security policy.',
      },
    },
    faq: {
      title: 'Frequently asked questions — VIRELUMA',
      description:
        'Answers about VIRELUMA emergency profiles: privacy, QR codes, NFC, minors and availability.',
      eyebrow: 'FAQ',
      h1: 'Frequently asked questions',
      intro: 'Can’t find your answer? Reach us through the project repository.',
      items: [
        {
          q: 'Does the person scanning the code need to install an app?',
          a: 'No. The code opens a web page in the phone’s browser. No sign-up or installation needed.',
        },
        {
          q: 'What information does the person scanning see?',
          a: 'Only what you marked as visible in emergencies: for example, the preferred name, a message, instructions to help and buttons to call your contacts.',
        },
        {
          q: 'Does the QR code stop working if I edit the profile?',
          a: 'No. The code contains a permanent link. You can change the details, the QR design or the wristband and printed codes keep working.',
        },
        {
          q: 'What if I lose the wristband?',
          a: 'You will be able to revoke that code from your account and generate a new one for the same person.',
        },
        {
          q: 'Does VIRELUMA show the person’s location?',
          a: 'No. VIRELUMA does not show real-time location or home address. Any future location feature will be optional, explicit and revocable.',
        },
        {
          q: 'Can I create a profile for my child?',
          a: 'Yes, if you are their parent or legal guardian. Profiles for minors have additional protections.',
        },
        {
          q: 'Does VIRELUMA replace emergency services?',
          a: 'No. VIRELUMA helps identify a person and contact their family. In an emergency, always call your local emergency number.',
        },
        {
          q: 'Does it work with Apple AirTag?',
          a: 'AirTag can be used as a complement, but VIRELUMA cannot read its location or control it. We explain this on the QR & NFC page.',
        },
        {
          q: 'Can I create a profile yet?',
          a: 'Not yet. VIRELUMA is in development and we publish progress openly on GitHub.',
        },
      ],
    },
  },
  app: {
    signIn: 'Sign in',
    loading: 'Loading…',
    notConfigured: 'Accounts are not available in this version of VIRELUMA yet.',
    fields: {
      email: 'Email',
      password: 'Password',
      newPassword: 'New password',
      passwordHint: 'At least 12 characters. A long phrase is safer and easier to remember.',
      showPassword: 'Show password',
    },
    login: {
      title: 'Sign in',
      lead: 'Manage the profiles of the people you care for.',
      submit: 'Sign in',
      forgot: 'Forgot your password?',
      noAccount: 'Don’t have an account?',
      register: 'Create an account',
    },
    register: {
      title: 'Create your account',
      lead: 'With an account you can create and manage emergency profiles.',
      submit: 'Create account',
      haveAccount: 'Already have an account?',
      privacy:
        'We use your email only for your account and security notices. It is never shown on an emergency profile.',
    },
    checkEmail: {
      title: 'Check your email',
      body: 'If the address is valid, we sent you a link to confirm your account. It can take a few minutes; please also check your spam folder.',
    },
    forgot: {
      title: 'Reset your password',
      lead: 'We will email you a link to create a new password.',
      submit: 'Send link',
      sent: 'If an account exists for that email, you will receive a link in a few minutes.',
    },
    reset: {
      title: 'Create a new password',
      submit: 'Save password',
      done: 'Your password has been updated.',
    },
    callback: {
      working: 'Confirming your link…',
      failed:
        'We could not complete the link. It may have expired or been opened on another device. If you were confirming your email, you can now sign in.',
    },
    account: {
      title: 'Your account',
      signedInAs: 'Signed in as',
      peopleTitle: 'People',
      peopleBody: 'Creating emergency profiles arrives in the next release.',
      signOut: 'Sign out',
      signOutEverywhere: 'Sign out on all devices',
      deleteTitle: 'Delete your account',
      deleteBody:
        'You can request deletion of your account and its data. We will first help you transfer the profiles you manage.',
      deleteButton: 'Request deletion',
      deleteConfirmTitle: 'Request deletion of your account?',
      deleteConfirmBody: 'We will record your request and contact you to complete it.',
      deleteRequested: 'We received your deletion request.',
      cancel: 'Cancel',
    },
    errors: {
      not_configured: 'Accounts are not available in this version yet.',
      invalid_credentials: 'The email or password is not correct.',
      email_not_confirmed: 'Please confirm your email before signing in. Check your inbox.',
      weak_password: 'The password must be between 12 and 72 characters.',
      invalid_email: 'Enter a valid email address.',
      rate_limited: 'Too many attempts. Please wait a few minutes and try again.',
      link_invalid: 'The link is invalid or has expired. Please request a new one.',
      network: 'You appear to be offline. Check your connection and try again.',
      unknown: 'Something went wrong. Please try again.',
    },
  },
  notFound: {
    title: 'Page not found',
    body: 'The page you are looking for does not exist or has moved.',
  },
  languageChooser: {
    title: 'VIRELUMA — Choose your language',
    description: 'Personal emergency identification with QR and NFC.',
    heading: 'Choose your language',
  },
};
