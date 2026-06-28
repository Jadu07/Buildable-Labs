export interface User {
  id: string;
  email: string;
  name: string | null;
  color: string | null;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type Role = 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER' | 'CONTRIBUTOR';

export interface Collaborator {
  id: string;
  documentId: string;
  userId: string;
  role: Role;
  joinedAt: string;
  user: Pick<User, 'id' | 'name' | 'email'>;
}

export interface Document {
  id: string;
  title: string;
  content: any;
  isPublic: boolean;
  publicRole: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: Pick<User, 'id' | 'name' | 'email'>;
  collaborators: Collaborator[];
}
