# Publicar o app "Botão do Pânico" na App Store e na Play Store

Este guia resume o que você precisa para publicar o aplicativo mobile nas lojas da **Apple** e da **Google**, usando **Expo (EAS Build)**.

---

## Visão geral

| Item | Apple App Store | Google Play Store |
|------|-----------------|-------------------|
| **Conta de desenvolvedor** | Apple Developer Program (pago, anual) | Google Play Console (taxa única) |
| **Build** | EAS Build (iOS) | EAS Build (Android) |
| **Envio** | EAS Submit ou App Store Connect | EAS Submit ou Play Console |
| **Revisão** | Sim (manual, alguns dias) | Sim (geralmente mais rápido / automático) |

---

## 1. Pré-requisitos gerais (para as duas lojas)

### 1.1 Backend em produção
- A API do backend precisa estar **no ar** e acessível por HTTPS.
- No `eas.json` e no app, use a URL de produção em `EXPO_PUBLIC_API_URL` (ex.: `https://api.seudominio.gov.br`).

### 1.2 Conta Expo (EAS)
- Crie uma conta em [expo.dev](https://expo.dev) e faça login no CLI:
  ```bash
  cd apps/mobile && npx eas login
  ```
- Vincule o projeto ao EAS (se ainda não fez):
  ```bash
  npx eas init
  ```
- No `app.config.js`, em `extra.eas`, defina o `projectId` do projeto EAS (aparece após o `eas init` ou no dashboard do Expo).

### 1.3 Assets do app
- **Ícone**: `apps/mobile/assets/icon.png` (1024x1024 para iOS).
- **Ícone adaptativo Android**: `apps/mobile/assets/adaptive-icon.png`.
- **Splash**: `apps/mobile/assets/splash-icon.png`.
- **Screenshots** para as lojas (vários tamanhos por plataforma – veja abaixo).

### 1.4 Política de privacidade
- Ambas as lojas exigem uma **URL pública** de política de privacidade.
- A página deve explicar quais dados o app coleta (localização, áudio, dados de cadastro, etc.) e como são usados.

### 1.5 Textos da loja
- Nome do app (ex.: “Botão do Pânico”).
- Descrição curta e longa.
- Palavras-chave (Apple) / descrição breve (Google).
- Categoria (ex.: “Segurança”, “Utilitários” ou equivalente).

---

## 2. Apple App Store

### 2.1 Apple Developer Program
- Acesse [developer.apple.com/programs](https://developer.apple.com/programs/).
- Cadastre-se no **Apple Developer Program** (taxa anual, em dólar).
- É obrigatório para publicar na App Store.

### 2.2 Certificados e provisioning (EAS)
- O **EAS Build** pode gerar certificados e perfis de provisionamento para você.
- Na primeira vez que você fizer um build iOS com EAS, ele pode pedir que você crie um “Apple Distribution” certificate e um provisioning profile no Apple Developer (ou usar o gerenciamento automático do EAS).

### 2.3 App Store Connect
- Acesse [appstoreconnect.apple.com](https://appstoreconnect.apple.com).
- Crie um **novo app** (bundle ID: `com.botaodopanico.app`, já configurado no seu `app.config.js`).
- Preencha:
  - Nome, subtítulo, descrição, palavras-chave, URL de suporte, URL da política de privacidade.
  - Categoria, classificação etária, preço (gratuito ou pago).
- Adicione **screenshots** (tamanhos exigidos por dispositivo: iPhone 6.7", 6.5", 5.5" etc. – o App Store Connect mostra os tamanhos exatos).

### 2.4 Build e envio com EAS
```bash
cd apps/mobile

# Build de produção para iOS
npx eas build --platform ios --profile production

# Após o build, enviar para a App Store Connect
npx eas submit --platform ios --profile production --latest
```
- Na primeira vez, o EAS pode pedir **Apple ID** e **App-specific password** (gerado em appleid.apple.com).
- Em “Submit”, associe o build ao app correto no App Store Connect e envie para revisão.

### 2.5 Revisão da Apple
- A Apple revisa o app (geralmente 24–48 h ou mais).
- Mantenha a **política de privacidade** e as **permissões** (localização, microfone) alinhadas ao que o app realmente faz; isso reduz risco de rejeição.

---

## 3. Google Play Store

### 3.1 Conta Google Play Console
- Acesse [play.google.com/console](https://play.google.com/console).
- Crie uma **conta de desenvolvedor** (taxa única, em dólar).
- Aceite os termos e preencha dados de perfil (nome, site, e-mail de contato).

### 3.2 Chave de assinatura (EAS)
- O EAS pode gerar e gerenciar a **upload key** do Android.
- Na primeira build Android com EAS, ele pode criar uma keystore para você (guarde o backup se fizer download).

### 3.3 Criar o app na Play Console
- Em “Todos os apps” → “Criar app”.
- Nome do app, idioma padrão, tipo (app ou jogo), categoria.
- **Package name**: `com.botaodopanico.app` (já no seu `app.config.js`).

### 3.4 Conteúdo da loja
- **Ficha do app**: título, descrição curta (80 caracteres), descrição completa.
- **Política de privacidade**: URL obrigatória.
- **Classificação de conteúdo**: questionário no próprio Console.
- **Screenshots**: pelo menos 2 por tipo de dispositivo (telefone, 7" tablet, 10" tablet – dependendo do que você declarar).

### 3.5 Build e envio com EAS
```bash
cd apps/mobile

# Build de produção para Android
npx eas build --platform android --profile production

# Enviar para a Play Console (track interno, alpha, beta ou production)
npx eas submit --platform android --profile production --latest
```
- Na primeira vez, o EAS pede um **service account** (JSON) da Google Play (com permissão para fazer upload) ou que você faça o upload manual do AAB pela Play Console.

### 3.6 Publicação
- Escolha o **track** (interno, fechado, aberto, produção).
- Preencha todas as seções obrigatórias (política, classificação, preço, etc.).
- Envie para revisão; a Google costuma publicar em poucas horas ou dias.

---

## 4. Checklist rápido

### Antes de gerar os builds
- [ ] Backend em produção com HTTPS.
- [ ] `EXPO_PUBLIC_API_URL` apontando para a API de produção no profile `production` do `eas.json`.
- [ ] `app.config.js`: `version` e `ios.buildNumber` / `android.versionCode` atualizados (EAS pode incrementar; ver documentação).
- [ ] `extra.eas.projectId` definido no `app.config.js` (para notificações push em produção).
- [ ] Ícone e splash adequados; teste em dispositivo real.

### Apple
- [ ] Conta Apple Developer Program ativa.
- [ ] App criado no App Store Connect com bundle ID `com.botaodopanico.app`.
- [ ] URL de política de privacidade.
- [ ] Screenshots e textos preenchidos.
- [ ] Build iOS com `eas build --platform ios --profile production`.
- [ ] Envio com `eas submit` ou upload manual do IPA.

### Google
- [ ] Conta Google Play Console (taxa paga).
- [ ] App criado com package `com.botaodopanico.app`.
- [ ] URL de política de privacidade.
- [ ] Classificação de conteúdo e ficha da loja.
- [ ] Screenshots.
- [ ] Build Android com `eas build --platform android --profile production`.
- [ ] Envio do AAB com `eas submit` ou upload manual na Play Console.

---

## 5. Links úteis

- [Expo: Submit to App Store](https://docs.expo.dev/submit/ios/)
- [Expo: Submit to Google Play](https://docs.expo.dev/submit/android/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Apple App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)
- [Expo: Configuração (app.config.js)](https://docs.expo.dev/versions/latest/config/app/)

---

## 6. Custos (referência)

| Item | Valor aproximado |
|------|-------------------|
| **Apple Developer Program** | ~ US$ 99/ano |
| **Google Play Console** | ~ US$ 25 (taxa única) |
| **Expo EAS** | Plano gratuito com cota de builds; planos pagos para mais builds e fila prioritária |

Com isso você tem o necessário para colocar o **Botão do Pânico** na App Store e na Play Store usando o fluxo EAS já configurado no projeto.
