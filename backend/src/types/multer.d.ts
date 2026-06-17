declare module 'multer' {
  export function diskStorage(options: {
    destination: string;
    filename: (
      request: unknown,
      file: { mimetype: string },
      callback: (error: Error | null, filename: string) => void,
    ) => void;
  }): unknown;
}
