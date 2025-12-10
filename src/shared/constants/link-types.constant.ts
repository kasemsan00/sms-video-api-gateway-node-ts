/**
 * Link type constants
 */

export enum LinkType {
  VIDEO = 'video',
  LOCATION = 'location',
}

export const LINK_TYPE_VALUES = Object.values(LinkType) as string[];

/**
 * Check if a value is a valid LinkType
 */
export const isValidLinkType = (value: unknown): value is LinkType => {
  return typeof value === 'string' && LINK_TYPE_VALUES.includes(value);
};
