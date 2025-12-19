/**
 * Supabase 客户端配置
 * 
 * 根据规范：API 密钥通过 Lovable Secrets 管理，不写死在前端代码中
 * 开发时使用环境变量
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/core/types/database";

// 从环境变量读取配置（浏览器环境）
// 使用函数来延迟获取，避免在非浏览器环境下报错
function getEnvVar(key: string): string {
  if (typeof window !== "undefined" && typeof import.meta !== "undefined") {
    return (import.meta.env?.[key] as string) || "";
  }
  // Node.js 环境
  if (typeof process !== "undefined" && process.env) {
    return process.env[key] || "";
  }
  return "";
}

const supabaseUrl = getEnvVar("VITE_SUPABASE_URL");
const supabaseAnonKey = getEnvVar("VITE_SUPABASE_ANON_KEY");
const supabaseServiceKey = getEnvVar("VITE_SUPABASE_SERVICE_KEY");

// 创建 Supabase 客户端（单例）- 用于普通读取操作
let _supabase: SupabaseClient<Database> | null = null;

export const supabase: SupabaseClient<Database> = (() => {
  if (!_supabase && supabaseUrl && supabaseAnonKey) {
    _supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
    console.log("[Supabase] ✅ 客户端已初始化（Anon）");
  }
  return _supabase || createClient<Database>("https://placeholder.supabase.co", "placeholder-key");
})();

// 创建 Service Role 客户端（单例）- 用于管理员写入操作，绕过 RLS
let _supabaseAdmin: SupabaseClient<Database> | null = null;

export const supabaseAdmin: SupabaseClient<Database> = (() => {
  if (!_supabaseAdmin && supabaseUrl && supabaseServiceKey) {
    _supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    console.log("[Supabase] ✅ Admin 客户端已初始化（Service Role）");
  }
  // 如果没有 service key，fallback 到普通客户端
  return _supabaseAdmin || supabase;
})();

// 检查配置是否有效
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

// 检查 Admin 客户端是否可用
export const isSupabaseAdminConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseServiceKey);
};




