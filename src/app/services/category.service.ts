import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BaseService } from './base.service';
import { PaginatedResponseDTO } from '../core/models';
import { CategoryDTO } from '../core/models/categoryDTO.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService extends BaseService {
  private readonly baseUrl = `${environment.apiUrl}/categories`;
  private readonly categoryCreatedSource = new BehaviorSubject<CategoryDTO | null>(null);
  private readonly categoryUpdateSource = new BehaviorSubject<CategoryDTO | null>(null);
  private readonly categoryDeleteSource = new BehaviorSubject<number | undefined | null>(null);

  constructor(http: HttpClient, router: Router, toastr: ToastrService) {
    super(http, router, toastr);
  }
  categortyCreated$ = this.categoryCreatedSource.asObservable();
  categoryUpdated$ = this.categoryUpdateSource.asObservable();
  categoryDeleted$ = this.categoryDeleteSource.asObservable();

  onCategoryCreated(category: CategoryDTO) {
    this.categoryCreatedSource.next(category);
  }
  onCategoryUpdated(category: CategoryDTO) {
    this.categoryUpdateSource.next(category);
  }
  onCategoryDeleted(categoryId?: number | null) {
    this.categoryDeleteSource.next(categoryId);
  }

  findAllCategories(): Observable<CategoryDTO[]> {
    return this.get<CategoryDTO[]>(this.baseUrl);
  }

  findAllCategoriesWithPagination(page: number, limit: number): Observable<PaginatedResponseDTO<CategoryDTO>> {
    return this.get<PaginatedResponseDTO<CategoryDTO>>(this.baseUrl + '/pageable');
  }

  findCategoryById(id: number): Observable<CategoryDTO> {
    return this.get<CategoryDTO>(`${this.baseUrl}/${id}`);
  }

  createCategory(category: CategoryDTO): Observable<CategoryDTO> {
    return this.post<CategoryDTO>(this.baseUrl, category).pipe(
      tap((result: CategoryDTO) => this.onCategoryCreated(result)),
    );
  }

  updateCategory(id: number, category: CategoryDTO): Observable<CategoryDTO> {
    return this.put<CategoryDTO>(`${this.baseUrl}/${id}`, category).pipe(
      tap((result) => this.onCategoryUpdated(result)),
    );
  }

  deleteCategory(menuItemId: number): Observable<void> {
    return this.delete<void>(`${this.baseUrl}/${menuItemId}`).pipe(tap(() => this.onCategoryDeleted(menuItemId)));
  }
}
