type DashboardSummary = {
  totalMedia: number;
  collectionsCount: number;
  peopleCount: number;
  tagsCount: number;
  mediaTypeCounts: Record<string, number>;
};

interface ElectronAPI {
  selectFiles: () => Promise<any[]>;
  saveMedia: (data: any) => Promise<{ success: boolean; mediaId?: number; error?: string }>;
  getMediaTypes: () => Promise<any[]>;
  getSourceTypes?: () => Promise<any[]>;
  getCollections: () => Promise<any[]>;
  getTags: () => Promise<any[]>;
  getPeople: () => Promise<any[]>;
  searchMedia: (criteria: any) => Promise<any[]>;
  getDashboardSummary: () => Promise<DashboardSummary>;
  getCollectionSummaries: () => Promise<any[]>;
  getCollectionMedia: (collectionId: number) => Promise<any[]>;
  getPeopleSummaries: () => Promise<any[]>;
  getPersonMedia: (personId: number) => Promise<any[]>;
  getTagSummaries: () => Promise<any[]>;
  getTagMedia: (tagId: number) => Promise<any[]>;
  getDateSummaries: () => Promise<any[]>;
  getDateMedia: (year: string) => Promise<any[]>;
  updateCollectionDetails: (payload: { id: number; name: string; description?: string }) => Promise<{ success: boolean; collection?: any; error?: string }>;
  deleteCollection: (id: number) => Promise<{ success: boolean; blocked?: boolean; mediaCount?: number; error?: string }>;
  deleteMedia: (id: number) => Promise<{ success: boolean; error?: string }>;
  getMediaDetails: (id: number) => Promise<any | null>;
  updateMediaDetails: (payload: any) => Promise<{ success: boolean; media?: any; error?: string }>;
  downloadMediaFile: (payload: { filePath: string; defaultFileName?: string }) =>
    Promise<{ success: boolean } | { success: boolean; canceled: boolean }>;
  getFilePreview?: (filePath: string) => Promise<{ dataUrl: string; mimeType: string } | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};