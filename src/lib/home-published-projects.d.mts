export interface PublishedProject {
  id: string;
  title: string;
  href: string;
  group: string;
  dek: string;
  image: string | null;
  publishedAt: string | null;
  publication: {
    state: 'verified-live'; commit: string; canonical: string;
    immutable: string; verifiedAt: string; receipt: string;
  };
  sources: { url: string; title: string; checkedAt: string }[];
  imageRights: {
    status: 'not-used' | 'original' | 'existing-published-asset' | 'licensed' | 'public-domain' | 'permission-granted';
    source: string | null; license: string | null; checkedAt: string | null;
  };
}
export const POINTCAST_PUBLIC_ORIGIN: 'https://pointcast.xyz';
export function isSafeProjectHref(href: unknown): boolean;
export function isUtcProjectTimestamp(value: unknown): boolean;
export function isPublicProjectSource(value: unknown): boolean;
export function isVerifiedPublishedProject(project: unknown): project is PublishedProject;
export function getPublishedProjects(catalog: unknown): PublishedProject[];
export function makeProjectPanels(projects: PublishedProject[], panelSize?: number): PublishedProject[][];
export function groupPublishedProjects(projects: PublishedProject[]): { name: string; entries: PublishedProject[] }[];
export function publishedCatalog(catalog: unknown): { version: number; title: string; url: string; total: number; projects: PublishedProject[] };
