/**
 * Link Repository Interface
 * Defines the contract for link data persistence
 */

import { Link } from '../entities/link.entity.js';
import { LinkType } from '@shared/constants/index.js';

export interface ILinkRepository {
  // Read operations
  findByLinkId(linkId: string): Promise<Link | null>;
  findByRoom(room: string): Promise<Link[]>;
  findByRoomAndType(room: string, linkType: LinkType): Promise<Link[]>;
  findByMobile(mobile: string): Promise<Link[]>;
  findExpired(): Promise<Link[]>;
  exists(linkId: string): Promise<boolean>;

  // Write operations
  create(link: Link): Promise<Link>;
  update(link: Link): Promise<Link>;
  delete(linkId: string): Promise<void>;
  deleteByRoom(room: string): Promise<void>;

  // Specific operations
  updateLocation(
    linkId: string,
    latitude: number,
    longitude: number,
    accuracy?: number
  ): Promise<void>;
  markAsUsed(linkId: string): Promise<void>;
  countByRoom(room: string): Promise<number>;
}
