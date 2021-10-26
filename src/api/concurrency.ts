/*
Adapted from https://github.com/bernawil/axios-concurrency

Copyright (C) 2019 Bernardo Wilberger

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 */

import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

interface RequestHandler {
  request: AxiosRequestConfig;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolver: any;
}
export const ConcurrencyManager = (axios: AxiosInstance, MAX_CONCURRENT = 10) => {
  if (MAX_CONCURRENT < 1) throw 'Concurrency Manager Error: minimun concurrent requests is 1';
  const instance = {
    queue: [] as RequestHandler[],
    running: [] as RequestHandler[],
    shiftInitial: () => {
      setTimeout(() => {
        if (instance.running.length < MAX_CONCURRENT) {
          instance.shift();
        }
      }, 0);
    },
    push: (reqHandler: RequestHandler) => {
      instance.queue.push(reqHandler);
      instance.shiftInitial();
    },
    shift: () => {
      if (instance.queue.length) {
        const queued = instance.queue.shift();
        if (queued) {
          queued.resolver(queued.request);
          instance.running.push(queued);
        }
      }
    },
    // Use as interceptor. Queue outgoing requests
    requestHandler: (req: AxiosRequestConfig): Promise<AxiosRequestConfig> => {
      return new Promise(resolve => {
        instance.push({ request: req, resolver: resolve });
        return req;
      });
    },
    // Use as interceptor. Execute queued request upon receiving a response
    responseHandler: (res: AxiosResponse) => {
      instance.running.shift();
      instance.shift();
      return res;
    },
    responseErrorHandler: (res: AxiosResponse) => {
      return Promise.reject(instance.responseHandler(res));
    },
    interceptors: {
      request: -1,
      response: -1
    },
    detach: () => {
      axios.interceptors.request.eject(instance.interceptors.request);
      axios.interceptors.response.eject(instance.interceptors.response);
    }
  };
  // queue concurrent requests
  instance.interceptors.request = axios.interceptors.request.use(instance.requestHandler);
  instance.interceptors.response = axios.interceptors.response.use(
    instance.responseHandler,
    instance.responseErrorHandler
  );
  return instance;
};
