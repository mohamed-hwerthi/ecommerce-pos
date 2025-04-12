import { animate, state, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Store, select } from '@ngrx/store';
import { ToastrService } from 'ngx-toastr';
import { Observable, map, share, take } from 'rxjs';
import { PaymentMethode } from 'src/app/core/models/paymentMethode.model';
import { ThemeService } from 'src/app/services/theme.service';
import { ButtonComponent } from 'src/app/shared/components/button/button.component';
import { MenuItem, OrderSubmission, User } from '../../../../../core/models';
import { selectCurrentUser } from '../../../../../core/state/auth/auth.selectors';
import { clearCart, removeItem } from '../../../../../core/state/shopping-cart/cart.actions';
import { selectCartItems } from '../../../../../core/state/shopping-cart/cart.selectors';
import { CartVisibilityService } from '../../../../../services/cart-visibility.service';
import { OrdersService } from '../../../../../services/orders.service';
import { LoaderComponent } from '../../../../../shared/components/loader/loader.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PaymentCreateModalComponent } from 'src/app/modules/admin/dashboard/components/payment/payment-create-modal/payment-create-modal.component';
import { PaymentDetails } from '../../../../admin/dashboard/components/payment/payment-create-modal/payment-create-modal.component';
import { FilterModalComponent } from 'src/app/modules/admin/dashboard/components/filter-modal/filter-modal.component';
import { environment } from 'src/environments/environment';
import { SharedService } from 'src/app/services/shared.service';

interface CartItem extends MenuItem {
  quantity: number;
}

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  standalone: true,
  imports: [CommonModule, LoaderComponent, FormsModule, ButtonComponent],
  providers: [DialogService],

  animations: [
    trigger('slideInOut', [
      state('in', style({ transform: 'translateX(0%)' })),
      state('out', style({ transform: 'translateX(100%)' })),
      transition('in <=> out', animate('400ms ease-in-out')),
    ]),
    trigger('backdropFade', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('visible <=> hidden', animate('1s ease-in-out')),
    ]),
  ],
})
export class CartComponent implements OnInit {
  currentUser$: Observable<User | null>;

  cartItems: CartItem[] = [];
  totalPrice: number = 0;
  showCart: boolean = false;
  isLoading: boolean = false;
  public themeMode = ['light', 'dark'];
  amountGivenByUser: number = 0;
  amountToChange!: number;
  allPaymentMethode!: PaymentMethode[];
  ref: DynamicDialogRef | undefined;
  paymentDetail!: PaymentDetails;
  isDisplayingOnlyBarCoes$!: Observable<boolean>;

  constructor(
    private readonly store: Store,
    public readonly cartVisibilityService: CartVisibilityService,
    private readonly ordersService: OrdersService,
    private readonly toastr: ToastrService,
    private readonly router: Router,
    public themeService: ThemeService,
    public dialogService: DialogService,
    public sharedService: SharedService,
  ) {
    this.isDisplayingOnlyBarCoes$! = sharedService.getIsBarcodeOnlyMode();
    // Workaround for quantity issues, this ensures proper total order value
    // Subscribe to the cart items
    this.store
      .select(selectCartItems)
      .pipe(
        map((items) => {
          // For each item from the store, checking if it's already in local cart
          return items.map((storeItem) => {
            const existingItem = this.cartItems.find((item) => item.id === storeItem.id);
            return {
              ...storeItem,
              // If it exists, keep its current quantity. If not, set quantity to 1.
              quantity: existingItem ? existingItem.quantity : 1,
            };
          }) as CartItem[]; // Cast the result as an array of CartItem
        }),
      )
      .subscribe((items) => {
        this.cartItems = items; // Update local cart items
        this.calculateTotalPrice(); // Recalculate the total price
      });
    this.currentUser$ = this.store.pipe(select(selectCurrentUser));
  }

