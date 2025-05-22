import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';
import { CourseService } from '../../services/courses.service';
import { User } from '../../models/user.model';
import { Course } from '../../models/course.model';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';



@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule
  ]
})
export class HeaderComponent implements OnInit, OnDestroy {
  userName: string = '';
  isLoggedIn: boolean = false;
  userRole: string = '';
  currentUser: User | null = null;
  userCourses: Course[] = [];
  
  // Modal states
  showEditProfileModal = false;
  showCoursesModal = false;
  
  // User editing
  editedUser: User | null = null;
  
  private authSub: Subscription;
  private userDataSub: Subscription = new Subscription();

  constructor(
    private authService: AuthService, 
    private adminService: AdminService,
    private courseService: CourseService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    // Initialize auth subscription
    this.authSub = this.authService.authChanged$.subscribe(isAuth => {
      this.isLoggedIn = isAuth;
      if (isAuth) {
        this.loadUserData();
      } else {
        this.currentUser = null;
        this.userCourses = [];
      }
    });
  }
  
  ngOnInit(): void {
    // Check if user is already authenticated
    this.isLoggedIn = this.authService.isAuthenticated();
    if (this.isLoggedIn) {
      this.loadUserData();
    }
  }
  
  // Load user data and courses
  loadUserData(): void {
    // Get current user data
    this.currentUser = this.authService.currentUser;
    
    // Ensure we have user data
    if (this.currentUser) {
      this.userName = this.currentUser.name || '';
      this.userRole = this.currentUser.role || '';
      console.log('User data loaded:', this.userName, this.userRole);
      console.log('Current user:', this.currentUser);
      
      // Load user courses if user is logged in
      if (this.currentUser.id) {
        this.loadUserCourses(this.currentUser.id);
      }
    } else {
      console.warn('No user data available');
    }
  }
  
  // Handle edit profile button click
  handleEditProfile(): void {
    if (!this.currentUser) return;
    
    // Unsubscribe from any existing subscription
    this.userDataSub.unsubscribe();
    
    // Create a new subscription to get the latest user data
    this.userDataSub = this.authService.getUserData().subscribe((user: User | null) => {
      if (user) {
        // Create a proper copy with all required fields
        this.editedUser = {
          id: user.id,
          name: user.name || '',
          email: user.email || '',
          password: user.password || '',
          role: user.role || ''
        };
        console.log('User data loaded for editing:', this.editedUser);
      } else {
        // Fallback to current user if getUserData returns null
        if (this.currentUser) {
          this.editedUser = {
            id: this.currentUser.id,
            name: this.currentUser.name || '',
            email: this.currentUser.email || '',
            password: this.currentUser.password || '',
            role: this.currentUser.role || ''
          };
        }
        console.log('Using cached user data for editing');
      }
      this.showEditProfileModal = true;
    });
  }
  
  // Close edit profile modal
  closeEditProfileModal(): void {
    this.showEditProfileModal = false;
    this.editedUser = null;
  }
  
