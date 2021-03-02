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

export type Config = {
  title?: string;
  subtitle?: string;
  primaryColor?: string;
  accountId?: string;
  baseUrl?: string;
  greeting?: string;
  customerId?: string;
  newMessagePlaceholder?: string;
  emailInputPlaceholder?: string;
  newMessagesNotificationText?: string;
  companyName?: string;
  agentAvailableText?: string;
  agentUnavailableText?: string;
  showAgentAvailability?: boolean;
  defaultIsOpen?: boolean;
  requireEmailUpfront?: boolean;
  closeable?: boolean;
  mobile?: boolean;
  metadata?: string; // stringified CustomerMetadata JSON
  version?: string;
};
