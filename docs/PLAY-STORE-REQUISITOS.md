# Requisitos do Google Play – Ícone e Políticas do Desenvolvedor

Este documento resume o que é necessário para **evitar rejeição** na Play Store: ícone válido e conformidade com as políticas de desenvolvedor.

---

## 1. Ícone do app (motivo comum de rejeição)

O app foi rejeitado por **não conter um ícone**. Os ícones atuais eram placeholders (1×1 px). É obrigatório ter:

### 1.1 Ícone no pacote do app (launcher / dispositivo)

- **`icon.png`**: usado pelo Expo/iOS e como base. Recomendado **1024×1024 px**, PNG 32-bit, sRGB.
- **`adaptive-icon.png`** (Android): imagem de primeiro plano do ícone adaptativo. Recomendado **1024×1024 px**; o Android usa zona segura ~66% central (evite texto/logo nas bordas).
- **Fundo do ícone adaptativo**: em `app.config.js` já está `backgroundColor: '#ffffff'`; pode trocar para a cor da marca.

**Regras visuais (Google):**

- Quadrado completo (sem cantos arredondados no arquivo – a Play Store aplica máscara).
- Sem sombras no arquivo.
- Sem texto de ranking, ofertas ou programas (“#1”, “Grátis”, “Novo”).
- Preferir fundo opaco (evitar transparência total no ícone da loja).

### 1.2 Ícone da listagem na Play Store (512×512)

Na **Play Console** → seu app → **Presença no Google Play** → **Principais recursos da página da loja**:

- Faça upload de um **ícone de app** **512×512 px**, PNG 32-bit, máx. 1024 KB.
- Pode ser a mesma arte do `icon.png` exportada em 512×512.

Sem esse gráfico, a listagem pode ser rejeitada ou exibir ícone incorreto.

**Como gerar os ícones (a partir do logo do projeto):**

No app mobile há um script que gera `icon.png`, `adaptive-icon.png` e `icon-play-store-512.png`:

```bash
cd apps/mobile && npm run generate-icons
```

O arquivo `icon-play-store-512.png` pode ser enviado na Play Console em **Principais recursos da página da loja** como ícone do app (512×512).

---

## 2. Políticas do programa de desenvolvedores – o que garantir

Com base na [Central de políticas do Google Play](https://support.google.com/googleplay/android-developer/answer/9888170), verifique:

### 2.1 Metadados (título, ícone, nome do desenvolvedor)

- **Título do app**: até **30 caracteres**, sem emojis, sem ALL CAPS (exceto se for marca).
- **Ícone**: não usar símbolos enganosos (ex.: bolinha de “novas mensagens” se o app não for de mensagens; ícone de “download” se não for app de download).
- **Nome do desenvolvedor**: sem emojis, sem caracteres especiais irrelevantes.
- **Descrição**: clara, verdadeira, sem depoimentos anônimos, sem comparações com outros apps, sem blocos de palavras-chave.
- **Nada** no título/ícone/descrição que indique: ranking, preço, ofertas ou participação em programas do Play (ex.: “Escolha do Editor”, “App do Ano”).

### 2.2 Privacidade e dados

- **Política de privacidade**: URL pública obrigatória na listagem (ex.: `https://seu-dominio/politica-de-uso`).
- **Data safety**: formulário **“Segurança dos dados”** na Play Console preenchido com:
  - Quais dados são coletados (ex.: localização, áudio, e-mail/nome).
  - Se são compartilhados com terceiros.
  - Se são opcionais ou obrigatórios.
  - Práticas de segurança (ex.: dados em trânsito com HTTPS).

### 2.3 Funcionalidade e experiência do usuário

- O app deve ter **funcionalidade real** e estável (não apenas placeholder).
- Botão do Pânico já oferece: login, contatos, acionamento de emergência, áudio – isso atende ao requisito básico.

### 2.4 Conteúdo e permissões

- **Conteúdo**: sem conteúdo proibido (violência gráfica, conteúdo sexual, drogas ilícitas, etc.) na listagem (textos, screenshots, vídeos).
- **Permissões**: declarar só as necessárias (localização, microfone, notificações) e explicar o uso na Data safety e, se possível, na política de privacidade.

### 2.5 Outros pontos úteis

- **Impersonação**: não fingir ser outra pessoa ou outro app.
- **Propriedade intelectual**: não usar marcas/obras de terceiros sem autorização.
- **Spam**: não manipular instalações, avaliações ou comentários.

---

## 3. Checklist antes de reenviar

- [ ] **Ícone no app**: `assets/icon.png` e `assets/adaptive-icon.png` em **1024×1024 px** (ou no mínimo tamanho aceitável pelo Expo), visíveis e em linha com as regras acima.
- [ ] **Ícone na Play Console**: gráfico **512×512 px** enviado em “Principais recursos da página da loja”.
- [ ] **Título**: ≤ 30 caracteres, sem emojis, sem ALL CAPS desnecessário.
- [ ] **Política de privacidade**: URL válida na ficha do app.
- [ ] **Data safety**: formulário completo e coerente com o que o app realmente coleta.
- [ ] **Descrição e screenshots**: sem ranking, ofertas ou símbolos enganosos; descrição objetiva e verdadeira.

Após corrigir o ícone e revisar metadados + Data safety, faça um novo build (incrementando `versionCode` no Android), envie o novo AAB e preencha/atualize a listagem na Play Console conforme este guia.
