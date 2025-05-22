import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const expectedRoles = route.data['roles'] as Array<string>;
    
    // First check if we have a user from AuthService
    const user = this.authService.currentUser;
    if (user && expectedRoles.includes(user.role)) {
      return true;
    }
    
    // If no user from AuthService, check localStorage
    const userRole = localStorage.getItem('userRole');
    const adminToken = localStorage.getItem('adminToken');
    const teacherToken = localStorage.getItem('teacherToken');
    const studentToken = localStorage.getItem('studentToken');
    
    // Check for admin access
    if (expectedRoles.includes('admin') && userRole === 'admin' && adminToken) {
      return true;
    }
    
    // Check for teacher access
    if (expectedRoles.includes('teacher') && teacherToken) {
      return true;
    }
    
    // Check for student access
    if (expectedRoles.includes('student') && studentToken) {
      return true;
    }

    // Redirect unauthorized users
    this.router.navigate(['/auth']);
    return false;
  }
}
