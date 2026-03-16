import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
selector: 'app-navbar',
templateUrl: './navbar.component.html',
styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {

// Tracks whether the user is logged in
isLoggedIn: boolean = false;

constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    // Subscribe to login/logout events
    this.auth.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/']); // redirect to dashboard after logout
  }
}