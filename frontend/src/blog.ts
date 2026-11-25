import { useEffect, useState } from 'react';
import type { BlogPost } from './mockData';

export type Topic = BlogPost['category'];
export const TOPICS: Topic[] = ['Code', 'Japanese', 'Design', 'Thoughts'];

export interface PostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: Topic;
  tags: string[];
  publishedAt: string | null;
  readTime: string;
  japaneseTitle: string | null;
}

export type Post = PostSummary & { content: string };
export type PostStatus = 'draft' | 'published';
export type StudioPost = Post & { status: PostStatus; revision: number };
export type Session = { signedIn: boolean; hasOwner: boolean; setupAvailable: boolean };

const dateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
export const formatDate = (value: string) => dateFormat.format(new Date(value));
export const articleUrl = (slug: string) => '/posts/' + encodeURIComponent(slug);

export class RequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = import.meta.env.MODE === 'pages' ? '/journal-data' + path + '.json' : '/api' + path;
  const response = await fetch(url, options);
  const body = await response.json().catch(() => null);
  if (!response.ok || body === null) {
    throw new RequestError(response.status, body?.error ?? 'Could not reach the journal. Please try again.');
  }
  return body as T;
}

export function writeRequest(method: 'POST' | 'PUT', data: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong. Please try again.';

export function useResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    request<T>(path, { signal: controller.signal })
      .then(setData)
      .catch((failure: Error) => {
        if (!controller.signal.aborted) setError(failure);
      });
    return () => controller.abort();
  }, [path, attempt]);

  function retry() {
    setError(null);
    setAttempt((count) => count + 1);
  }

  return { data, error, retry };
}

