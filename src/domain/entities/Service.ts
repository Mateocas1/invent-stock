/**
 * Service Entity
 *
 * Represents a service offered by the salon.
 */

export interface Service {
  id: string;
  name: string;
  category: string;
  isActive: boolean;
  createdAt: Date;
}

export interface CreateServiceInput {
  name: string;
  category: string;
}

export interface UpdateServiceInput {
  name?: string;
  category?: string;
  isActive?: boolean;
}