  // Save user changes
  saveUserChanges(): void {
    if (!this.editedUser || !this.editedUser.id) return;
    
    // Try to update using the AuthService first for the current user
    if (this.currentUser && this.currentUser.id === this.editedUser.id) {
      try {
        // Use the auth service's updateUser method which doesn't require admin privileges
        this.authService.updateUser({
          name: this.editedUser.name,
          email: this.editedUser.email,
          password: this.editedUser.password || undefined
        }).subscribe({
          next: (response) => {
            // Create updated user object
            const updatedUser: User = {
              id: this.editedUser!.id,
              name: this.editedUser!.name,
              email: this.editedUser!.email,
              role: this.editedUser!.role,
              password: ''
            };
            
            // Update current user
            this.currentUser = updatedUser;
            this.userName = updatedUser.name;
            this.userRole = updatedUser.role;
            
            // Update auth service user data
            this.authService.updateCurrentUser(updatedUser);
            
            console.log('User updated successfully via AuthService:', updatedUser);
            
            this.snackBar.open('Profile updated successfully', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            
            this.closeEditProfileModal();
            
            // Force reload user data to ensure UI is updated
            setTimeout(() => this.loadUserData(), 100);
          },
          error: (error) => {
            console.error('Error updating user via AuthService:', error);
            // Fall back to AdminService if AuthService update fails
            this.updateUserWithAdminService();
          }
        });
      } catch (error) {
        console.error('Exception in AuthService update:', error);
        // Fall back to AdminService if AuthService throws an exception
        this.updateUserWithAdminService();
      }
    } else {
      // Not the current user, use AdminService
      this.updateUserWithAdminService();
    }
  }
  
  // Helper method to update user with AdminService
  private updateUserWithAdminService(): void {
    if (!this.editedUser || !this.editedUser.id) return;
    
    this.adminService.updateUser(this.editedUser.id, this.editedUser).subscribe({
      next: (updatedUser) => {
        // Update current user if it's the same user
        if (this.currentUser && this.currentUser.id === updatedUser.id) {
          this.currentUser = updatedUser;
          this.userName = updatedUser.name;
          this.userRole = updatedUser.role;
          
          // Update auth service user data
          this.authService.updateCurrentUser(updatedUser);
        }
        
        console.log('User updated successfully via AdminService:', updatedUser);
        
        this.snackBar.open('Profile updated successfully', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        
        this.closeEditProfileModal();
        
        // Force reload user data to ensure UI is updated
        setTimeout(() => this.loadUserData(), 100);
      },
      error: (error) => {
        console.error('Error updating user via AdminService:', error);
        this.snackBar.open('Failed to update profile: ' + (error.message || 'Unknown error'), 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }
  
  // Handle view courses button click
  handleViewCourses(): void {
    if (!this.currentUser || !this.currentUser.id) return;
    
    this.loadUserCourses(this.currentUser.id);
    this.showCoursesModal = true;
  }
  
  // Close courses modal
  closeCoursesModal(): void {
    this.showCoursesModal = false;
  }
  
  // Handle delete account button click
  handleDeleteAccount(): void {
    if (!this.currentUser || !this.currentUser.id) return;
    
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      this.adminService.deleteUser(this.currentUser.id).subscribe({
        next: () => {
          this.snackBar.open('Account deleted successfully', 'Close', {
            duration: 3000
          });
          
          // Log out the user
          this.authService.logout();
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.snackBar.open('Failed to delete account', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.authSub.unsubscribe();
    this.userDataSub.unsubscribe();
  }

  // Load courses for the current user
  loadUserCourses(userId: number): void {
    this.courseService.getUserCourses(userId).subscribe({
      next: (courses) => {
        this.userCourses = courses;
      },
      error: (error) => {
        console.error('Error loading user courses:', error);
      }
    });
  }
  
  // Handle edit user event from user-profile component
  handleEditUser(user: User): void {
    if (!user) return;
    
    // If admin is editing their own profile or if user is editing their own profile
    if (this.userRole === 'admin' || (this.currentUser && this.currentUser.id === user.id)) {
      this.adminService.updateUser(user.id!, user).subscribe({
        next: (updatedUser) => {
          // Update current user if it's the same user
          if (this.currentUser && this.currentUser.id === updatedUser.id) {
            this.currentUser = updatedUser;
            // Update auth service user data
            this.authService.updateCurrentUser(updatedUser);
          }
          
          this.snackBar.open('Profile updated successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.snackBar.open('Failed to update profile', 'Close', {
            duration: 3000
          });
        }
      });
    } else {
      this.snackBar.open('You do not have permission to edit this profile', 'Close', {
        duration: 3000
      });
    }
  }
  
  // Handle delete user event from user-profile component
  handleDeleteUser(userId: number): void {
    if (!userId) return;
    
    // Only admins can delete accounts or users can delete their own accounts
    if (this.userRole === 'admin' || (this.currentUser && this.currentUser.id === userId)) {
      if (confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
        this.adminService.deleteUser(userId).subscribe({
          next: () => {
            this.snackBar.open('Account deleted successfully', 'Close', {
              duration: 3000
            });
            
            // If user deleted their own account, log them out
            if (this.currentUser && this.currentUser.id === userId) {
              this.authService.logout();
              this.router.navigate(['/login']);
            }
          },
          error: (error) => {
            console.error('Error deleting user:', error);
            this.snackBar.open('Failed to delete account', 'Close', {
              duration: 3000
            });
          }
        });
      }
    } else {
      this.snackBar.open('You do not have permission to delete this account', 'Close', {
        duration: 3000
      });
    }
  }
  
  // Handle view user courses event from user-profile component
  handleViewUserCourses(userId: number): void {
    if (!userId) return;
    
    this.loadUserCourses(userId);
  }


  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
