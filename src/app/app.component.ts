import { Component, OnInit } from '@angular/core';
import { ThemeService } from './services/theme.service';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { CommonModule, NgClass } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable, filter } from 'rxjs';
import { selectIsLoading } from './core/state/auth/auth.selectors';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { PrimeNGConfig } from 'primeng/api';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: true,
  imports: [NgClass, RouterOutlet, CommonModule,   TranslateModule],
})
export class AppComponent  implements OnInit {
  title = 'Food Squad';
  isLoading$: Observable<boolean>;

  constructor(
    public themeService: ThemeService,
    private  readonly store: Store,
    private  readonly   router: Router,
    private  readonly  translate: TranslateService , 
    private readonly primengConfig: PrimeNGConfig
  ) {
    this.isLoading$ = this.store.select(selectIsLoading);
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      window.scrollTo(0, 0);
    });

      // Load the saved language preference from local storage
      const savedLang = localStorage.getItem('selectedLanguage');
      if (savedLang) {
        this.translate.use(savedLang);
      } else {
        // Default language if no saved preference
        this.translate.setDefaultLang('en');
      }
  }
  ngOnInit(): void {
    this.primengConfig.ripple = true;
  }
}
