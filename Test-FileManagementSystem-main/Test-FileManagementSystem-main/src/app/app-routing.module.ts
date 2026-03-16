import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { FileListComponent } from './components/file-list/file-list.component';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { FileDetailsComponent } from './components/file-details/file-details.component'; // <-- import this
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
// Public landing page
{ path: '', component: DashboardComponent },

// Auth pages (accessible only if NOT logged in)
{ path: 'login', component: LoginComponent },
{ path: 'register', component: RegisterComponent },

// Protected pages (files and upload require login)
{ path: 'files', component: FileListComponent, canActivate: [AuthGuard] },
{ path: 'files/:id', component: FileDetailsComponent, canActivate: [AuthGuard] }, // <-- added route
{ path: 'upload', component: FileUploadComponent, canActivate: [AuthGuard] },

// Catch-all: redirect unknown routes to dashboard
{ path: '**', redirectTo: '', pathMatch: 'full' }
];

@NgModule({
imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}