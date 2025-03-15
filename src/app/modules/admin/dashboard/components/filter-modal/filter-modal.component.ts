import { Component } from '@angular/core';



export interface  filterMenuitemPayload{
  searchInput:string  , 
  barCode:string
}
@Component({
  selector: 'app-filter-modal',
  standalone: true,
  imports: [],
  templateUrl: './filter-modal.component.html',
  styleUrl: './filter-modal.component.scss'
})
export class FilterModalComponent {

closeModal() {
throw new Error('Method not implemented.');
}
submitFilterModalData() {
throw new Error('Method not implemented.');
}

}
