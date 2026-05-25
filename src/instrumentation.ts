import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'domestic-worker',
    [ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? '0.0.1',
  }),
  traceExporter: new OTLPTraceExporter({
    url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://jaeger:4318'}/v1/traces`,
    timeoutMillis: 5000, // 5 second timeout instead of default 10
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false },
      '@opentelemetry/instrumentation-dns': { enabled: false },
      '@opentelemetry/instrumentation-amqplib': { enabled: true },
    }),
  ],
});

try {
  sdk.start();
} catch (err) {
  // Don't let OTEL startup failures block the app bootstrap
  console.warn('OpenTelemetry SDK startup failed:', err instanceof Error ? err.message : err);
}

process.on('SIGTERM', () => {
  sdk.shutdown().finally(() => process.exit(0));
});
