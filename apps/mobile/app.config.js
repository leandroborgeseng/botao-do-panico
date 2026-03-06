// Carrega .env para EXPO_PUBLIC_* (Expo já carrega; aqui garantimos extra.apiUrl no app)
const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
const disguiseIcon = process.env.EXPO_PUBLIC_DISGUISE_ICON === '1';

module.exports = {
  expo: {
    name: 'Botão do Pânico',
    slug: 'botao-do-panico',
    version: '1.0.0',
    orientation: 'portrait',
    // Troca de ícone só é viável via build (não muda em runtime no Expo Go).
    // Para usar: coloque um arquivo ./assets/icon-disguised.png e rode com EXPO_PUBLIC_DISGUISE_ICON=1
    icon: disguiseIcon ? './assets/icon-disguised.png' : './assets/icon.png',
    // Segue a recomendação de estilo automático (claro/escuro conforme o sistema)
    userInterfaceStyle: 'automatic',
    // Mantemos a imagem existente e ajustamos o fundo para branco conforme especificação
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      // Identificador seguindo o padrão desejado
      bundleIdentifier: 'br.gov.sp.franca.botaodopanico',
      // Build number iOS
      buildNumber: '1.0.0',
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          'O app precisa da sua localização para enviar em caso de emergência ao acionar o botão de pânico.',
        NSMicrophoneUsageDescription:
          'O app grava áudio por 30 segundos ao acionar o pânico para enviar como evidência.',
        UIBackgroundModes: ['audio'],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      // Package Android conforme especificação
      package: 'br.gov.sp.franca.botaodopanico',
      versionCode: 1,
      permissions: ['ACCESS_FINE_LOCATION', 'RECORD_AUDIO', 'POST_NOTIFICATIONS'],
    },
    plugins: [
      'expo-router',
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'O app precisa da sua localização para enviar em caso de emergência.',
        },
      ],
      [
        'expo-av',
        {
          microphonePermission:
            'O app grava áudio por 30 segundos ao acionar o pânico.',
        },
      ],
      ['expo-notifications', { color: '#7c3aed' }],
    ],
    // Esquema para deep link conforme especificação
    scheme: 'botaodopanico',
    extra: {
      apiUrl,
      eas: {
        // Já configurado ao vincular o projeto ao EAS
        projectId: 'c521579c-606b-4c25-a17c-e8ec43e8ff03',
      },
    },
    // Dono do projeto no Expo
    owner: 'leandroborgesbr',
  },
};
