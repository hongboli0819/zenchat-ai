/**
 * Supabase Realtime 订阅
 * 
 * 监听数据库表变化，自动刷新缓存
 * 
 * 订阅的表：
 * - zip_upload_tasks: 任务状态变化
 * - xhs_posts: 帖子数据变化
 * - post_images: 图片数据变化
 */

import { useEffect, useRef } from "react";
import { supabase } from "./supabase";
import { invalidateAllData, invalidateData } from "./queries";
import type { RealtimeChannel } from "@supabase/supabase-js";

// 防抖延迟（毫秒）
const DEBOUNCE_DELAY = 1000;

/**
 * 使用 Supabase Realtime 订阅数据库变化
 * 当数据变化时自动刷新对应的缓存
 */
export function useRealtimeSubscription() {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceTimerRef = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    // 防抖刷新函数
    const debouncedRefresh = (type: "posts" | "accounts" | "tasks" | "all") => {
      // 清除之前的定时器
      if (debounceTimerRef.current[type]) {
        clearTimeout(debounceTimerRef.current[type]);
      }
      
      // 设置新的定时器
      debounceTimerRef.current[type] = setTimeout(async () => {
        console.log(`[Realtime] 检测到 ${type} 变化，刷新缓存...`);
        try {
          await invalidateData(type);
        } catch (error) {
          console.warn(`[Realtime] 刷新 ${type} 缓存失败:`, error);
        }
      }, DEBOUNCE_DELAY);
    };

    // 创建 Realtime 频道
    const channel = supabase
      .channel("db-changes")
      // 监听任务表变化
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "zip_upload_tasks",
        },
        (payload) => {
          console.log("[Realtime] zip_upload_tasks 变化:", payload.eventType);
          
          // 任务变化时，刷新任务和帖子数据
          debouncedRefresh("tasks");
          
          // 如果是任务完成，也刷新帖子和统计
          if (payload.eventType === "UPDATE") {
            const newRecord = payload.new as { status?: string };
            if (newRecord.status === "completed" || newRecord.status === "failed") {
              console.log("[Realtime] 任务完成，刷新所有数据");
              debouncedRefresh("all");
            }
          }
        }
      )
      // 监听帖子表变化
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "xhs_posts",
        },
        (payload) => {
          console.log("[Realtime] xhs_posts 变化:", payload.eventType);
          debouncedRefresh("posts");
        }
      )
      // 监听图片表变化
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_images",
        },
        (payload) => {
          console.log("[Realtime] post_images 变化:", payload.eventType);
          debouncedRefresh("posts");
        }
      )
      // 监听账号表变化
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "xhs_accounts",
        },
        (payload) => {
          console.log("[Realtime] xhs_accounts 变化:", payload.eventType);
          debouncedRefresh("accounts");
        }
      );

    // 订阅频道
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("[Realtime] ✅ 已订阅数据库变化");
      } else if (status === "CHANNEL_ERROR") {
        console.warn("[Realtime] ❌ 订阅失败，可能需要启用 Supabase Realtime");
      } else {
        console.log("[Realtime] 订阅状态:", status);
      }
    });

    channelRef.current = channel;

    // 清理函数
    return () => {
      console.log("[Realtime] 取消订阅");
      
      // 清除所有防抖定时器
      Object.values(debounceTimerRef.current).forEach(clearTimeout);
      debounceTimerRef.current = {};
      
      // 取消订阅
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);
}

/**
 * 检查 Realtime 是否可用
 */
export async function checkRealtimeAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const testChannel = supabase.channel("test-connection");
    
    const timeout = setTimeout(() => {
      supabase.removeChannel(testChannel);
      resolve(false);
    }, 5000);

    testChannel.subscribe((status) => {
      clearTimeout(timeout);
      supabase.removeChannel(testChannel);
      resolve(status === "SUBSCRIBED");
    });
  });
}

