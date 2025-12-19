/**
 * Supabase 数据库类型定义
 */

export interface Database {
  public: {
    Tables: {
      xhs_accounts: {
        Row: {
          id: string;
          xhs_id: string | null;
          xhs_user_id: string | null;
          nickname: string;
          avatar: string | null;
          profile_url: string | null;
          account_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          xhs_id?: string | null;
          xhs_user_id?: string | null;
          nickname: string;
          avatar?: string | null;
          profile_url?: string | null;
          account_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          xhs_id?: string | null;
          xhs_user_id?: string | null;
          nickname?: string;
          avatar?: string | null;
          profile_url?: string | null;
          account_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      xhs_posts: {
        Row: {
          id: string;
          account_id: string | null;
          platform: string;
          title: string | null;
          content: string | null;
          post_url: string | null;
          post_id: string | null;
          cover_url: string | null;
          note_type: string | null;
          publish_time: string | null;
          status: string | null;
          interactions: number;
          likes: number;
          favorites: number;
          comments: number;
          shares: number;
          data_period: string | null;
          image_count: number;
          merge_image: string | null;
          merge_image_thumbnail: string | null;
          card_image_thumbnail: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          account_id?: string | null;
          platform?: string;
          title?: string | null;
          content?: string | null;
          post_url?: string | null;
          post_id?: string | null;
          cover_url?: string | null;
          note_type?: string | null;
          publish_time?: string | null;
          status?: string | null;
          interactions?: number;
          likes?: number;
          favorites?: number;
          comments?: number;
          shares?: number;
          data_period?: string | null;
          image_count?: number;
          merge_image?: string | null;
          merge_image_thumbnail?: string | null;
          card_image_thumbnail?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          account_id?: string | null;
          platform?: string;
          title?: string | null;
          content?: string | null;
          post_url?: string | null;
          post_id?: string | null;
          cover_url?: string | null;
          note_type?: string | null;
          publish_time?: string | null;
          status?: string | null;
          interactions?: number;
          likes?: number;
          favorites?: number;
          comments?: number;
          shares?: number;
          data_period?: string | null;
          image_count?: number;
          merge_image?: string | null;
          merge_image_thumbnail?: string | null;
          card_image_thumbnail?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      zip_upload_tasks: {
        Row: {
          id: string;
          name: string;
          status: "processing" | "completed" | "failed";
          total_units: number;
          processed_units: number;
          matched_posts: number;
          unmatched_count: number;
          file_structure: FileTreeNode | null;
          result_summary: TaskResultSummary | null;
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          status?: "processing" | "completed" | "failed";
          total_units?: number;
          processed_units?: number;
          matched_posts?: number;
          unmatched_count?: number;
          file_structure?: FileTreeNode | null;
          result_summary?: TaskResultSummary | null;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          status?: "processing" | "completed" | "failed";
          total_units?: number;
          processed_units?: number;
          matched_posts?: number;
          unmatched_count?: number;
          file_structure?: FileTreeNode | null;
          result_summary?: TaskResultSummary | null;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
          updated_at?: string;
        };
      };
      post_images: {
        Row: {
          id: string;
          post_id: string | null;
          xhs_post_id: string;
          task_id: string | null;
          image_order: number;
          original_name: string | null;
          storage_path: string;
          storage_url: string | null;
          thumbnail_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id?: string | null;
          xhs_post_id: string;
          task_id?: string | null;
          image_order?: number;
          original_name?: string | null;
          storage_path: string;
          storage_url?: string | null;
          thumbnail_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string | null;
          xhs_post_id?: string;
          task_id?: string | null;
          image_order?: number;
          original_name?: string | null;
          storage_path?: string;
          storage_url?: string | null;
          thumbnail_url?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

// ===== 文件树节点类型 =====
export interface FileTreeNode {
  name: string;
  type: "folder" | "file";
  path: string;
  children?: FileTreeNode[];
  // 文件特有属性
  mimeType?: string;
  size?: number;
  previewUrl?: string;
}

// ===== 任务结果摘要 =====
export interface TaskResultSummary {
  totalUnits: number;
  matchedPosts: number;
  unmatchedPosts: number;
  totalImages: number;
  processingTime: number;
  unmatchedPostIds?: string[];
  // 上传统计（优化版新增）
  uploadedImages?: number;
  failedImages?: number;
  // 卡片生成统计
  generatedCards?: number;
  failedCards?: number;
  // 拼图生成统计
  generatedMerges?: number;
  failedMerges?: number;
}

// 便捷类型别名
export type XHSAccount = Database["public"]["Tables"]["xhs_accounts"]["Row"];
export type XHSAccountInsert = Database["public"]["Tables"]["xhs_accounts"]["Insert"];
export type XHSPost = Database["public"]["Tables"]["xhs_posts"]["Row"];
export type XHSPostInsert = Database["public"]["Tables"]["xhs_posts"]["Insert"];
export type ZipUploadTask = Database["public"]["Tables"]["zip_upload_tasks"]["Row"];
export type ZipUploadTaskInsert = Database["public"]["Tables"]["zip_upload_tasks"]["Insert"];
export type PostImage = Database["public"]["Tables"]["post_images"]["Row"];
export type PostImageInsert = Database["public"]["Tables"]["post_images"]["Insert"];

