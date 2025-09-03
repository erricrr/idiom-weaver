export enum Language {
  English = 'English',
  Spanish = 'Spanish',
  Vietnamese = 'Vietnamese',
  French = 'French',
  German = 'German',
  Japanese = 'Japanese',
  Portuguese = 'Portuguese',
  Dutch = 'Dutch',
}

export interface IdiomTranslation {
  idiom: string;
  literal_translation: string;
  explanation: string;
}

export type ApiResult = Record<string, IdiomTranslation>;
