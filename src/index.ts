import { logger } from './lib/logger';
import { Manager } from './structs/Manager';

new Manager().Start().catch((e) => logger.error((e as Error)?.message));
