import type { Dictionary } from '../types.ts';

export const fr: Dictionary = {
  meta: {
    siteName: 'VIRELUMA',
    tagline: 'Chaque vie mérite d’être retrouvée.',
    languageName: 'Français',
    ogLocale: 'fr_FR',
  },
  a11y: {
    skipToContent: 'Aller au contenu',
    primaryNav: 'Navigation principale',
    footerNav: 'Navigation du pied de page',
    breadcrumbs: 'Fil d’Ariane',
    homeLink: 'VIRELUMA, aller à l’accueil',
    opensInNewTab: '(s’ouvre dans un nouvel onglet)',
  },
  nav: {
    howItWorks: 'Fonctionnement',
    useCases: 'Cas d’usage',
    qrNfc: 'QR et NFC',
    security: 'Sécurité et confidentialité',
    faq: 'FAQ',
    menu: 'Menu',
    language: 'Langue',
    theme: 'Thème',
    themeLight: 'Clair',
    themeDark: 'Sombre',
    themeSystem: 'Système',
  },
  status: {
    label: 'En développement',
    message:
      'VIRELUMA est en construction. Il n’est pas encore possible de créer des profils ; nous partageons nos avancées en toute transparence.',
  },
  cta: {
    howItWorks: 'Découvrir le fonctionnement',
    followProject: 'Suivre le projet',
    readFaq: 'Lire la FAQ',
    learnMore: 'En savoir plus',
    backHome: 'Retour à l’accueil',
  },
  footer: {
    description:
      'Identification personnelle d’urgence avec des codes QR permanents, des accessoires NFC et des contacts de confiance.',
    disclaimer:
      'VIRELUMA ne remplace pas les services d’urgence, les professionnels de santé ni les autorités. En cas d’urgence, appelez le numéro d’urgence local.',
    product: 'Produit',
    project: 'Projet',
    sourceCode: 'Code source',
    security: 'Signaler une vulnérabilité',
    legalPending: 'Les documents juridiques officiels sont en attente d’une revue juridique qualifiée.',
    version: 'Version',
  },
  sample: {
    badge: 'Exemple illustratif',
    scanned: 'Profil d’urgence',
    name: 'Elena',
    message:
      'Je vis avec la maladie d’Alzheimer et je suis parfois désorientée. Merci de rester avec moi et d’appeler ma famille.',
    needsTitle: 'Comment m’aider',
    needs: ['Parlez-moi lentement et calmement', 'Je porte un appareil auditif à l’oreille droite'],
    contactsTitle: 'Contacts d’urgence',
    contactRelation: 'Fille',
    contactName: 'María',
    call: 'Appeler',
    emergency: 'Urgences locales',
    wristband: 'Bracelet QR et NFC',
    scanHint: 'Scannez ce code pour découvrir le fonctionnement de VIRELUMA',
  },
  pages: {
    home: {
      title: 'VIRELUMA — Chaque vie mérite d’être retrouvée',
      description:
        'Identification d’urgence par QR et NFC pour les personnes âgées, les personnes atteintes de démence, les enfants et les personnes en situation de handicap. Vous décidez de ce qui est affiché.',
      hero: {
        eyebrow: 'Identification d’urgence · QR · NFC',
        title: 'Chaque vie mérite d’être retrouvée.',
        lead: 'Une identité numérique permanente qui relie une personne ayant besoin d’aide à ceux qui l’aiment le plus. N’importe qui peut la scanner avec son téléphone, sans rien installer.',
        points: [
          'Ni application ni inscription pour la personne qui aide',
          'Vous décidez des informations visibles',
          'Le même code fonctionne même si les informations changent',
        ],
      },
      how: {
        eyebrow: 'Fonctionnement',
        title: 'Trois étapes entre la confusion et les retrouvailles',
        steps: [
          {
            title: 'Créez un profil',
            body: 'Vous, un proche ou un aidant autorisé renseignez l’essentiel : comment aider, qui appeler et ce qu’il est utile de savoir.',
          },
          {
            title: 'Portez le code sur vous',
            body: 'Un QR code ou une puce NFC sur un bracelet, une carte ou un porte-clés. Le code ne contient aucune donnée personnelle, seulement un lien sécurisé.',
          },
          {
            title: 'Quelqu’un peut aider',
            body: 'La personne qui la trouve scanne le code, ne voit que ce que vous avez autorisé et contacte la famille en quelques secondes.',
          },
        ],
      },
      audiences: {
        eyebrow: 'Pour qui',
        title: 'Pensé pour les personnes dont nous prenons soin',
        items: [
          {
            title: 'Personnes âgées',
            body: 'Plus d’autonomie pour sortir se promener, avec l’assurance que quelqu’un saura comment aider.',
          },
          {
            title: 'Alzheimer et démence',
            body: 'Des instructions claires et des contacts immédiats lorsque la mémoire ou l’orientation font défaut.',
          },
          {
            title: 'Enfants',
            body: 'Des profils créés et gérés uniquement par les parents ou les tuteurs légaux.',
          },
          {
            title: 'Handicap et communication',
            body: 'Expliquez comment communiquer avec la personne et ce dont elle a besoin, même si elle ne peut pas le dire.',
          },
        ],
      },
      privacy: {
        eyebrow: 'Confidentialité dès la conception',
        title: 'C’est vous qui décidez de ce qui s’affiche',
        body: 'Une identification d’urgence ne devrait jamais devenir un risque. VIRELUMA sépare donc clairement les informations publiques d’urgence des informations privées.',
        points: [
          {
            title: 'Le QR code ne contient aucune donnée personnelle',
            body: 'Seulement un identifiant aléatoire impossible à deviner.',
          },
          {
            title: 'Visibilité par niveaux',
            body: 'Chaque information est publique en cas d’urgence, protégée ou privée, selon votre choix.',
          },
          {
            title: 'Hors des moteurs de recherche',
            body: 'Les profils personnels ne sont jamais indexés et n’apparaissent jamais sur Google.',
          },
          {
            title: 'Révocable à tout moment',
            body: 'Bracelet perdu ? Désactivez son code et générez-en un nouveau.',
          },
        ],
      },
      compatibility: {
        eyebrow: 'Compatibilité',
        title: 'Un seul lien, de nombreux formats',
        body: 'Le code permanent fonctionne sur tous les supports. Changez de bracelet ou de design quand vous le souhaitez : le lien reste le même.',
        items: ['Bracelets QR', 'Bracelets et cartes NFC', 'Autocollants NFC', 'Cartes imprimées'],
        note: 'Nous ne publierons un accessoire comme compatible qu’après l’avoir testé.',
      },
      faq: {
        eyebrow: 'FAQ',
        title: 'Les questions les plus fréquentes',
      },
      final: {
        title: 'Construisons ensemble un réseau qui aide à retrouver.',
        body: 'VIRELUMA est développé en toute transparence. Suivez le projet et chacune de ses avancées.',
      },
    },
    howItWorks: {
      title: 'Fonctionnement de VIRELUMA — Identification d’urgence par QR et NFC',
      description:
        'Comment un profil d’urgence est créé, ce que voit la personne qui scanne le code et pourquoi le lien permanent fonctionne même si les informations changent.',
      eyebrow: 'Fonctionnement',
      h1: 'D’un code au poignet à un appel à la famille',
      intro:
        'VIRELUMA relie un identifiant permanent à un profil d’urgence que vous contrôlez. Voici comment fonctionne chaque élément.',
      steps: [
        {
          title: '1. Créer le profil',
          body: 'Un compte peut gérer plusieurs personnes : vos parents, vos enfants ou les personnes que vous accompagnez. Nous ne demandons que le nécessaire pour aider en cas d’urgence.',
        },
        {
          title: '2. Choisir ce qui est visible',
          body: 'Chaque information a un niveau : visible en cas d’urgence, protégée ou privée. Les informations privées ne sont visibles que par les membres autorisés de la famille.',
        },
        {
          title: '3. Obtenir le code',
          body: 'Nous générons un QR code permanent que vous pouvez télécharger, imprimer ou écrire sur une puce NFC. Vous pouvez modifier son design sans changer sa destination.',
        },
        {
          title: '4. Recevoir de l’aide',
          body: 'La personne qui scanne le code ouvre une page simple, dans sa langue, avec des instructions claires et des boutons pour appeler les contacts d’urgence.',
        },
      ],
      helperSees: {
        title: 'Ce que voit la personne qui aide',
        items: [
          'Le prénom par lequel la personne préfère être appelée',
          'Un court message et des instructions pour aider',
          'Les alertes que vous avez choisi d’afficher, comme des allergies graves',
          'Des boutons pour appeler les contacts d’urgence',
        ],
      },
      neverShown: {
        title: 'Ce qui n’est jamais affiché automatiquement',
        items: [
          'L’adresse du domicile',
          'La localisation en temps réel',
          'Les pièces d’identité',
          'Les informations marquées comme privées',
        ],
      },
      permanent: {
        title: 'Un lien qui n’expire pas',
        body: 'Le code contient uniquement un lien avec un identifiant aléatoire. Vous pouvez modifier le profil, changer le design du QR code ou remplacer le bracelet : les codes déjà imprimés continuent de fonctionner. Si un code est perdu, vous pouvez le révoquer et en générer un nouveau.',
      },
    },
    useCases: {
      title: 'Cas d’usage — Familles, aidants et personnes ayant besoin de soutien',
      description:
        'Comment VIRELUMA aide les familles, les aidants, les personnes âgées, les enfants et les personnes en situation de handicap à être retrouvés et assistés.',
      eyebrow: 'Cas d’usage',
      h1: 'Chaque famille prend soin à sa manière',
      intro:
        'VIRELUMA s’adapte à la personne qui a besoin de soutien et à celles et ceux qui l’accompagnent.',
      cases: [
        {
          title: 'Une fille qui s’occupe de sa mère et de son grand-père',
          body: 'Elle gère deux profils depuis un seul compte et invite son frère à partager l’accompagnement. Chaque personne a son propre code.',
        },
        {
          title: 'Une personne atteinte d’Alzheimer qui aime marcher',
          body: 'Elle porte un bracelet QR et NFC. Si elle se désoriente, n’importe qui peut savoir comment la rassurer et qui appeler.',
        },
        {
          title: 'Un aidant professionnel',
          body: 'Il n’accède qu’aux profils autorisés par la famille, avec des autorisations révocables à tout moment.',
        },
        {
          title: 'Une petite fille en sortie scolaire',
          body: 'Sa mère ou son tuteur légal crée le profil et décide de ce qui s’affiche. Son adresse et sa localisation ne sont jamais affichées.',
        },
        {
          title: 'Une personne ayant des difficultés à communiquer',
          body: 'Le profil explique comment communiquer avec elle, ce qui l’aide et ce qu’il vaut mieux éviter.',
        },
        {
          title: 'Un adulte autonome',
          body: 'Il crée son propre profil avec ses allergies graves et ses contacts, au cas où il ne pourrait pas parler pour lui-même.',
        },
      ],
    },
    qrNfc: {
      title: 'QR, NFC et accessoires — Compatibilité de VIRELUMA',
      description:
        'Comment fonctionnent les QR codes et les puces NFC de VIRELUMA, quels téléphones peuvent les lire et quel est le lien avec Apple AirTag.',
      eyebrow: 'QR et NFC',
      h1: 'Un lien permanent sur l’accessoire de votre choix',
      intro:
        'Tous les formats pointent vers le même lien sécurisé. Aucun ne stocke d’informations personnelles sur l’accessoire lui-même.',
      qr: {
        title: 'QR codes',
        body: 'Ils fonctionnent avec l’appareil photo de presque tous les smartphones, sans application. Téléchargez-les en haute résolution pour les imprimer sur des bracelets, des cartes ou des étiquettes.',
      },
      nfc: {
        title: 'Puces NFC',
        body: 'Il suffit d’approcher le téléphone. Les iPhone à partir du XS lisent les puces NFC sans ouvrir d’application ; sur Android, le NFC doit être activé. La puce ne stocke que le lien.',
      },
      printed: {
        title: 'Cartes imprimées',
        body: 'Une carte pour le portefeuille avec le QR code et un identifiant court qui peut aussi être saisi à la main.',
      },
      airtag: {
        title: 'Et Apple AirTag ?',
        body: 'AirTag est un traceur d’objets d’Apple. Sa position n’est visible que par son propriétaire dans l’app Localiser d’Apple, et Apple l’a conçu pour des objets, pas pour des personnes. VIRELUMA ne peut ni lire la position d’un AirTag ni le contrôler. Vous pouvez l’utiliser en complément : en mode Perdu, toute personne qui l’approche d’un téléphone NFC verra le message que vous avez défini.',
      },
      testing: {
        title: 'Compatibilité vérifiée',
        body: 'Nous ne publierons la liste des accessoires et téléphones compatibles qu’après les avoir testés. Nous ne promettons pas une compatibilité universelle.',
      },
    },
    security: {
      title: 'Sécurité et confidentialité — Comment VIRELUMA protège vos données',
      description:
        'Principes de sécurité et de confidentialité de VIRELUMA : minimisation des données, niveaux de visibilité, identifiants impossibles à deviner et contrôle total par la famille.',
      eyebrow: 'Sécurité et confidentialité',
      h1: 'Conçu pour protéger, pas pour exposer',
      intro:
        'Un profil d’urgence contient des informations sensibles. Ces engagements guident chaque décision technique.',
      principles: [
        {
          title: 'Uniquement le nécessaire',
          body: 'Nous demandons le minimum d’informations pour aider en cas d’urgence. Les données de santé sont facultatives et nécessitent un consentement explicite.',
        },
        {
          title: 'Des identifiants impossibles à deviner',
          body: 'Chaque code utilise un identifiant aléatoire de 130 bits, sans lien avec un nom, un e-mail ou un numéro de téléphone. Les profils ne peuvent pas être parcourus à la suite.',
        },
        {
          title: 'Autorisations vérifiées côté serveur',
          body: 'Qui peut voir ou modifier chaque profil est vérifié dans la base de données, pas seulement dans l’interface.',
        },
        {
          title: 'Aucun moteur de recherche',
          body: 'Les profils personnels portent une directive de non-indexation et n’apparaissent jamais dans les plans du site.',
        },
        {
          title: 'Vos droits',
          body: 'Vous pourrez consulter, corriger, exporter et supprimer vos données, et retirer les autorisations de n’importe quel membre de la famille.',
        },
        {
          title: 'Mineurs',
          body: 'Seuls les parents ou les tuteurs légaux peuvent créer et gérer le profil d’un mineur.',
        },
      ],
      legal: {
        title: 'Cadre juridique',
        body: 'Nous commençons par la Colombie, dans le cadre de la loi 1581 de 2012 sur la protection des données personnelles, et nous concevons le service pour respecter des règles comme le RGPD européen et la LGPD brésilienne. Les politiques officielles seront publiées après une revue juridique qualifiée ; nous n’affirmons aucune conformité avant de l’avoir obtenue.',
      },
      report: {
        title: 'Signaler une vulnérabilité',
        body: 'Si vous découvrez un problème de sécurité, signalez-le de manière confidentielle en suivant notre politique de sécurité.',
      },
    },
    faq: {
      title: 'Questions fréquentes — VIRELUMA',
      description:
        'Réponses sur les profils d’urgence VIRELUMA : confidentialité, QR codes, NFC, mineurs et disponibilité.',
      eyebrow: 'FAQ',
      h1: 'Questions fréquentes',
      intro: 'Vous ne trouvez pas votre réponse ? Contactez-nous via le dépôt du projet.',
      items: [
        {
          q: 'La personne qui scanne le code doit-elle installer une application ?',
          a: 'Non. Le code ouvre une page web dans le navigateur du téléphone. Aucune inscription ni installation n’est nécessaire.',
        },
        {
          q: 'Quelles informations voit la personne qui scanne le code ?',
          a: 'Uniquement celles que vous avez marquées comme visibles en cas d’urgence : par exemple, le prénom d’usage, un message, des instructions pour aider et des boutons pour appeler vos contacts.',
        },
        {
          q: 'Le QR code cesse-t-il de fonctionner si je modifie le profil ?',
          a: 'Non. Le code contient un lien permanent. Vous pouvez modifier les informations, le design du QR code ou le bracelet : les codes déjà imprimés continuent de fonctionner.',
        },
        {
          q: 'Que se passe-t-il si je perds le bracelet ?',
          a: 'Vous pourrez révoquer ce code depuis votre compte et en générer un nouveau pour la même personne.',
        },
        {
          q: 'VIRELUMA affiche-t-il la localisation de la personne ?',
          a: 'Non. VIRELUMA n’affiche ni la localisation en temps réel ni l’adresse du domicile. Toute future fonction de localisation sera facultative, explicite et révocable.',
        },
        {
          q: 'Puis-je créer un profil pour mon enfant ?',
          a: 'Oui, si vous êtes son parent ou son tuteur légal. Les profils de mineurs bénéficient de protections supplémentaires.',
        },
        {
          q: 'VIRELUMA remplace-t-il les services d’urgence ?',
          a: 'Non. VIRELUMA aide à identifier une personne et à contacter sa famille. En cas d’urgence, appelez toujours le numéro d’urgence local.',
        },
        {
          q: 'Est-ce compatible avec Apple AirTag ?',
          a: 'AirTag peut être utilisé en complément, mais VIRELUMA ne peut ni lire sa position ni le contrôler. Nous l’expliquons sur la page QR et NFC.',
        },
        {
          q: 'Puis-je déjà créer un profil ?',
          a: 'Pas encore. VIRELUMA est en développement et nous publions nos avancées ouvertement sur GitHub.',
        },
      ],
    },
  },
  notFound: {
    title: 'Page introuvable',
    body: 'La page que vous cherchez n’existe pas ou a été déplacée.',
  },
  languageChooser: {
    title: 'VIRELUMA — Choisissez votre langue',
    description: 'Identification personnelle d’urgence par QR et NFC.',
    heading: 'Choisissez votre langue',
  },
};
