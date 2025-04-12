import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { debounceTime, distinctUntilChanged, map, Observable, Subscription, switchMap, take } from 'rxjs';

import { CustomToasterService } from 'src/app/services/custom-toaster.service';
import { MenuItem, PaginatedResponseDTO } from '../../../../core/models';
import {
  selectIsCreateReviewUserModalOpen,
  selectIsUserReviewsModalOpen,
} from '../../../../core/state/modal/review/modal.selectors';
import { MenuItemsService } from '../../../../services/menuItems.service';
import { LoaderComponent } from '../../../../shared/components/loader/loader.component';
import { FoodCardComponent } from './food-card/food-card.component';
import { FoodCategoryComponent } from './food-category/food-category.component';
import { SubmitUserReviewModal } from './submit-review-modal/submit-review-modal.component';
import { UserReviewsModalComponent } from './user-reviews-modal/user-reviews-modal.component';
import { selectCartItems } from 'src/app/core/state/shopping-cart/cart.selectors';
import { ToastrService } from 'ngx-toastr';
import { addItem } from 'src/app/core/state/shopping-cart/cart.actions';
import { observableToBeFn } from 'rxjs/internal/testing/TestScheduler';
import { SharedService } from 'src/app/services/shared.service';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [
    CommonModule,
    FoodCardComponent,
    FoodCategoryComponent,
    LoaderComponent,
    SubmitUserReviewModal,
    UserReviewsModalComponent,
    FormsModule,
  ],
  templateUrl: './menu.component.html',
})
export class MenuComponent implements OnInit, OnDestroy {
  @ViewChild('menuItemsContainer') menuItemsContainer?: ElementRef;
  isDisplayingOnlyBarCoes$!: Observable<boolean>;
  allMenuItems: MenuItem[] = [];
  displayMenuItems: MenuItem[] = [];
  isLoading = true;
  selectedCategory!: number;
  lastCategory!: number;
  itemsPerPage = 6; // Number of items to load
  currentPage = 1;
  showSubmitReviewModal$!: Observable<boolean>;
  showUserReviewsModal$!: Observable<boolean>;

  private queryParamsSubscription!: Subscription;
  private reviewNotificationSubscription!: Subscription;
  barCode?: string;
  seachInput: string = '';

  constructor(
    private readonly menuItemsService: MenuItemsService,
    private readonly route: ActivatedRoute,
    private readonly store: Store,
    private readonly menuItemService: MenuItemsService,
    private readonly customToasterService: CustomToasterService,
    private readonly toastr: ToastrService,
    private readonly sharedService: SharedService,
  ) {
    this.isDisplayingOnlyBarCoes$ = this.sharedService.getIsBarcodeOnlyMode();
  }

  ngOnInit(): void {
    this.showSubmitReviewModal$ = this.store.select(selectIsCreateReviewUserModalOpen);
    this.showUserReviewsModal$ = this.store.select(selectIsUserReviewsModalOpen);

    // Listen for any changes in the URL query parameters
    this.queryParamsSubscription = this.route.queryParams
      .pipe(
        debounceTime(300), // Debounce to avoid rapid consecutive fetches
        distinctUntilChanged(), // Only fetch if there is a change in category
        switchMap((params) => {
          const category = params['category'];
          const categoryChanged = this.selectedCategory !== category;

          // Update selected category and fetch items if necessary
          if (categoryChanged || !this.allMenuItems.length) {
            this.selectedCategory = category;
            return this.menuItemsService.getAllMenuItems(1, 100);
          } else {
            return [];
          }
        }),
      )
      .subscribe({
        next: (response: PaginatedResponseDTO<MenuItem>) => {
          if (response.items) {
            this.allMenuItems = response.items;
            this.filterItemsByCategory();
            this.isLoading = false;
          }
        },
        error: (error) => {
          this.isLoading = false;
        },
      });

    // Listen for review submission notifications
    this.reviewNotificationSubscription = this.menuItemsService.reviewSubmitted$.subscribe(() => {
      this.fetchMenuItems(true);
    });
  }

