# Checklist de Teste – MVP (Botão do Pânico)

Use este roteiro para validar o MVP ponta‑a‑ponta (backend + painel web + app mobile).

## Preparação
- [ ] Backend rodando (porta 3001) e `DATABASE_URL` configurada.
- [ ] Painel web rodando (porta 3000) e `NEXT_PUBLIC_API_URL` apontando para a API.
- [ ] App mobile rodando (Expo) e `EXPO_PUBLIC_API_URL` apontando para o IP/URL da API acessível pelo celular/simulador.

## 1) Cadastro / Login (mobile)
- [ ] Criar um usuário normal (não “somente suporte”) com CPF válido.
- [ ] Informar 1–3 contatos por CPF no cadastro; confirmar mensagem quando algum CPF não existir.
- [ ] Fazer login e confirmar que o app entra nas tabs.

## 2) Contatos (mobile)
- [ ] Ver topo “X de 3” e barra visual de progresso.
- [ ] Adicionar contatos por CPF até completar 3/3.
- [ ] Confirmar que ao chegar em 3/3 o botão de adicionar some.
- [ ] Remover um contato e confirmar que volta a permitir adicionar.

## 3) Pânico (mobile)
- [ ] Acionar pânico e confirmar countdown de cancelamento.
- [ ] Confirmar captura de localização.
- [ ] Confirmar gravação de áudio e envio.
- [ ] Confirmar tela de status atualizando a cada 5s (quem recebeu/quem leu).
- [ ] Confirmar que aparece endereço aproximado quando disponível.

## 4) Recebimento de alertas (mobile do contato)
- [ ] Logar como usuário cadastrado como contato.
- [ ] Se houver alerta OPEN, confirmar que ao logar ele abre automaticamente a tela do alerta.
- [ ] Na lista “Alertas recebidos”, abrir um alerta e confirmar mapa e dados.
- [ ] Confirmar botão “Ouvir áudio do evento” (quando `audioUrl` existir).

## 5) Painel Web
- [ ] Login como ADMIN.
- [ ] Ver lista de eventos, mapa e detalhe do evento.
- [ ] Confirmar áudio tocando no navegador quando existir.
- [ ] Encerrar evento e confirmar feedback de sucesso.

## 6) Admin – usuários (painel web)
- [ ] Editar usuário e alterar `active` (inativar).
- [ ] Confirmar que usuário inativo não consegue login.
- [ ] Alternar “somente suporte” e validar comportamento no mobile (não deve permitir cadastrar contatos quando supportOnly).

## 7) Erros / rede
- [ ] Desligar backend e confirmar mensagens amigáveis no web/mobile.
- [ ] Simular lentidão e confirmar que o app mostra “A requisição demorou demais”.

