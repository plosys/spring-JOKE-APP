
import { request, setTestApp } from 'axios-test-instance';
import chalk from 'chalk';
import Koa from 'koa';

import { logger } from './logger.js';
import { loggerMiddleware } from './loggerMiddleware.js';

class TestError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'TestError';
  }
}

let app: Koa;

beforeEach(async () => {
  import.meta.jest.spyOn(logger, 'info').mockImplementation(() => logger);
  import.meta.jest.spyOn(logger, 'log').mockImplementation(() => logger);
  import.meta.jest.useFakeTimers({ now: 0 });
  app = new Koa();
  app.use(async (ctx, next) => {
    Object.defineProperty(ctx.request, 'origin', {
      value: 'https://example.com:1337',
    });
    try {
      await next();
    } catch (error: unknown) {
      if (!(error instanceof TestError)) {
        throw error;
      }
      ctx.status = 400;
    }
  });
  app.use(loggerMiddleware());
  app.silent = true;
  request.defaults.maxRedirects = 0;
  await setTestApp(app);
});

it('should log requests', async () => {
  await request.get('/pizza');
  expect(logger.info).toHaveBeenCalledWith(
    `${chalk.bold('GET')} https://example.com:1337/pizza — ${chalk.white('127.0.0.1')}`,
  );
});

it('should log success responses as info', async () => {
  app.use((ctx) => {
    import.meta.jest.advanceTimersByTime(1);
    ctx.status = 200;
  });
  await request.get('/fries');
  expect(logger.log).toHaveBeenCalledWith(
    'info',
    `${chalk.bold('GET')} https://example.com:1337/fries ${chalk.green('200 OK')} ${chalk.green(
      '1ms',
    )}`,
  );
});

it('should log redirect responses as info', async () => {
  app.use((ctx) => {
    import.meta.jest.advanceTimersByTime(33);
    ctx.redirect('/');
  });
  await request.get('/fries');
  expect(logger.log).toHaveBeenCalledWith(
    'info',
    `${chalk.bold('GET')} https://example.com:1337/fries ${chalk.cyan(
      '302 Found → /',
    )} ${chalk.green('33ms')}`,
  );
});

it('should log bad responses as warn', async () => {
  app.use((ctx) => {
    import.meta.jest.advanceTimersByTime(3);
    ctx.status = 400;
  });
  await request.get('/burrito');
  expect(logger.log).toHaveBeenCalledWith(
    'warn',
    `${chalk.bold('GET')} https://example.com:1337/burrito ${chalk.yellow(
      '400 Bad Request',
    )} ${chalk.green('3ms')}`,
  );
});

it('should log error responses as error', async () => {
  app.use((ctx) => {
    import.meta.jest.advanceTimersByTime(53);
    ctx.status = 503;
  });
  await request.get('/wrap');
  expect(logger.log).toHaveBeenCalledWith(
    'error',
    `${chalk.bold('GET')} https://example.com:1337/wrap ${chalk.red(
      '503 Service Unavailable',
    )} ${chalk.green('53ms')}`,
  );
});

it('should log long request lengths yellow', async () => {
  app.use((ctx) => {
    import.meta.jest.advanceTimersByTime(400);
    ctx.status = 200;
  });
  await request.get('/banana');
  expect(logger.log).toHaveBeenCalledWith(
    'info',
    `${chalk.bold('GET')} https://example.com:1337/banana ${chalk.green('200 OK')} ${chalk.yellow(
      '400ms',
    )}`,
  );
});

it('should log extremely long request lengths red', async () => {
  app.use((ctx) => {
    import.meta.jest.advanceTimersByTime(1337);
    ctx.status = 200;
  });
  await request.get('/pepperoni');
  expect(logger.log).toHaveBeenCalledWith(
    'info',
    `${chalk.bold('GET')} https://example.com:1337/pepperoni ${chalk.green('200 OK')} ${chalk.red(
      '1337ms',
    )}`,
  );
});

it('should log errors as internal server errors and rethrow', async () => {
  const spy = import.meta.jest.fn();
  const error = new Error('fail');
  let context;
  app.on('error', spy);
  app.use((ctx) => {
    import.meta.jest.advanceTimersByTime(86);
    context = ctx;
    throw error;
  });
  await request.get('/taco');
  expect(spy).toHaveBeenCalledWith(error, context);
  expect(logger.log).toHaveBeenCalledWith(
    'error',
    `${chalk.bold('GET')} https://example.com:1337/taco ${chalk.red(
      '500 Internal Server Error',
    )} ${chalk.green('86ms')}`,
  );
});

it('should append the response length if it is defined', async () => {
  app.use((ctx) => {
    import.meta.jest.advanceTimersByTime(1);
    ctx.status = 200;
    ctx.body = '{}';
  });
  await request.get('/fries');
  expect(logger.log).toHaveBeenCalledWith(
    'info',
    `${chalk.bold('GET')} https://example.com:1337/fries ${chalk.green('200 OK')} ${chalk.green(
      '1ms',
    )}`,
  );
});

it('should log handled errors correctly', async () => {
  app.use(() => {
    import.meta.jest.advanceTimersByTime(15);
    throw new TestError();
  });
  await request.get('potatoes');
  expect(logger.log).toHaveBeenCalledWith(
    'warn',
    `${chalk.bold('GET')} https://example.com:1337/potatoes ${chalk.yellow(
      '400 Bad Request',
    )} ${chalk.green('15ms')}`,
  );
});