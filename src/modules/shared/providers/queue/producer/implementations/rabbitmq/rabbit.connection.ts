import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const rabbitConnection = RabbitMQModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => {
    const rabbitMqUrl = configService.get<string>('RABBITMQ_URL');

    const queueHost = configService.get<string>('QUEUE_RABBITMQ_HOST') ?? 'rabbitmq';
    const queuePort = configService.get<string>('QUEUE_RABBITMQ_PORT') ?? '5672';
    const queueUser = configService.get<string>('QUEUE_RABBITMQ_USER') ?? 'domestic';
    const queuePass = configService.get<string>('QUEUE_RABBITMQ_PASS') ?? 'backendapi123';

    const fallbackUri = `amqp://${queueUser}:${queuePass}@${queueHost}:${queuePort}`;
    const uri = rabbitMqUrl && !rabbitMqUrl.includes('undefined') ? rabbitMqUrl : fallbackUri;

    return {
      // ✅ EXCHANGES - Declaramos todas as exchanges que vamos usar
      exchanges: [
        // Exchange para notificações (emails, SMS, push notifications)
        {
          name: 'notifications',
          type: 'topic',
          options: {
            durable: true, // Sobrevive restart do broker
            autoDelete: false, // Não apaga automaticamente
          },
        },
        // Exchange para auditoria e logs de segurança
        {
          name: 'audit',
          type: 'topic',
          options: {
            durable: true,
            autoDelete: false,
          },
        },
        // Exchange para integrações com sistemas externos
        {
          name: 'integration',
          type: 'topic',
          options: {
            durable: true,
            autoDelete: false,
          },
        },
        // Exchange para analytics e processamento assíncrono
        {
          name: 'analytics',
          type: 'topic',
          options: {
            durable: true,
            autoDelete: false,
          },
        },
        // Exchange para testes de saúde
        {
          name: 'health',
          type: 'direct',
          options: {
            durable: false,
            autoDelete: true,
          },
        },
        // Exchange padrão para mensagens sem exchange específico
        {
          name: 'default',
          type: 'topic',
          options: {
            durable: true,
            autoDelete: false,
          },
        },
        // Exchange de domínio Zolve — eventos de negócio (provider, service-request, review)
        {
          name: 'zolve.events',
          type: 'topic',
          options: {
            durable: true,
            autoDelete: false,
          },
        },
        // 🔥 DEAD LETTER EXCHANGES - Para mensagens que falharam
        {
          name: 'notifications.dlx',
          type: 'topic',
          options: {
            durable: true,
            autoDelete: false,
          },
        },
        {
          name: 'integration.dlx',
          type: 'topic',
          options: {
            durable: true,
            autoDelete: false,
          },
        },
        {
          name: 'analytics.dlx',
          type: 'topic',
          options: {
            durable: true,
            autoDelete: false,
          },
        },
      ],

      // ✅ QUEUES - Declaramos todas as queues que os consumers vão usar
      queues: [
        // Queue para processamento de emails de notificação
        {
          name: 'email.notifications',
          options: {
            durable: true,
            deadLetterExchange: 'notifications.dlx', // Dead letter exchange
            messageTtl: 86400000, // 24 horas TTL
          },
        },
        // Queue para eventos de auditoria
        {
          name: 'audit.events',
          options: {
            durable: true,
            messageTtl: 604800000, // 7 dias TTL
          },
        },
        // Queue para sincronização com CRM
        {
          name: 'crm.sync',
          options: {
            durable: true,
            deadLetterExchange: 'integration.dlx',
          },
        },
        // Queue para análise de risco/fraude
        {
          name: 'risk.analysis',
          options: {
            durable: true,
            deadLetterExchange: 'analytics.dlx',
          },
        },
        // Queue para testes de saúde
        {
          name: 'health.test.queue',
          options: {
            durable: false,
            autoDelete: true,
          },
        },
        // Queue para mensagens padrão
        {
          name: 'default.queue',
          options: {
            durable: true,
          },
        },
        // Queue para eventos de prestadores
        {
          name: 'provider.events',
          options: {
            durable: true,
          },
        },
        // Queue para eventos de solicitações de serviço
        {
          name: 'service-request.events',
          options: {
            durable: true,
          },
        },
        // 🔥 DEAD LETTER QUEUES - Para mensagens que falharam
        {
          name: 'email.notifications.dlq',

          options: {
            durable: true,
            messageTtl: 2592000000, // 30 dias para análise
          },
        },
        {
          name: 'crm.sync.dlq',
          options: {
            durable: true,
            messageTtl: 2592000000, // 30 dias
          },
        },
        {
          name: 'risk.analysis.dlq',
          options: {
            durable: true,
            messageTtl: 2592000000, // 30 dias
          },
        },
      ],

      // ✅ NOTA: Bindings são criados via RabbitBindingsService no startup
      // Isso é necessário porque o @golevelup/nestjs-rabbitmq não cria bindings
      // automaticamente pela configuração - apenas via decorators @RabbitSubscribe

      uri,
      connectionInitOptions: { wait: false },
    };
  },
  inject: [ConfigService],
});
