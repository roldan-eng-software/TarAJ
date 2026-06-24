# WhatsApp Baileys Service

Serviço HTTP que mantém conexão via WhatsApp Web e permite enviar mensagens programaticamente.

## Setup

```bash
npm install
npm run dev
```

Na primeira execução, um QR Code será exibido. Escaneie com o WhatsApp (Configurações > Aparelhos conectados > Conectar aparelho).

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /health | Health check |
| GET | /status | `{ connected: true/false }` |
| POST | /send | `{ phone, message }` → envia mensagem |

## Exemplo de uso

```bash
# Verificar status
curl http://localhost:3001/status

# Enviar mensagem
curl -X POST http://localhost:3001/send \
  -H "Content-Type: application/json" \
  -d '{"phone":"5511999999999","message":"Olá, esta é uma notificação do sistema"}'
```

## Docker

```bash
docker build -t whatsapp-baileys .
docker run -d -p 3001:3001 -v ./auth_info:/app/auth_info whatsapp-baileys
```

## Notas

- A pasta `auth_info` contém a sessão do WhatsApp. Deve ser persistida entre reinicializações.
- O número de telefone deve incluir código do país (ex: 5511999999999).
- O serviço é apenas para envio. Não recebe respostas.
