export type User = {
  id: number;
  email: string;
  display_name?: string;
  full_name?: string;
  profile_photo_url?: string;
};

export type Message = {
  id?: string;
  body: string;
  sent_at?: string;
  seen_at?: string;
  created_at?: string;
  customer_id?: string;
  conversation_id?: string;
  user_id?: number;
  user?: User;
  type?: 'bot' | 'agent' | 'customer';
  file_ids?: Array<string>;
  attachments?: Array<Attachment>;
};

export type Attachment = {
  id: string;
  filename: string;
  file_url: string;
  content_type: string;
};

export type CustomerMetadata = {
  name: string;
  email: string;
  external_id: string;
  metadata?: {[key: string]: any};
  // TODO: include browser info
  host?: string;
  pathname?: string;
  current_url?: string;
  browser?: string;
  os?: string;
  ip?: string;
  time_zone?: string;
};
