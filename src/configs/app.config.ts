import { registerAs } from '@nestjs/config';

export default registerAs(
  'app',
  (): Record<string, unknown> => ({
    env: process.env.ENVIRONMENT_NAME,
    http: {
      host: process.env.HTTP_HOST || 'localhost',
      port: process.env.HTTP_PORT
        ? Number.parseInt(process.env.HTTP_PORT)
        : 3000,
    },
  }),
);
