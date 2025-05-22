import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { AdminService } from '../../services/admin.service';
import { Course } from '../../models/course.model';
import { Lesson } from '../../models/lesson.model';
import { User } from '../../models/user.model';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { UserProfileComponent } from '../user-profile/user-profile.component';
import { CourseService } from '../../services/courses.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatSelectModule,
    UserProfileComponent
  ]
})
export class AdminComponent implements OnInit {
  users: User[] = [];
  userColumns: string[] = ['id', 'name', 'email', 'role', 'actions'];
  
  // Selected items
  selectedUser: User | null = null;
  
  // New items
  newUser: User = { id: 0, name: '', email: '', password: '', role: 'student' };
  
  // Modal visibility
  showAddUserModal = false;
  showEditUserModal = false;
  showTeacherLoginModal = false;
  
  // Teacher login
  teacherCredentials = { email: '', password: '' };
  teacherLoginError = '';

  // Loading state
  isLoading = false;
  
  // Floating button
  showFloatingButton = false;

  // Properties for user profile component
  currentAdminUser: User | null = null;
  selectedUserCourses: Course[] = [];

  constructor(
    private adminService: AdminService,
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private courseService: CourseService
  ) {}

  @HostListener('window:scroll')
  onWindowScroll() {
    // Show floating button when scrolled down
    this.showFloatingButton = window.scrollY > 300;
  }

  ngOnInit(): void {
    this.checkAdminToken();
    this.fetchUsers();
    this.loadCurrentAdminUser();
  }

  // Load the current admin user for the profile component
  loadCurrentAdminUser(): void {
    const currentUser = this.authService.currentUser;
    if (currentUser && currentUser.id) {
      this.adminService.getUserById(currentUser.id).subscribe({
        next: (user) => {
          this.currentAdminUser = user;
        },
        error: (error) => {
          console.error('Error loading admin user:', error);
        }
      });
    }
  }

  // Check if admin token exists
  checkAdminToken(): void {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      this.router.navigate(['/login']);
    }
  }

  // Open teacher login modal
  openTeacherLoginModal(): void {
    this.teacherCredentials = { email: '', password: '' };
    this.teacherLoginError = '';
    this.showTeacherLoginModal = true;
  }

  // Close teacher login modal
  closeTeacherLoginModal(): void {
    this.showTeacherLoginModal = false;
  }

  // Login as teacher
  loginAsTeacher(): void {
    this.isLoading = true;
    this.teacherLoginError = '';
    
    // Log the credentials being sent
    console.log('Attempting teacher login with:', {
      email: this.teacherCredentials.email,
      password: '********' // Don't log actual password
    });
    
    this.authService.auth(this.teacherCredentials).subscribe({
      next: (response: { token: string; role: string; user?: any }) => {
        console.log('Login response:', response);
        
        // Check if the user is a teacher
        if (response.role === 'teacher') {
          // Store teacher token
          localStorage.setItem('teacherToken', response.token);
          
          // Close modal and navigate to teacher dashboard
          this.showTeacherLoginModal = false;
          this.isLoading = false;
          this.snackBar.open('Logged in as teacher successfully!', '', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          
          // Navigate to teacher dashboard
          this.router.navigate(['/management']);
        } else {
          this.isLoading = false;
          this.teacherLoginError = 'The provided credentials are not for a teacher account.';
        }
      },
      error: (error: HttpErrorResponse) => {
        console.error('Login error:', error);
        this.isLoading = false;
        this.teacherLoginError = error.error?.message || 'Invalid email or password';
      }
    });
  }


  // Fetch all users from the API
  fetchUsers(): void {
    this.adminService.getUsers().subscribe({
      next: (data) => {
        this.users = data;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Error fetching users:', error);
        this.snackBar.open(`Error fetching users: ${error.error?.message || 'Unknown error'}`, '', {
          duration: 10000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  // Open the edit user modal
  openEditUserModal(user: User): void {
    this.selectedUser = { ...user };
    this.showEditUserModal = true;
  }

  // Close the edit user modal
  closeEditUserModal(): void {
    this.showEditUserModal = false;
    this.selectedUser = null;
  }

  // Update a user's information
  updateUser(): void {
    if (this.selectedUser && this.selectedUser.id) {
      // Create a new object without password if it's empty
      const userToUpdate: Partial<User> = {
        id: this.selectedUser.id,
        name: this.selectedUser.name,
        email: this.selectedUser.email,
        role: this.selectedUser.role
      };
      
      // Only include password if it's not empty
      if (this.selectedUser.password) {
        userToUpdate.password = this.selectedUser.password;
      }
      
      this.adminService.updateUser(this.selectedUser.id, userToUpdate).subscribe(
        () => {
          this.showEditUserModal = false;
          this.selectedUser = null;
          this.fetchUsers();
          this.snackBar.open('User updated successfully!', '', {
            duration: 10000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        },
        error => this.snackBar.open(`Error updating user: ${error.error?.message || 'Unknown error'}`, '', {
          duration: 10000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        })
      );
    }
  }

  // Delete a user
  deleteUser(userId: number): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.adminService.deleteUser(userId).subscribe({
        next: () => {
          this.users = this.users.filter(user => user.id !== userId);
          this.snackBar.open('User deleted successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          this.snackBar.open('Failed to delete user', 'Close', {
            duration: 3000
          });
        }
      });
    }
  }
  
  // Handler methods for user profile component
  handleEditUser(user: User): void {
    this.selectedUser = { ...user };
    this.updateUser();
  }
  
  handleDeleteUser(userId: number): void {
    this.deleteUser(userId);
  }
  
  handleViewUserCourses(userId: number): void {
    this.fetchUserCourses(userId);
  }
  
  // Fetch courses for a specific user
  fetchUserCourses(userId: number): void {
    this.courseService.getUserCourses(userId).subscribe({
      next: (courses) => {
        this.selectedUserCourses = courses;
      },
      error: (error) => {
        console.error('Error fetching user courses:', error);
        this.snackBar.open('Failed to load user courses', 'Close', {
          duration: 3000
        });
      }
    });
  }

  // Open the add user modal
  openAddUserModal(): void {
    this.newUser = { id: 0, name: '', email: '', password: '', role: 'student' };
    this.showAddUserModal = true;
  }

  // Close the add user modal
  closeAddUserModal(): void {
    this.showAddUserModal = false;
  }

  // Add a new user
  addUser(): void {
    this.adminService.createUser(this.newUser).subscribe(
      () => {
        this.showAddUserModal = false;
        this.fetchUsers();
        this.snackBar.open('User added successfully!', '', {
          duration: 10000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      },
      error => this.snackBar.open(`Error adding user: ${error.error?.message || 'Unknown error'}`, '', {
        duration: 10000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      })
    );
  }
}
