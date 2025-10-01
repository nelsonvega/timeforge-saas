import type { Application } from 'express';
import request from 'supertest';
import { expect } from 'vitest';

export interface ApiTestOptions {
  app: Application;
  cookie?: string;
  workspaceId?: string;
}

export async function apiGet(path: string, options: ApiTestOptions) {
  const req = request(options.app).get(path);
  
  if (options.cookie) {
    req.set('Cookie', options.cookie);
  }
  
  if (options.workspaceId) {
    req.set('x-workspace-id', options.workspaceId);
  }
  
  return req;
}

export async function apiPost(path: string, body: any, options: ApiTestOptions) {
  const req = request(options.app).post(path).send(body);
  
  if (options.cookie) {
    req.set('Cookie', options.cookie);
  }
  
  if (options.workspaceId) {
    req.set('x-workspace-id', options.workspaceId);
  }
  
  return req;
}

export async function apiPut(path: string, body: any, options: ApiTestOptions) {
  const req = request(options.app).put(path).send(body);
  
  if (options.cookie) {
    req.set('Cookie', options.cookie);
  }
  
  if (options.workspaceId) {
    req.set('x-workspace-id', options.workspaceId);
  }
  
  return req;
}

export async function apiDelete(path: string, options: ApiTestOptions) {
  const req = request(options.app).delete(path);
  
  if (options.cookie) {
    req.set('Cookie', options.cookie);
  }
  
  if (options.workspaceId) {
    req.set('x-workspace-id', options.workspaceId);
  }
  
  return req;
}

export function expectUnauthorized(response: request.Response) {
  expect(response.status).toBe(401);
}

export function expectForbidden(response: request.Response) {
  expect(response.status).toBe(403);
}

export function expectSuccess(response: request.Response) {
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(300);
}

export function expectCreated(response: request.Response) {
  expect(response.status).toBe(201);
}
