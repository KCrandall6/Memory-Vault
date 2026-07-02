export type SelectedUploadFile = File | {
  name: string;
  path: string;
  type?: string;
  size?: number;
  lastModified?: number;
};
