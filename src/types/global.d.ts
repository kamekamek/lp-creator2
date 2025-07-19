// Global type declarations for testing and security

declare global {
  interface Window {
    gc?: () => void;
  }

  var DOMPurify: {
    sanitize: (html: string, options?: any) => string;
  };

  var jest: any;
}

export {};