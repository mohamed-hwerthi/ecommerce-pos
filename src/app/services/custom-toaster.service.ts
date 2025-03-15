import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class CustomToasterService {

  constructor(private readonly toaster : ToastrService , private readonly translateService: TranslateService) { }


  handelSuccessToaster(translatedMessageKey:string) {
    this.toaster.success(this.translateService.instant(translatedMessageKey));
  }
  handelErrorToaster(translatedMessageKey:string){
    this.toaster.error(this.translateService.instant(translatedMessageKey));
  }
  handelInfoToaster(translatedMessageKey:string){
    this.toaster.info(this.translateService.instant(translatedMessageKey));
  }
}
