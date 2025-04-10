import { CategoryDTO } from './categoryDTO.model';
import { Media } from './media.model';

export interface MenuItem {
  id: number;
  title: string;
  description: string;
  price: number;
  imageUrl: URL;
  salesCount: number;
  categories: CategoryDTO[];
  reviewCount: number;
  averageRating: number;
  medias: Media[];
}

export interface PaginatedResponseDTO<T> {
  items: T[];
  totalCount: number;
}
