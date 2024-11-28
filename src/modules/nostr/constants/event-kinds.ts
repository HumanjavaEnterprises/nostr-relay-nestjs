export enum EventKind {
  SET_METADATA = 0,
  TEXT_NOTE = 1,
  RECOMMEND_SERVER = 2,
  CONTACT_LIST = 3,
  ENCRYPTED_DIRECT_MESSAGE = 4,
  DELETE = 5,
  REPOST = 6,
  REACTION = 7,
  BADGE_AWARD = 8,
  CHANNEL_CREATE = 40,
  CHANNEL_METADATA = 41,
  CHANNEL_MESSAGE = 42,
  CHANNEL_HIDE_MESSAGE = 43,
  CHANNEL_MUTE_USER = 44,
  REPORT = 1984,  // NIP-17 Report Event
  REPLACEABLE_FIRST = 10000,
  REPLACEABLE_LAST = 19999,
  EPHEMERAL_FIRST = 20000,
  EPHEMERAL_LAST = 29999,
  PARAMETERIZED_REPLACEABLE_FIRST = 30000,
  PARAMETERIZED_REPLACEABLE_LAST = 39999,
  
  // NIP-29 Group Chat Events
  GROUP_CREATE = 39000,
  GROUP_METADATA = 39001,
  GROUP_MESSAGE = 39002,
  GROUP_MEMBER_APPROVAL = 39003,
  GROUP_INVITE = 39004,
}
