import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { OverviewComponent } from "../../admin/dashboard/pages/overview/overview.component";
import { CartComponent } from './components/cart/cart.component';
import { FooterComponent } from './components/footer/footer.component';
import { NavbarComponent } from './components/navbar/navbar.component';


@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  standalone: true,
  imports: [RouterOutlet, CommonModule, NavbarComponent, FooterComponent, CartComponent, OverviewComponent],
})
export class LayoutComponent {}
