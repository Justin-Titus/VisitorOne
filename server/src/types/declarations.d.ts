// Type declarations for packages that don't ship their own @types
declare module 'xss-clean' {
  import { RequestHandler } from 'express';
  function xss(): RequestHandler;
  export = xss;
}
