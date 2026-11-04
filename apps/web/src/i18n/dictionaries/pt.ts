import type { Dictionary } from '../types.ts';

export const pt: Dictionary = {
  meta: {
    siteName: 'VIRELUMA',
    tagline: 'Toda vida merece ser encontrada.',
    languageName: 'Português',
    ogLocale: 'pt_BR',
  },
  a11y: {
    skipToContent: 'Pular para o conteúdo',
    primaryNav: 'Navegação principal',
    footerNav: 'Navegação do rodapé',
    breadcrumbs: 'Trilha de navegação',
    homeLink: 'VIRELUMA, ir para a página inicial',
    opensInNewTab: '(abre em uma nova aba)',
  },
  nav: {
    howItWorks: 'Como funciona',
    useCases: 'Casos de uso',
    qrNfc: 'QR e NFC',
    security: 'Segurança e privacidade',
    faq: 'Perguntas frequentes',
    menu: 'Menu',
    language: 'Idioma',
    theme: 'Tema',
    themeLight: 'Claro',
    themeDark: 'Escuro',
    themeSystem: 'Sistema',
  },
  status: {
    label: 'Em desenvolvimento',
    message:
      'O VIRELUMA está em construção. Ainda não é possível criar perfis; compartilhamos o progresso de forma aberta.',
  },
  cta: {
    howItWorks: 'Ver como funciona',
    followProject: 'Acompanhar o projeto',
    readFaq: 'Ler as perguntas frequentes',
    learnMore: 'Saiba mais',
    backHome: 'Voltar ao início',
  },
  footer: {
    description:
      'Identificação pessoal de emergência com códigos QR permanentes, acessórios NFC e contatos de confiança.',
    disclaimer:
      'O VIRELUMA não substitui os serviços de emergência, os profissionais de saúde nem as autoridades. Em uma emergência, ligue para o número de emergência local.',
    product: 'Produto',
    project: 'Projeto',
    sourceCode: 'Código-fonte',
    security: 'Relatar uma vulnerabilidade',
    legalPending: 'Os documentos jurídicos formais aguardam revisão jurídica qualificada.',
    version: 'Versão',
  },
  sample: {
    badge: 'Exemplo ilustrativo',
    scanned: 'Perfil de emergência',
    name: 'Elena',
    message:
      'Vivo com Alzheimer e às vezes fico desorientada. Por favor, fique comigo e ligue para minha família.',
    needsTitle: 'Como me ajudar',
    needs: ['Fale comigo devagar e com calma', 'Uso aparelho auditivo no ouvido direito'],
    contactsTitle: 'Contatos de emergência',
    contactRelation: 'Filha',
    contactName: 'María',
    call: 'Ligar',
    emergency: 'Emergência local',
    wristband: 'Pulseira com QR e NFC',
    scanHint: 'Escaneie este código para ver como o VIRELUMA funciona',
  },
  pages: {
    home: {
      title: 'VIRELUMA — Toda vida merece ser encontrada',
      description:
        'Identificação de emergência com QR e NFC para pessoas idosas, pessoas com demência, crianças e pessoas com deficiência. Você decide o que é exibido.',
      hero: {
        eyebrow: 'Identificação de emergência · QR · NFC',
        title: 'Toda vida merece ser encontrada.',
        lead: 'Uma identidade digital permanente que conecta quem precisa de ajuda às pessoas que mais a amam. Qualquer pessoa pode escaneá-la com o celular, sem instalar nada.',
        points: [
          'Sem aplicativo nem cadastro para quem ajuda',
          'Você decide quais informações ficam visíveis',
          'O mesmo código continua funcionando quando os dados mudam',
        ],
      },
      how: {
        eyebrow: 'Como funciona',
        title: 'Três passos entre a confusão e o reencontro',
        steps: [
          {
            title: 'Crie um perfil',
            body: 'Você, um familiar ou um cuidador autorizado registra o essencial: como ajudar, para quem ligar e o que é útil saber.',
          },
          {
            title: 'Leve o código com você',
            body: 'Um QR ou uma etiqueta NFC em uma pulseira, um cartão ou um chaveiro. O código não contém dados pessoais, apenas um link seguro.',
          },
          {
            title: 'Alguém pode ajudar',
            body: 'Quem encontra a pessoa escaneia o código, vê apenas o que você autorizou e fala com a família em segundos.',
          },
        ],
      },
      audiences: {
        eyebrow: 'Para quem é',
        title: 'Pensado para as pessoas de quem cuidamos',
        items: [
          {
            title: 'Pessoas idosas',
            body: 'Mais independência para sair para caminhar, com a tranquilidade de que alguém saberá como ajudar.',
          },
          {
            title: 'Alzheimer e demência',
            body: 'Instruções claras e contatos imediatos quando a memória ou a orientação falham.',
          },
          {
            title: 'Crianças',
            body: 'Perfis criados e gerenciados apenas por mães, pais ou responsáveis legais.',
          },
          {
            title: 'Deficiência e comunicação',
            body: 'Explique como se comunicar com a pessoa e do que ela precisa, mesmo que ela não consiga dizer.',
          },
        ],
      },
      privacy: {
        eyebrow: 'Privacidade desde a concepção',
        title: 'O que aparece, quem decide é você',
        body: 'Uma identificação de emergência nunca deveria se tornar um risco. Por isso o VIRELUMA separa com clareza as informações públicas de emergência das informações privadas.',
        points: [
          {
            title: 'O QR não contém dados pessoais',
            body: 'Apenas um identificador aleatório impossível de adivinhar.',
          },
          {
            title: 'Visibilidade em níveis',
            body: 'Cada dado é público em emergências, protegido ou privado, como você escolher.',
          },
          {
            title: 'Fora dos buscadores',
            body: 'Os perfis pessoais nunca são indexados nem aparecem no Google.',
          },
          {
            title: 'Revogável a qualquer momento',
            body: 'Perdeu uma pulseira? Desative o código dela e emita um novo.',
          },
        ],
      },
      compatibility: {
        eyebrow: 'Compatibilidade',
        title: 'Um mesmo link, muitos formatos',
        body: 'O código permanente funciona em qualquer suporte. Troque a pulseira ou o design quando quiser: o link continua o mesmo.',
        items: ['Pulseiras com QR', 'Pulseiras e cartões NFC', 'Adesivos NFC', 'Cartões impressos'],
        note: 'Só publicaremos um acessório como compatível depois de testá-lo.',
      },
      faq: {
        eyebrow: 'Perguntas frequentes',
        title: 'O que mais nos perguntam',
      },
      final: {
        title: 'Vamos construir juntos uma rede que ajuda a encontrar.',
        body: 'O VIRELUMA é desenvolvido de forma aberta. Acompanhe o projeto e cada avanço.',
      },
    },
    howItWorks: {
      title: 'Como o VIRELUMA funciona — Identificação de emergência com QR e NFC',
      description:
        'Como um perfil de emergência é criado, o que vê quem escaneia o código e por que o link permanente continua funcionando quando os dados mudam.',
      eyebrow: 'Como funciona',
      h1: 'De um código no pulso a uma ligação para a família',
      intro:
        'O VIRELUMA liga um identificador permanente a um perfil de emergência que você controla. Veja como cada parte funciona.',
      steps: [
        {
          title: '1. Criar o perfil',
          body: 'Uma conta pode gerenciar várias pessoas: seus pais, seus filhos ou as pessoas de quem você cuida. Pedimos apenas o necessário para ajudar em uma emergência.',
        },
        {
          title: '2. Escolher o que é visível',
          body: 'Cada dado tem um nível: visível em emergências, protegido ou privado. O que é privado só é visto pelos membros autorizados da família.',
        },
        {
          title: '3. Obter o código',
          body: 'Geramos um QR permanente que você pode baixar, imprimir ou gravar em uma etiqueta NFC. Você pode mudar o design sem mudar o destino.',
        },
        {
          title: '4. Receber ajuda',
          body: 'Quem escaneia o código abre uma página simples, no seu idioma, com instruções claras e botões para ligar para os contatos de emergência.',
        },
      ],
      helperSees: {
        title: 'O que vê quem ajuda',
        items: [
          'O nome pelo qual a pessoa prefere ser chamada',
          'Uma mensagem curta e instruções para ajudar',
          'Alertas que você autorizou exibir, como alergias graves',
          'Botões para ligar para os contatos de emergência',
        ],
      },
      neverShown: {
        title: 'O que nunca é exibido automaticamente',
        items: [
          'O endereço residencial',
          'A localização em tempo real',
          'Documentos de identidade',
          'Informações marcadas como privadas',
        ],
      },
      permanent: {
        title: 'Um link que não expira',
        body: 'O código contém apenas um link com um identificador aleatório. Você pode editar o perfil, mudar o design do QR ou trocar a pulseira: os códigos já impressos continuam funcionando. Se um código se perder, você pode revogá-lo e emitir um novo.',
      },
    },
    useCases: {
      title: 'Casos de uso — Famílias, cuidadores e pessoas que precisam de apoio',
      description:
        'Como o VIRELUMA ajuda famílias, cuidadores, pessoas idosas, crianças e pessoas com deficiência a serem encontradas e assistidas.',
      eyebrow: 'Casos de uso',
      h1: 'Cada família cuida do seu jeito',
      intro: 'O VIRELUMA se adapta a quem precisa de apoio e a quem está ao seu lado.',
      cases: [
        {
          title: 'Uma filha que cuida da mãe e do avô',
          body: 'Ela gerencia dois perfis em uma única conta e convida o irmão para dividir o cuidado. Cada pessoa tem seu próprio código.',
        },
        {
          title: 'Uma pessoa com Alzheimer que gosta de caminhar',
          body: 'Ela usa uma pulseira com QR e NFC. Se ficar desorientada, qualquer pessoa pode saber como acalmá-la e para quem ligar.',
        },
        {
          title: 'Um cuidador profissional',
          body: 'Acessa apenas os perfis que a família autorizou, com permissões que podem ser retiradas a qualquer momento.',
        },
        {
          title: 'Uma menina em uma excursão escolar',
          body: 'A mãe ou o responsável legal cria o perfil e decide o que aparece. O endereço e a localização dela nunca são exibidos.',
        },
        {
          title: 'Uma pessoa com dificuldade de comunicação',
          body: 'O perfil explica como se comunicar com ela, o que ajuda e o que deve ser evitado.',
        },
        {
          title: 'Um adulto independente',
          body: 'Cria seu próprio perfil com alergias graves e contatos, caso um dia não consiga falar por si mesmo.',
        },
      ],
    },
    qrNfc: {
      title: 'QR, NFC e acessórios — Compatibilidade do VIRELUMA',
      description:
        'Como funcionam os códigos QR e as etiquetas NFC do VIRELUMA, quais celulares conseguem lê-los e qual é a relação com o Apple AirTag.',
      eyebrow: 'QR e NFC',
      h1: 'Um link permanente no acessório que você preferir',
      intro:
        'Todos os formatos apontam para o mesmo link seguro. Nenhum deles guarda informações pessoais no próprio acessório.',
      qr: {
        title: 'Códigos QR',
        body: 'Funcionam com a câmera de quase qualquer smartphone, sem aplicativos. Baixe-os em alta resolução para imprimir em pulseiras, cartões ou etiquetas.',
      },
      nfc: {
        title: 'Etiquetas NFC',
        body: 'Basta aproximar o celular. iPhones a partir do XS leem etiquetas NFC sem abrir nenhum aplicativo; no Android, o NFC precisa estar ativado. A etiqueta armazena apenas o link.',
      },
      printed: {
        title: 'Cartões impressos',
        body: 'Um cartão para a carteira com o código QR e um identificador curto que também pode ser digitado à mão.',
      },
      airtag: {
        title: 'E o Apple AirTag?',
        body: 'O AirTag é um localizador de objetos da Apple. A localização dele só é vista pelo proprietário no app Buscar da Apple, e a Apple o projetou para objetos, não para pessoas. O VIRELUMA não consegue ler a localização de um AirTag nem controlá-lo. Você pode usá-lo como complemento: no modo perdido, quem aproximá-lo de um celular com NFC verá a mensagem que você configurar.',
      },
      testing: {
        title: 'Compatibilidade verificada',
        body: 'Publicaremos a lista de acessórios e celulares compatíveis somente depois de testá-los. Não prometemos compatibilidade universal.',
      },
    },
    security: {
      title: 'Segurança e privacidade — Como o VIRELUMA protege seus dados',
      description:
        'Princípios de segurança e privacidade do VIRELUMA: minimização de dados, níveis de visibilidade, identificadores impossíveis de adivinhar e controle total da família.',
      eyebrow: 'Segurança e privacidade',
      h1: 'Projetado para proteger, não para expor',
      intro:
        'Um perfil de emergência contém informações sensíveis. Estes compromissos orientam cada decisão técnica.',
      principles: [
        {
          title: 'Só o necessário',
          body: 'Pedimos o mínimo de informações para ajudar em uma emergência. Dados de saúde são opcionais e exigem consentimento explícito.',
        },
        {
          title: 'Identificadores impossíveis de adivinhar',
          body: 'Cada código usa um identificador aleatório de 130 bits, sem relação com nomes, e-mails ou telefones. Não é possível percorrer perfis em sequência.',
        },
        {
          title: 'Permissões verificadas no servidor',
          body: 'Quem pode ver ou editar cada perfil é verificado no banco de dados, não apenas na interface.',
        },
        {
          title: 'Nada de buscadores',
          body: 'Os perfis pessoais têm a diretiva de não indexação e nunca aparecem em mapas do site.',
        },
        {
          title: 'Seus direitos',
          body: 'Você poderá consultar, corrigir, exportar e excluir seus dados, além de retirar permissões de qualquer membro da família.',
        },
        {
          title: 'Menores de idade',
          body: 'Somente mães, pais ou responsáveis legais podem criar e gerenciar o perfil de um menor.',
        },
      ],
      legal: {
        title: 'Marco legal',
        body: 'Começamos pela Colômbia, sob a Lei 1581 de 2012 de proteção de dados pessoais, e projetamos para atender normas como o RGPD europeu e a LGPD brasileira. As políticas formais serão publicadas após revisão jurídica qualificada; não afirmamos conformidade antes de obtê-la.',
      },
      report: {
        title: 'Relatar uma vulnerabilidade',
        body: 'Se você encontrar um problema de segurança, relate-o de forma privada seguindo nossa política de segurança.',
      },
    },
    faq: {
      title: 'Perguntas frequentes — VIRELUMA',
      description:
        'Respostas sobre os perfis de emergência do VIRELUMA: privacidade, códigos QR, NFC, menores de idade e disponibilidade.',
      eyebrow: 'Perguntas frequentes',
      h1: 'Perguntas frequentes',
      intro: 'Não encontrou sua resposta? Fale conosco pelo repositório do projeto.',
      items: [
        {
          q: 'Quem escaneia o código precisa instalar um aplicativo?',
          a: 'Não. O código abre uma página web no navegador do celular. Não é preciso se cadastrar nem instalar nada.',
        },
        {
          q: 'Que informações vê quem escaneia o código?',
          a: 'Apenas as que você marcou como visíveis em emergências: por exemplo, o nome preferido, uma mensagem, instruções para ajudar e botões para ligar para seus contatos.',
        },
        {
          q: 'O código QR deixa de funcionar se eu editar o perfil?',
          a: 'Não. O código contém um link permanente. Você pode mudar os dados, o design do QR ou a pulseira, e os códigos já impressos continuam funcionando.',
        },
        {
          q: 'E se eu perder a pulseira?',
          a: 'Você poderá revogar esse código na sua conta e gerar um novo para a mesma pessoa.',
        },
        {
          q: 'O VIRELUMA mostra a localização da pessoa?',
          a: 'Não. O VIRELUMA não mostra a localização em tempo real nem o endereço residencial. Qualquer recurso futuro de localização será opcional, explícito e revogável.',
        },
        {
          q: 'Posso criar um perfil para meu filho ou minha filha?',
          a: 'Sim, se você for a mãe, o pai ou o responsável legal. Perfis de menores têm proteções adicionais.',
        },
        {
          q: 'O VIRELUMA substitui os serviços de emergência?',
          a: 'Não. O VIRELUMA ajuda a identificar uma pessoa e a contatar a família dela. Em uma emergência, ligue sempre para o número de emergência local.',
        },
        {
          q: 'Funciona com o Apple AirTag?',
          a: 'O AirTag pode ser usado como complemento, mas o VIRELUMA não consegue ler a localização dele nem controlá-lo. Explicamos isso na página de QR e NFC.',
        },
        {
          q: 'Já posso criar um perfil?',
          a: 'Ainda não. O VIRELUMA está em desenvolvimento e publicamos o progresso abertamente no GitHub.',
        },
      ],
    },
  },
  notFound: {
    title: 'Página não encontrada',
    body: 'A página que você procura não existe ou mudou de endereço.',
  },
  languageChooser: {
    title: 'VIRELUMA — Escolha seu idioma',
    description: 'Identificação pessoal de emergência com QR e NFC.',
    heading: 'Escolha seu idioma',
  },
};
