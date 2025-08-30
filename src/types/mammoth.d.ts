declare module 'mammoth' {
  export interface ExtractRawTextOptions {
    buffer?: Buffer;
    path?: string;
  }

  export interface ExtractRawTextResult {
    value: string;
    messages: any[];
  }

  export function extractRawText(options: ExtractRawTextOptions): Promise<ExtractRawTextResult>;
}
