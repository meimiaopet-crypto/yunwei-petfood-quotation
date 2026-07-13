/**
 * 服务端 Supabase 客户端
 * - getServerSupabase(): 在 RSC / Route Handler 中使用，基于 next/headers 的 cookies
 * - getServiceSupabase(): 拥有完整权限，仅在服务端 API 路由中调用
 * 注意：本文件不能被 'use client' 组件 import
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      get(name: string) { return cookieStore.get(name)?.value; },
      set(name: string, value: string, options: CookieOptions) {
        try { cookieStore.set({ name, value, ...options }); } catch { /* no-op in RSC */ }
      },
      remove(name: string, options: CookieOptions) {
        try { cookieStore.set({ name, value: '', ...options }); } catch { /* no-op */ }
      },
    },
  });
}

export function getServiceSupabase(): SupabaseClient {
  if (!SUPABASE_SERVICE) throw new Error('SUPABASE_SERVICE_ROLE_KEY 未配置');
  return createClient(SUPABASE_URL, SUPABASE_SERVICE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
