import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SharedService {
  private readonly isBarcodeOnlyMode = new BehaviorSubject(true);

  constructor() {}

  toggleBarcodeOnlyMode(value: boolean): void {
    console.log(value);
    this.isBarcodeOnlyMode.next(value);
  }

  getIsBarcodeOnlyMode(): Observable<boolean> {
    return this.isBarcodeOnlyMode.asObservable();
  }
}
