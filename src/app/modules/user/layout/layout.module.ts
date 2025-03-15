import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserLayoutRoutingModule } from './layout-routing.module';
import { MenuComponent } from '../pages/menu/menu.component';


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    UserLayoutRoutingModule , 
    
  ]
})
export class LayoutModule { }
