import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { ValidationPipe, Logger, INestApplication } from '@nestjs/common'
import cookieParser from 'cookie-parser'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'warn', 'error'] })
  app.setGlobalPrefix('api/v1')
  app.use(cookieParser())
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false })
  )
  app.enableShutdownHooks()
  const port = Number(process.env.PORT || 3001)
  await app.listen(port, '0.0.0.0')
  Logger.log(`HRMS API listening on http://0.0.0.0:${port}/api/v1`, 'Bootstrap')
}

void bootstrap()