  ngOnInit(): void {
    this.initialiseAllPaymentMethodes();
    this.cartVisibilityService.showCart$.subscribe((visible) => {
      this.showCart = visible;
    });
  }
  initialiseAllPaymentMethodes() {
    this.allPaymentMethode = Object.values(PaymentMethode);
  }

  toggleThemeMode() {
    this.themeService.theme.update((theme) => {
      const mode = !this.themeService.isDark ? 'dark' : 'light';
      return { ...theme, mode: mode };
    });
  }
  increaseQuantity(cartItem: CartItem): void {
    const item = this.cartItems.find((i) => i.id === cartItem.id);
    if (item) {
      item.quantity += 1;
      this.calculateTotalPrice();
    }
  }

  decreaseQuantity(cartItem: CartItem): void {
    if (cartItem.quantity > 1) {
      cartItem.quantity -= 1;
      this.calculateTotalPrice();
    }
  }

  calculateTotalPrice(): void {
    this.totalPrice = this.cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    this.amountToChange = this.totalPrice;
  }

  onQuantityChange(event: Event, cartItem: CartItem): void {
    const inputElement = event.target as HTMLInputElement;
    const quantity = inputElement.valueAsNumber;
    if (quantity && quantity > 0) {
      cartItem.quantity = quantity;
      this.calculateTotalPrice();
    }
  }

  placeOrder(): void {
    this.currentUser$.pipe(take(1)).subscribe((currentUser) => {
      if (!currentUser || typeof currentUser.id !== 'string') {
        this.toastr.error('User information is missing');
        this.isLoading = false; // Reset loading state in case of an error
        return;
      }

      this.isLoading = true;

      // Constructing order data with IDs instead of full objects
      const orderData: OrderSubmission = {
        userEmail: currentUser.email,
        menuItemQuantities: this.cartItems.reduce((acc, item) => {
          acc[item.id] = item.quantity;
          return acc;
        }, {} as { [menuItemId: number]: number }),
        createdOn: new Date().toISOString(),
        paid: false,
        status: 'PENDING',
      };

      this.ordersService.createOrder(orderData).subscribe({
        next: (order) => {
          this.toastr.success('Order placed successfully!');
          this.store.dispatch(clearCart());
          this.cartVisibilityService.toggleCart();
          this.router.navigate(['/orders']);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Failed to place an order', error);
          this.toastr.error('Failed to place an order');
          this.isLoading = false;
        },
      });
    });
  }

  removeItem(itemId: number): void {
    this.store.dispatch(removeItem({ itemId }));
  }

  openPaymentDialog() {
    const formattedTotalPrice = this.totalPrice.toFixed(2);
    this.ref = this.dialogService.open(PaymentCreateModalComponent, {
      width: '40vw',
      height: '40vh',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      styleClass: 'custom-red-dialog', // Correct way to pass CSS class

      data: {
        orderTotal: formattedTotalPrice,
      },
    });
    this.ref.onClose.subscribe((dialogPaymentData: PaymentDetails) => {
      if (dialogPaymentData) {
        this.paymentDetail = dialogPaymentData;
        console.log(dialogPaymentData);
      }
    });
  }

  OpenFilterDialog() {
    this.ref = this.dialogService.open(FilterModalComponent, {
      width: '35vw',
      height: '20vh',
      modal: true,
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      styleClass: 'custom-red-dialog', // Correct way to pass CSS clas
    });
    this.ref.onClose.subscribe((dialogPaymentData: PaymentDetails) => {
      if (dialogPaymentData) {
        this.paymentDetail = dialogPaymentData;
        console.log(dialogPaymentData);
      }
    });
  }

  getMenuItemImage(item: MenuItem): string {
    if (item.medias.length > 0) {
      return environment.apiStaticUrl + item.medias[0].url;
    } else {
      return '';
    }
  }
  toggleDisplayingOnlyBarCode() {
    this.isDisplayingOnlyBarCoes$.pipe(take(1)).subscribe((currentValue) => {
      this.sharedService.toggleBarcodeOnlyMode(!currentValue);
    });
  }
}
