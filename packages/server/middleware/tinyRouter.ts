import { has } from '@appsemble/utils';
import { methodNotAllowed } from '@hapi/boom';
import { Middleware } from 'koa';

type HttpMethod = 'delete' | 'get' | 'head' | 'options' | 'patch' | 'post' | 'put';

type Route = {
  [method in HttpMethod]?: Middleware;
} & {
  route: RegExp | string;
  any?: Middleware;
};

/**
 * A tiny dynamic router middleware for GET requests.
 *
 * 