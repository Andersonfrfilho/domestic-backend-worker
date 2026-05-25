import { LOGGER_PROVIDER, runWithContext } from '@adatechnology/logger';
import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import type { LogProviderInterface } from '@modules/shared/interfaces/log.interface';
import { CONNECTIONS_NAMES } from '@modules/shared/providers/database/database.constant';

const DAY_MS = 86400000;

function cronRunId(job: string): string {
  return `cron:${job}:${Date.now().toString(36)}`;
}

@Injectable()
export class BlockReminderJob {
  constructor(
    @InjectDataSource(CONNECTIONS_NAMES.POSTGRES)
    private readonly dataSource: DataSource,
    @Inject(LOGGER_PROVIDER)
    private readonly logProvider: LogProviderInterface,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async processBlockReminders(): Promise<void> {
    await runWithContext({ requestId: cronRunId('block-reminder') }, async () => {
      this.logProvider.info({
        message: '⏰ Block reminder job started',
        context: 'BlockReminderJob.processBlockReminders',
        params: {},
      });

      try {
        const blocks = await this.dataSource.query(
          `SELECT id, user_id, reason, message, blocked_at, can_retry_at, metadata
         FROM account_blocks
         WHERE resolved_at IS NULL`,
        );

        this.logProvider.info({
          message: `Found ${blocks.length} active blocks`,
          context: 'BlockReminderJob.processBlockReminders',
          params: { count: blocks.length },
        });

        for (const block of blocks) {
          const daysSinceBlock =
            Math.floor((Date.now() - new Date(block.blocked_at).getTime()) / DAY_MS) + 1;

          if (daysSinceBlock >= 5) {
            // Block is too old — auto-resolve (blocked permanently)
            this.logProvider.warn({
              message: `Auto-blocking user after ${daysSinceBlock} days`,
              context: 'BlockReminderJob.processBlockReminders',
              params: {
                blockId: block.id,
                userId: block.user_id,
                reason: block.reason,
                days: daysSinceBlock,
              },
            });

            // Mark as resolved with note
            await this.dataSource.query(
              `UPDATE account_blocks SET resolved_at = NOW(), resolved_by = 'system',
             message = CONCAT(COALESCE(message, ''), ' | Bloqueio automático após ', $1, ' dias sem ação.')
             WHERE id = $2`,
              [String(daysSinceBlock), block.id],
            );
          } else {
            // Send reminder
            this.logProvider.info({
              message: `📧 Day ${daysSinceBlock}/5 reminder for block ${block.id}`,
              context: 'BlockReminderJob.processBlockReminders',
              params: {
                blockId: block.id,
                userId: block.user_id,
                reason: block.reason,
                day: daysSinceBlock,
                daysRemaining: 5 - daysSinceBlock,
              },
            });
          }
        }
      } catch (err: any) {
        this.logProvider.error({
          message: `Block reminder job failed: ${err.message}`,
          context: 'BlockReminderJob.processBlockReminders',
          params: { error: err.message },
        });
      }

      this.logProvider.info({
        message: '⏰ Block reminder job finished',
        context: 'BlockReminderJob.processBlockReminders',
        params: {},
      });
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async processExpiredBlocks(): Promise<void> {
    await runWithContext({ requestId: cronRunId('expired-blocks') }, async () => {
      this.logProvider.info({
        message: '⏰ Expired block cleanup started',
        context: 'BlockReminderJob.processExpiredBlocks',
        params: {},
      });

      try {
        const result = await this.dataSource.query(
          `UPDATE account_blocks
         SET resolved_at = NOW(), resolved_by = 'system',
             message = CONCAT(COALESCE(message, ''), ' | Bloqueio automático por expiração do período de carência.')
         WHERE resolved_at IS NULL
           AND blocked_at < NOW() - INTERVAL '5 days'
         RETURNING id`,
        );

        if (result.length > 0) {
          this.logProvider.info({
            message: `Auto-blocked ${result.length} expired accounts`,
            context: 'BlockReminderJob.processExpiredBlocks',
            params: { count: result.length },
          });
        }
      } catch (err: any) {
        this.logProvider.error({
          message: `Expired block cleanup failed: ${err.message}`,
          context: 'BlockReminderJob.processExpiredBlocks',
          params: { error: err.message },
        });
      }
    });
  }
}
