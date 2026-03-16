import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  constructor(private router: Router, private auth: AuthService) {}

  navigateTo(target: '/upload' | '/files', event?: Event): void {
    event?.preventDefault();
    if (this.auth.isAuthenticated()) {
      this.router.navigate([target]);
      return;
    }

    this.router.navigate(['/login'], { queryParams: { returnUrl: target } });
  }
}