  fetchMenuItems(forceFetch: boolean = false): void {
    if (!this.allMenuItems.length || forceFetch) {
      // Check if items have already been fetched or force fetching
      this.isLoading = true;
      this.menuItemsService.getAllMenuItems(1, 100).subscribe({
        next: (response: PaginatedResponseDTO<MenuItem>) => {
          this.allMenuItems = response.items; // Saving all items then only filter based on selected category
          // Filter immediately after fetching based on the selected category
          this.filterItemsByCategory();
          this.isLoading = false;
        },
        error: (error) => {
          this.isLoading = false;
        },
      });
    } else {
      this.filterItemsByCategory(); // Filter existing items if they've already been fetched
    }
  }

  filterItemsByCategory(): void {
    // w/o this, while changing categories displayItems count will be same until page refresh
    if (this.lastCategory !== this.selectedCategory) {
      // Reset currentPage if the category has changed
      this.currentPage = 1;
      this.lastCategory = this.selectedCategory;
    }
    let filteredItems: any;
    if (this.selectedCategory) {
      filteredItems = this.allMenuItems.filter((item) =>
        item.categories.some((category) => category.id == this.selectedCategory),
      );
    } else {
      filteredItems = this.allMenuItems;
    }

    // Only show items up to the current page
    //creates a new array rather than mutating it
    this.displayMenuItems = [...filteredItems.slice(0, this.currentPage * this.itemsPerPage)];
  }
  @HostListener('window:scroll', ['$event'])
  onWindowScroll(): void {
    // Calculate the distance from the top of the page to the bottom of the viewport
    const distanceFromTopToBottom = window.innerHeight + window.scrollY;
    // Calculate the threshold for triggering the event (95% of the document height)
    const scrollThreshold = document.body.offsetHeight * 0.95;

    // Check if we're at 95% of the bottom of the page
    if (distanceFromTopToBottom >= scrollThreshold) {
      this.loadMoreItems();
    }
  }

  loadMoreItems(): void {
    this.currentPage++;
    this.filterItemsByCategory();
  }
  filterMenuItemsByBarCode() {
    if (this.barCode) {
      this.menuItemService.filterMenuItemsByBarCode(this.barCode).subscribe({
        next: (res) => {
          this.addToCart(res);
          this.displayMenuItems = [res];
        },
        error: (err: { error: string; status: string }) => {
          if (err.status === '404') {
            this.customToasterService.handelErrorToaster('TOASTER_MESSAGE.AUCUN_MENU_ITEM_TROUVE_POUR_CE_BARCODE');
          } else {
            this.customToasterService.handelErrorToaster('HTTP_ERROR_MESSAGES.ENEXPECTED_ERROR');
          }
        },
      });
    }
  }

  searchByQuery() {
    if (this.seachInput) {
      this.menuItemService.filterMenuItemsByQuery(this.seachInput).subscribe({
        next: (res) => {
          this.displayMenuItems = res.items;
        },
        error: (err) => {
          this.customToasterService.handelErrorToaster('HTTP_ERROR_MESSAGES.ENEXPECTED_ERROR');
        },
      });
    } else {
      this.loadMoreItems();
    }
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    this.queryParamsSubscription?.unsubscribe();
    this.reviewNotificationSubscription?.unsubscribe();
  }
  addToCart(item: MenuItem): void {
    this.store
      .select(selectCartItems)
      .pipe(
        take(1), // Take the first item only and automatically unsubscribe, prevents duplicates in cart
        map((items: MenuItem[]) => {
          const exists = items.some((existingItem) => existingItem.id === item.id);
          if (exists) {
            this.toastr.info('Item is already added', '', {
              positionClass: 'custom-toast-top-right',
            });
          } else {
            this.toastr.success('Item added to cart!', '', {
              positionClass: 'custom-toast-top-right',
            });
            this.store.dispatch(addItem({ item }));
          }
        }),
      )
      .subscribe();
  }
}
