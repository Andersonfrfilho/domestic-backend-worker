# Email Templates - Domestic

Templates de email profissionais e responsivos para a plataforma Domestic.

## 🎨 Design System

Todos os templates seguem um padrão visual consistente baseado no design system do app Domestic.

### Paleta de Cores

```
Primary:     #1A45E8 (azul vibrante)
Primary Dk:  #1438CC (azul escuro)
Primary Lt:  #C7D4FD (azul claro)
Primary Bg:  #EEF2FF (azul superficial)

Neutral 0:   #FFFFFF (branco)
Neutral 50:  #F8FAFC (fundo)
Neutral 100: #F1F5F9 (background)
Neutral 200: #E2E8F0 (borders)
Neutral 400: #94A3B8 (texto terciário)
Neutral 600: #475569 (texto secundário)
Neutral 900: #0F172A (texto primário)

Error:       #EF4444 (vermelho para atenção)
Warning:     #F59E0B (amarelo para avisos)
```

### Tipografia

- **Font Family**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Weights**: 400 (normal), 500 (semibold), 600 (bold), 700 (extrabold)

## 📋 Templates Disponíveis

| Template ID | Uso | Variáveis Esperadas |
|------------|-----|-------------------|
| `verification_code` | Código de verificação de email | `code`, `expiresIn`, `name` |
| `welcome` | Boas-vindas após cadastro | `name`, `app_url` |
| `service-request-received` | Nova solicitação para profissional | `provider_name`, `service_name`, `contractor_name`, `location`, `scheduled_at`, `budget`, `duration`, `request_url` |
| `service-request-accepted` | Solicitação aceita | `requester_name`, `service_name`, `scheduled_at`, `provider_name` |
| `service-request-rejected` | Solicitação recusada | `requester_name`, `service_name` |
| `service-request-completed` | Serviço concluído | `requester_name`, `service_name`, `provider_name`, `review_url` |
| `service-request-cancelled` | Solicitação cancelada | `provider_name`, `service_name` |
| `verification-approved` | Verificação aprovada | `name`, `document_type` |
| `verification-rejected` | Verificação recusada | `name`, `reason` |
| `request-reminder` | Lembrete de solicitação | `requester_name`, `service_name`, `action_url` |

## 🔧 Como Usar

### Enviar Email via Worker

```typescript
// No API service
const emailPayload = {
  body: {
    to: user.email,
    template_id: 'verification_code',
    variables: {
      code: '1234',
      expiresIn: '10 minutos',
      name: 'João',
    },
  },
  metadata: {
    source: 'onboarding-verification',
    destination: user.email,
    type: 'email',
  },
};

await this.messageProducer.send('notifications', emailPayload, {
  exchange: 'zolve.events',
  routingKey: 'notifications.email',
  persistent: true,
});
```

### Template Variables

As variáveis são renderizadas usando **Handlebars** (`{{variable}}`):

```handlebars
<!-- Simples -->
<p>{{name}}</p>

<!-- Condicional -->
<div>{{#if name}}Olá {{name}}!{{/if}}</div>

<!-- Loop -->
<ul>
{{#each items}}
  <li>{{this}}</li>
{{/each}}
</ul>
```

## 🎯 Diretrizes de Design

### Componentes Reutilizáveis

#### Header
```html
<div class="email-header">
  <div class="header-icon">🔐</div>
  <h1>Título do Email</h1>
  <p>Subtítulo ou descrição</p>
</div>
```

#### Card/Box
```html
<div class="code-section">
  <span class="code-label">Label</span>
  <p class="verification-code">CONTEÚDO</p>
</div>
```

#### Info Box
```html
<div class="info-box">
  <div class="info-title">Título</div>
  <div class="info-text">Conteúdo informativo</div>
</div>
```

#### CTA Button
```html
<a href="{{url}}" class="cta-button">Texto do Botão</a>
```

### Boas Práticas

1. **Mobile First**: Sempre testar em mobile (viewport 375px)
2. **Contraste**: Manter razão de contraste ≥ 4.5:1
3. **Tamanho de Fonte**: Mínimo 12px para texto pequeno, 14px para corpo
4. **Padding**: Mínimo 8px entre elementos
5. **Cores**: Nunca usar apenas cor para transmitir informação
6. **Acessibilidade**: Usar `alt` em imagens, textos descritivos em links

## 🧪 Testando Templates

### Preview de Email

1. Enviar um evento de teste via RabbitMQ
2. Verificar email em MailPit (http://mailpit:8025)
3. Comparar com screenshot de referência

### Renderização Local

```bash
# Renderizar template manualmente
node -e "
const Handlebars = require('handlebars');
const fs = require('fs');

const source = fs.readFileSync('verification_code.hbs', 'utf-8');
const template = Handlebars.compile(source);
const html = template({ code: '1234', expiresIn: '10 minutos' });
console.log(html);
"
```

## 📝 Criando Novo Template

1. **Criar arquivo**: `templates/my-template.hbs`
2. **Adicionar subject**: Adicionar entry em `EmailHandler.SUBJECTS`
3. **Estrutura base**:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Título do Email</title>
  <style type="text/css">
    /* Copiar reset e body styles de outro template */
    /* Adicionar estilos customizados */
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <div class="header-icon">🎉</div>
        <h1>Título</h1>
        <p>Subtítulo</p>
      </div>

      <div class="email-body">
        <!-- Conteúdo aqui -->
      </div>

      <div class="email-footer">
        <div class="footer-logo">Domestic</div>
        <div class="footer-text">© 2026 Domestic.</div>
      </div>
    </div>
  </div>
</body>
</html>
```

4. **Adicionar variáveis esperadas em comentário no topo**
5. **Testar responsividade** em 375px e 600px
6. **Validar HTML** com W3C Validator

## 🚀 Performance

- Tamanho máximo recomendado: < 100KB (com imagens inline)
- CSS inline para melhor compatibilidade com clientes de email
- Sem JavaScript (não suportado em email)
- Imagens otimizadas (base64 inline recomendado)

## 🔒 Segurança

- ✅ Variáveis são escapadas automaticamente pelo Handlebars
- ✅ Nenhum link externo não validado
- ✅ Nenhuma senha ou dado sensível em variáveis de log
- ✅ SPF, DKIM, DMARC configurados (via infraestrutura)

## 📊 Monitoramento

### Métricas no Loki (via logs)

```
{job="worker"} | json 
| "EmailHandler" 
| line_format "{{.message}} - {{.params.to}}"
```

### Alertas

- ⚠️ Taxa de erro > 5%
- ⚠️ Latência média > 500ms
- ⚠️ Fila de mensagens crescendo

## 🆘 Troubleshooting

| Problema | Solução |
|----------|---------|
| Email não chega | Verificar logs do worker, fila RabbitMQ, SMTP connectivity |
| Template não encontrado | Verificar `template_id` vs nome do arquivo |
| Variáveis vazias | Verificar se estão sendo passadas corretamente no payload |
| Styling errado | Validar CSS inline, testar em múltiplos clientes |

---

**Últimas atualizações**: 2026-05-28 | Versão: 2.0.0
