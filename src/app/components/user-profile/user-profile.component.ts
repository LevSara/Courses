import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { User } from '../../models/user.model';
import { Course } from '../../models/course.model';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
    MatDividerModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule
  ],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent {
  @Input() user: User | null = null;
  @Input() enrolledCourses: Course[] = [];
  
  @Output() editUser = new EventEmitter<User>();
  @Output() deleteUser = new EventEmitter<number>();
  @Output() viewUserCourses = new EventEmitter<number>();
  
  showCoursesModal = false;
  showEditProfileModal = false;
  editedUser: User | null = null;
  
  constructor(public dialog: MatDialog) {}
  
  getInitial(): string {
    return this.user?.name ? this.user.name.charAt(0).toUpperCase() : '?';
  }
  
  openEditProfile(): void {
    this.editedUser = { ...this.user } as User;
    this.showEditProfileModal = true;
  }
  
  closeEditProfileModal(): void {
    this.showEditProfileModal = false;
  }
  
  saveUserChanges(): void {
    if (this.editedUser) {
      this.editUser.emit(this.editedUser);
      this.showEditProfileModal = false;
    }
  }
  
  confirmDeleteAccount(): void {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.') && this.user) {
      this.deleteUser.emit(this.user.id);
    }
  }
  
  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  openUserCourses(): void {
    // Don't show courses for admin users based on backend permissions
    if (this.user && !this.isAdmin()) {
      this.viewUserCourses.emit(this.user.id);
      this.showCoursesModal = true;
    }
  }
  
  closeCoursesModal(): void {
    this.showCoursesModal = false;
  }
}
