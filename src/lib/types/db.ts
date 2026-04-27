// Elle yazılmış minimal tip tanımları. Gerçek bir projede `supabase gen types typescript`
// ile schema.sql'den otomatik üretilebilir.

export type RoomRole = "owner" | "admin" | "member";
export type AttachmentType = "image" | "audio" | "file";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

export interface PostLike {
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  is_private: boolean;
  max_members: number;
  created_at: string;
}

export interface RoomMember {
  room_id: string;
  user_id: string;
  role: RoomRole;
  joined_at: string;
}

export interface Message {
  id: string;
  room_id: string;
  author_id: string;
  content: string | null;
  attachment_url: string | null;
  attachment_type: AttachmentType | null;
  created_at: string;
}

export interface UserPresence {
  user_id: string;
  is_online: boolean;
  last_seen_at: string;
}

type Insertable<T, Optional extends keyof T = never> = Omit<T, Optional> &
  Partial<Pick<T, Optional>>;

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Insertable<Profile, "created_at" | "display_name" | "avatar_url" | "bio">;
        Update: Partial<Profile>;
      };
      posts: {
        Row: Post;
        Insert: Insertable<Post, "id" | "created_at" | "image_url">;
        Update: Partial<Post>;
      };
      post_likes: {
        Row: PostLike;
        Insert: Insertable<PostLike, "created_at">;
        Update: Partial<PostLike>;
      };
      post_comments: {
        Row: PostComment;
        Insert: Insertable<PostComment, "id" | "created_at">;
        Update: Partial<PostComment>;
      };
      rooms: {
        Row: Room;
        Insert: Insertable<
          Room,
          "id" | "created_at" | "is_private" | "max_members" | "description"
        >;
        Update: Partial<Room>;
      };
      room_members: {
        Row: RoomMember;
        Insert: Insertable<RoomMember, "joined_at" | "role">;
        Update: Partial<RoomMember>;
      };
      messages: {
        Row: Message;
        Insert: Insertable<
          Message,
          "id" | "created_at" | "content" | "attachment_url" | "attachment_type"
        >;
        Update: Partial<Message>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      room_role: RoomRole;
      attachment_type: AttachmentType;
    };
  };
};
