// cart-visibility.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CartVisibilityService {
  private   readonly   showCartSubject = new BehaviorSubject<boolean>(true);
  showCart$ = this.showCartSubject.asObservable();

  constructor() {}

  toggleCart(): void {
    this.showCartSubject.next(!this.showCartSubject.value);
  }
}
