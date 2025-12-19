/**
 * Step 4: 查找或创建账号
 */

import type { CoreContext } from "../types/context";
import type { MappedAccount } from "../types/io";

interface AccountRow {
  id: string;
  profile_url: string;
}

interface AccountResult {
  accountMap: Map<string, string>; // profile_url → account_id
  newCount: number;
  existingCount: number;
}

/**
 * 批量查找或创建账号
 *
 * @param accounts - 需要处理的账号列表
 * @param ctx - CoreContext
 * @returns 账号映射和统计
 */
export async function findOrCreateAccounts(
  accounts: MappedAccount[],
  ctx?: CoreContext
): Promise<AccountResult> {
  const db = ctx?.adapters?.db;
  if (!db) throw new Error("Database adapter is required");

  const accountMap = new Map<string, string>();
  let newCount = 0;
  let existingCount = 0;

  if (accounts.length === 0) {
    return { accountMap, newCount, existingCount };
  }

  // 1. 获取所有有效的 profile_url
  const profileUrls = accounts
    .map((a) => a.profile_url)
    .filter((url) => url && url.trim() !== "");

  if (profileUrls.length === 0) {
    return { accountMap, newCount, existingCount };
  }

  // 2. 批量查询已存在的账号
  // URL 较长，减小批量大小避免 400 Bad Request
  const BATCH_SIZE = 50;
  for (let i = 0; i < profileUrls.length; i += BATCH_SIZE) {
    const batch = profileUrls.slice(i, i + BATCH_SIZE);

    const { data, error } = await db
      .from("xhs_accounts")
      .select("id, profile_url")
      .in("profile_url", batch);

    if (error) {
      const msg = error.message || JSON.stringify(error);
      throw new Error(`查询已存在账号失败: ${msg}`);
    }

    (data as AccountRow[] | null)?.forEach((row) => {
      if (row.profile_url) {
        accountMap.set(row.profile_url, row.id);
        existingCount++;
      }
    });
  }

  // 3. 找出需要新建的账号
  const newAccounts = accounts.filter(
    (a) => a.profile_url && !accountMap.has(a.profile_url)
  );

  // 4. 批量插入新账号
  if (newAccounts.length > 0) {
    const insertData = newAccounts.map((a) => ({
      nickname: a.nickname,
      avatar: a.avatar,
      profile_url: a.profile_url,
      xhs_id: a.xhs_id,
      xhs_user_id: a.xhs_user_id,
      account_type: a.account_type,
    }));

    const { data, error } = await db
      .from("xhs_accounts")
      .insert(insertData)
      .select("id, profile_url");

    if (error) {
      const msg = error.message || JSON.stringify(error);
      throw new Error(`插入新账号失败: ${msg}`);
    }

    (data as AccountRow[] | null)?.forEach((row) => {
      if (row.profile_url) {
        accountMap.set(row.profile_url, row.id);
        newCount++;
      }
    });
  }

  return { accountMap, newCount, existingCount };
}

