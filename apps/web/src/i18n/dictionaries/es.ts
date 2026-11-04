/**
 * Spanish — source dictionary. Every other locale must match this shape
 * (enforced by TypeScript and by i18n.test.ts).
 */
export const es = {
  meta: {
    siteName: 'VIRELUMA',
    tagline: 'Cada vida merece ser encontrada.',
    languageName: 'Español',
    ogLocale: 'es_CO',
  },
  a11y: {
    skipToContent: 'Saltar al contenido',
    primaryNav: 'Navegación principal',
    footerNav: 'Navegación del pie de página',
    breadcrumbs: 'Ruta de navegación',
    homeLink: 'VIRELUMA, ir al inicio',
    opensInNewTab: '(se abre en una pestaña nueva)',
  },
  nav: {
    howItWorks: 'Cómo funciona',
    useCases: 'Casos de uso',
    qrNfc: 'QR y NFC',
    security: 'Seguridad y privacidad',
    faq: 'Preguntas frecuentes',
    menu: 'Menú',
    language: 'Idioma',
    theme: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Oscuro',
    themeSystem: 'Sistema',
  },
  status: {
    label: 'En desarrollo',
    message:
      'VIRELUMA está en construcción. Todavía no es posible crear perfiles; publicamos el avance de forma abierta.',
  },
  cta: {
    howItWorks: 'Ver cómo funciona',
    followProject: 'Seguir el proyecto',
    readFaq: 'Leer las preguntas frecuentes',
    learnMore: 'Saber más',
    backHome: 'Volver al inicio',
  },
  footer: {
    description:
      'Identificación personal de emergencia con códigos QR permanentes, accesorios NFC y contactos de confianza.',
    disclaimer:
      'VIRELUMA no reemplaza a los servicios de emergencia, a profesionales de la salud ni a las autoridades. En una emergencia, llama al número de emergencias local.',
    product: 'Producto',
    project: 'Proyecto',
    sourceCode: 'Código fuente',
    security: 'Reportar una vulnerabilidad',
    legalPending: 'Los documentos legales formales están pendientes de revisión jurídica.',
    version: 'Versión',
  },
  sample: {
    badge: 'Ejemplo ilustrativo',
    scanned: 'Perfil de emergencia',
    name: 'Elena',
    message: 'Vivo con Alzheimer y a veces me desoriento. Por favor, quédate conmigo y llama a mi familia.',
    needsTitle: 'Cómo ayudarme',
    needs: ['Háblame despacio y con calma', 'Uso audífono en el oído derecho'],
    contactsTitle: 'Contactos de emergencia',
    contactRelation: 'Hija',
    contactName: 'María',
    call: 'Llamar',
    emergency: 'Emergencias locales',
    wristband: 'Pulsera con QR y NFC',
    scanHint: 'Escanea este código para conocer cómo funciona VIRELUMA',
  },
  pages: {
    home: {
      title: 'VIRELUMA — Cada vida merece ser encontrada',
      description:
        'Identificación de emergencia con QR y NFC para personas mayores, personas con Alzheimer, niños y personas con discapacidad. Tú decides qué información se muestra.',
      hero: {
        eyebrow: 'Identificación de emergencia · QR · NFC',
        title: 'Cada vida merece ser encontrada.',
        lead: 'Una identidad digital permanente que conecta a quien necesita ayuda con las personas que más le quieren. Cualquiera puede escanearla con su teléfono, sin instalar nada.',
        points: [
          'Sin aplicaciones ni registro para quien ayuda',
          'Tú decides qué información es visible',
          'El mismo código funciona aunque cambien los datos',
        ],
      },
      how: {
        eyebrow: 'Cómo funciona',
        title: 'Tres pasos entre la confusión y un reencuentro',
        steps: [
          {
            title: 'Crea un perfil',
            body: 'Tú, un familiar o un cuidador autorizado registra la información esencial: cómo ayudar, a quién llamar y qué conviene saber.',
          },
          {
            title: 'Lleva el código contigo',
            body: 'Un QR o una etiqueta NFC en una pulsera, una tarjeta o un llavero. El código no contiene datos personales, solo un enlace seguro.',
          },
          {
            title: 'Alguien puede ayudar',
            body: 'Quien encuentra a la persona escanea el código, ve solo lo que autorizaste y contacta a la familia en segundos.',
          },
        ],
      },
      audiences: {
        eyebrow: 'Para quién es',
        title: 'Pensado para las personas que cuidamos',
        items: [
          {
            title: 'Personas mayores',
            body: 'Más independencia para salir a caminar, con la tranquilidad de que alguien sabrá cómo ayudar.',
          },
          {
            title: 'Alzheimer y demencia',
            body: 'Instrucciones claras y contactos inmediatos cuando la memoria o la orientación fallan.',
          },
          {
            title: 'Niñas y niños',
            body: 'Perfiles creados y gestionados solo por madres, padres o tutores legales.',
          },
          {
            title: 'Discapacidad y comunicación',
            body: 'Explica cómo comunicarte con la persona y qué necesita, incluso si no puede decirlo.',
          },
        ],
      },
      privacy: {
        eyebrow: 'Privacidad desde el diseño',
        title: 'Lo que se muestra, lo decides tú',
        body: 'Una identificación de emergencia no debería convertirse en un riesgo. Por eso VIRELUMA separa con claridad la información pública de emergencia de la información privada.',
        points: [
          {
            title: 'El QR no contiene datos personales',
            body: 'Solo un identificador aleatorio e imposible de adivinar.',
          },
          {
            title: 'Visibilidad por niveles',
            body: 'Cada dato es público en emergencias, protegido o privado, según tu elección.',
          },
          {
            title: 'Fuera de los buscadores',
            body: 'Los perfiles personales nunca se indexan ni aparecen en Google.',
          },
          {
            title: 'Revocable en cualquier momento',
            body: 'Si pierdes una pulsera, puedes desactivar su código y emitir uno nuevo.',
          },
        ],
      },
      compatibility: {
        eyebrow: 'Compatibilidad',
        title: 'Un mismo enlace, muchos formatos',
        body: 'El código permanente funciona en cualquier soporte. Cambia la pulsera o el diseño cuando quieras: el enlace sigue siendo el mismo.',
        items: ['Pulseras con QR', 'Pulseras y tarjetas NFC', 'Stickers NFC', 'Tarjetas impresas'],
        note: 'La compatibilidad de cada accesorio se publicará solo después de probarlo.',
      },
      faq: {
        eyebrow: 'Preguntas frecuentes',
        title: 'Lo que más nos preguntan',
      },
      final: {
        title: 'Construyamos juntos una red que ayuda a encontrar.',
        body: 'VIRELUMA se desarrolla de forma abierta. Sigue el proyecto y conoce cada avance.',
      },
    },
    howItWorks: {
      title: 'Cómo funciona VIRELUMA — Identificación de emergencia con QR y NFC',
      description:
        'Cómo se crea un perfil de emergencia, qué ve quien escanea el código y por qué el enlace permanente sigue funcionando aunque cambies los datos.',
      eyebrow: 'Cómo funciona',
      h1: 'De un código en la muñeca a una llamada a la familia',
      intro:
        'VIRELUMA conecta un identificador permanente con un perfil de emergencia que tú controlas. Así funciona cada parte.',
      steps: [
        {
          title: '1. Crear el perfil',
          body: 'Una cuenta puede gestionar varias personas: tus padres, tus hijos o las personas que cuidas. Solo pedimos la información necesaria para ayudar en una emergencia.',
        },
        {
          title: '2. Elegir qué es visible',
          body: 'Cada dato tiene un nivel: visible en emergencias, protegido o privado. Lo privado solo lo ven los miembros autorizados de la familia.',
        },
        {
          title: '3. Obtener el código',
          body: 'Generamos un QR permanente que puedes descargar, imprimir o grabar en una etiqueta NFC. Puedes cambiar su diseño sin cambiar su destino.',
        },
        {
          title: '4. Recibir ayuda',
          body: 'Quien escanea el código abre una página simple, en su idioma, con instrucciones claras y botones para llamar a los contactos de emergencia.',
        },
      ],
      helperSees: {
        title: 'Lo que ve quien ayuda',
        items: [
          'El nombre con el que la persona prefiere que le llamen',
          'Un mensaje breve y las instrucciones para ayudar',
          'Alertas que autorizaste mostrar, como alergias importantes',
          'Botones para llamar a los contactos de emergencia',
        ],
      },
      neverShown: {
        title: 'Lo que nunca se muestra automáticamente',
        items: [
          'La dirección del domicilio',
          'La ubicación en tiempo real',
          'Documentos de identidad',
          'Información marcada como privada',
        ],
      },
      permanent: {
        title: 'Un enlace que no caduca',
        body: 'El código contiene únicamente un enlace con un identificador aleatorio. Puedes editar el perfil, cambiar el diseño del QR o sustituir la pulsera: los códigos ya impresos siguen funcionando. Si un código se pierde, puedes revocarlo y emitir uno nuevo.',
      },
    },
    useCases: {
      title: 'Casos de uso — Familias, cuidadores y personas que necesitan apoyo',
      description:
        'Cómo VIRELUMA ayuda a familias, cuidadores, personas mayores, niños y personas con discapacidad a ser encontradas y asistidas.',
      eyebrow: 'Casos de uso',
      h1: 'Cada familia cuida de forma distinta',
      intro: 'VIRELUMA se adapta a quien necesita apoyo y a quienes le acompañan.',
      cases: [
        {
          title: 'Una hija que cuida a su madre y a su abuelo',
          body: 'Gestiona dos perfiles desde una sola cuenta e invita a su hermano para compartir el cuidado. Cada persona tiene su propio código.',
        },
        {
          title: 'Una persona con Alzheimer que sale a caminar',
          body: 'Lleva una pulsera con QR y NFC. Si se desorienta, cualquier persona puede saber cómo tranquilizarla y a quién llamar.',
        },
        {
          title: 'Un cuidador profesional',
          body: 'Accede solo a los perfiles que la familia le autorizó, con permisos que pueden retirarse en cualquier momento.',
        },
        {
          title: 'Una niña en una excursión escolar',
          body: 'Su madre o tutor legal crea el perfil y decide qué se muestra. Nunca se muestra su dirección ni su ubicación.',
        },
        {
          title: 'Una persona con dificultades para comunicarse',
          body: 'El perfil explica cómo comunicarse con ella, qué le ayuda y qué conviene evitar.',
        },
        {
          title: 'Un adulto independiente',
          body: 'Crea su propio perfil con alergias críticas y contactos, por si alguna vez no puede hablar por sí mismo.',
        },
      ],
    },
    qrNfc: {
      title: 'QR, NFC y accesorios — Compatibilidad de VIRELUMA',
      description:
        'Cómo funcionan los códigos QR y las etiquetas NFC de VIRELUMA, qué teléfonos pueden leerlos y qué relación tiene con Apple AirTag.',
      eyebrow: 'QR y NFC',
      h1: 'Un enlace permanente en el accesorio que prefieras',
      intro:
        'Todos los formatos apuntan al mismo enlace seguro. Ninguno guarda información personal en el propio accesorio.',
      qr: {
        title: 'Códigos QR',
        body: 'Funcionan con la cámara de casi cualquier teléfono inteligente, sin aplicaciones. Puedes descargarlos en alta resolución para imprimirlos en pulseras, tarjetas o etiquetas.',
      },
      nfc: {
        title: 'Etiquetas NFC',
        body: 'Basta con acercar el teléfono. Los iPhone desde el modelo XS leen etiquetas NFC sin abrir ninguna aplicación; en Android, el NFC debe estar activado. La etiqueta solo almacena el enlace.',
      },
      printed: {
        title: 'Tarjetas impresas',
        body: 'Una tarjeta para la billetera con el código QR y un identificador corto que también puede escribirse a mano.',
      },
      airtag: {
        title: '¿Y Apple AirTag?',
        body: 'AirTag es un localizador de objetos de Apple. Su ubicación solo la ve su propietario en la app Buscar de Apple, y Apple lo diseñó para objetos, no para personas. VIRELUMA no puede leer la ubicación de un AirTag ni controlarlo. Puedes usarlo como complemento: en modo perdido, quien lo acerque a un teléfono con NFC verá el mensaje que configures.',
      },
      testing: {
        title: 'Compatibilidad verificada',
        body: 'Publicaremos la lista de accesorios y teléfonos compatibles solo después de probarlos. No prometemos compatibilidad universal.',
      },
    },
    security: {
      title: 'Seguridad y privacidad — Cómo protege VIRELUMA tus datos',
      description:
        'Principios de seguridad y privacidad de VIRELUMA: minimización de datos, niveles de visibilidad, identificadores no adivinables y control total de la familia.',
      eyebrow: 'Seguridad y privacidad',
      h1: 'Diseñado para proteger, no para exponer',
      intro:
        'Un perfil de emergencia contiene información sensible. Estos son los compromisos que guían cada decisión técnica.',
      principles: [
        {
          title: 'Solo lo necesario',
          body: 'Pedimos la información mínima para ayudar en una emergencia. Los datos de salud son opcionales y requieren consentimiento explícito.',
        },
        {
          title: 'Identificadores imposibles de adivinar',
          body: 'Cada código usa un identificador aleatorio de 130 bits, sin relación con nombres, correos o teléfonos. No se pueden recorrer perfiles en secuencia.',
        },
        {
          title: 'Permisos verificados en el servidor',
          body: 'Quién puede ver o editar cada perfil se comprueba en la base de datos, no solo en la interfaz.',
        },
        {
          title: 'Nada de buscadores',
          body: 'Los perfiles personales llevan la indicación de no indexar y nunca aparecen en mapas del sitio.',
        },
        {
          title: 'Tus derechos',
          body: 'Podrás consultar, corregir, exportar y eliminar tus datos, y retirar permisos a cualquier miembro de la familia.',
        },
        {
          title: 'Menores de edad',
          body: 'Solo madres, padres o tutores legales pueden crear y gestionar el perfil de un menor.',
        },
      ],
      legal: {
        title: 'Marco legal',
        body: 'Empezamos en Colombia, bajo la Ley 1581 de 2012 de protección de datos personales, y diseñamos para cumplir normas como el RGPD europeo y la LGPD brasileña. Las políticas formales se publicarán después de una revisión jurídica cualificada; no afirmamos cumplimiento antes de obtenerla.',
      },
      report: {
        title: 'Reportar una vulnerabilidad',
        body: 'Si encuentras un problema de seguridad, repórtalo de forma privada siguiendo nuestra política de seguridad.',
      },
    },
    faq: {
      title: 'Preguntas frecuentes — VIRELUMA',
      description:
        'Respuestas sobre los perfiles de emergencia de VIRELUMA: privacidad, códigos QR, NFC, menores de edad y disponibilidad.',
      eyebrow: 'Preguntas frecuentes',
      h1: 'Preguntas frecuentes',
      intro: '¿No encuentras tu respuesta? Escríbenos a través del repositorio del proyecto.',
      items: [
        {
          q: '¿Quien escanea el código necesita instalar una aplicación?',
          a: 'No. El código abre una página web en el navegador del teléfono. No hace falta registrarse ni instalar nada.',
        },
        {
          q: '¿Qué información ve quien escanea el código?',
          a: 'Solo la que marcaste como visible en emergencias: por ejemplo, el nombre preferido, un mensaje, instrucciones para ayudar y botones para llamar a tus contactos.',
        },
        {
          q: '¿El código QR deja de funcionar si edito el perfil?',
          a: 'No. El código contiene un enlace permanente. Puedes cambiar los datos, el diseño del QR o la pulsera y los códigos ya impresos siguen funcionando.',
        },
        {
          q: '¿Qué pasa si pierdo la pulsera?',
          a: 'Podrás revocar ese código desde tu cuenta y generar uno nuevo para la misma persona.',
        },
        {
          q: '¿VIRELUMA muestra la ubicación de la persona?',
          a: 'No. VIRELUMA no muestra la ubicación en tiempo real ni la dirección del domicilio. Cualquier función futura de ubicación será opcional, explícita y revocable.',
        },
        {
          q: '¿Puedo crear un perfil para mi hijo o hija?',
          a: 'Sí, si eres su madre, padre o tutor legal. Los perfiles de menores tienen protecciones adicionales.',
        },
        {
          q: '¿VIRELUMA reemplaza a los servicios de emergencia?',
          a: 'No. VIRELUMA ayuda a identificar a una persona y contactar a su familia. En una emergencia, llama siempre al número de emergencias local.',
        },
        {
          q: '¿Funciona con Apple AirTag?',
          a: 'AirTag puede usarse como complemento, pero VIRELUMA no puede leer su ubicación ni controlarlo. Lo explicamos en la página de QR y NFC.',
        },
        {
          q: '¿Ya puedo crear un perfil?',
          a: 'Todavía no. VIRELUMA está en desarrollo y publicamos el avance de forma abierta en GitHub.',
        },
      ],
    },
  },
  app: {
    signIn: 'Iniciar sesión',
    loading: 'Cargando…',
    notConfigured: 'Las cuentas todavía no están disponibles en esta versión de VIRELUMA.',
    fields: {
      email: 'Correo electrónico',
      password: 'Contraseña',
      newPassword: 'Nueva contraseña',
      passwordHint: 'Mínimo 12 caracteres. Una frase larga es más segura y fácil de recordar.',
      showPassword: 'Mostrar contraseña',
    },
    login: {
      title: 'Inicia sesión',
      lead: 'Gestiona los perfiles de las personas que cuidas.',
      submit: 'Iniciar sesión',
      forgot: '¿Olvidaste tu contraseña?',
      noAccount: '¿No tienes una cuenta?',
      register: 'Crear una cuenta',
    },
    register: {
      title: 'Crea tu cuenta',
      lead: 'Con una cuenta podrás crear y gestionar perfiles de emergencia.',
      submit: 'Crear cuenta',
      haveAccount: '¿Ya tienes una cuenta?',
      privacy:
        'Usaremos tu correo solo para tu cuenta y avisos de seguridad. Nunca lo mostraremos en un perfil de emergencia.',
    },
    checkEmail: {
      title: 'Revisa tu correo',
      body: 'Si la dirección es válida, te enviamos un enlace para confirmar tu cuenta. Puede tardar unos minutos; revisa también la carpeta de correo no deseado.',
    },
    forgot: {
      title: 'Recupera tu contraseña',
      lead: 'Te enviaremos un enlace para crear una nueva contraseña.',
      submit: 'Enviar enlace',
      sent: 'Si existe una cuenta con ese correo, recibirás un enlace en unos minutos.',
    },
    reset: {
      title: 'Crea una nueva contraseña',
      submit: 'Guardar contraseña',
      done: 'Tu contraseña se actualizó.',
    },
    callback: {
      working: 'Confirmando el enlace…',
      failed:
        'No pudimos completar el enlace. Puede haber expirado o haberse abierto en otro dispositivo. Si confirmabas tu correo, ya puedes iniciar sesión.',
    },
    account: {
      title: 'Tu cuenta',
      signedInAs: 'Sesión iniciada como',
      peopleTitle: 'Personas',
      peopleBody: 'La creación de perfiles de emergencia llegará en la próxima versión.',
      signOut: 'Cerrar sesión',
      signOutEverywhere: 'Cerrar sesión en todos los dispositivos',
      deleteTitle: 'Eliminar tu cuenta',
      deleteBody:
        'Puedes solicitar la eliminación de tu cuenta y de los datos asociados. Antes te ayudaremos a transferir los perfiles que gestionas.',
      deleteButton: 'Solicitar eliminación',
      deleteConfirmTitle: '¿Solicitar la eliminación de tu cuenta?',
      deleteConfirmBody: 'Registraremos tu solicitud y te contactaremos para completarla.',
      deleteRequested: 'Recibimos tu solicitud de eliminación.',
      cancel: 'Cancelar',
    },
    errors: {
      not_configured: 'Las cuentas todavía no están disponibles en esta versión.',
      invalid_credentials: 'El correo o la contraseña no son correctos.',
      email_not_confirmed: 'Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
      weak_password: 'La contraseña debe tener entre 12 y 72 caracteres.',
      invalid_email: 'Escribe un correo electrónico válido.',
      rate_limited: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
      link_invalid: 'El enlace no es válido o expiró. Solicita uno nuevo.',
      network: 'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
      unknown: 'Algo salió mal. Inténtalo de nuevo.',
    },
  },
  notFound: {
    title: 'Página no encontrada',
    body: 'La página que buscas no existe o cambió de dirección.',
  },
  languageChooser: {
    title: 'VIRELUMA — Elige tu idioma',
    description: 'Identificación personal de emergencia con QR y NFC.',
    heading: 'Elige tu idioma',
  },
};
