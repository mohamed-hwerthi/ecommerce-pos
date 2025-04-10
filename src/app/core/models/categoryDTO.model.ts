import { Media } from './media.model';

export interface CategoryDTO {
  id: number;
  name: string;
  description: string;
  medias: Media[];
}
