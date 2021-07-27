export type CustomerMetadata = {
  name?: string;
  email?: string;
  external_id?: string;
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

export type Account = {
  id: string;
  company_name: string;
  current_minutes_since_midnight: number;
  is_outside_working_hours?: boolean;
  subscription_plan?: string;
  time_zone?: string;
};

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
  quick_replies?: Array<any>;
  metadata?: any;
};

export type Attachment = {
  id: string;
  filename: string;
  file_url: string;
  content_type: string;
};

export type WidgetSettings = {
  id?: string;
  subtitle?: string;
  title?: string;
  base_url?: string;
  color?: string;
  greeting?: string;
  new_message_placeholder?: string;
  email_input_placeholder?: string;
  new_messages_notification_text?: string;
  is_branding_hidden?: boolean;
  show_agent_availability?: boolean;
  agent_available_text?: string;
  agent_unavailable_text?: string;
  require_email_upfront?: boolean;
  is_open_by_default?: boolean;
  custom_icon_url?: string;
  iframe_url_override?: string;
  icon_variant?: 'outlined' | 'filled';
  account?: Account;
};

export type QuickReply = {
  text: string;
  action: string;
};
