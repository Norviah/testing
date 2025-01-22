import { config } from '@/utils/config';
import { ApiClient } from '@mondaydotcomorg/api';

export const client = new ApiClient(config.ACCESS_TOKEN);
