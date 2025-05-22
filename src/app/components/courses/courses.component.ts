import { Component, Inject, OnInit } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { CourseService } from '../../services/courses.service';
import { AuthService } from '../../services/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { DetailsComponent } from '../details/details.component'; // ייבוא הקומפוננטה של הדיאלוג
import { Course } from '../../models/course.model'; // ייבוא המודל של הקורס


@Component({
  selector: 'app-courses-list',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatListModule, CommonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css']
})
export class CoursesComponent implements OnInit {
  courses: Course[] = [];
  loading = true;
  error: string = '';
  userId: number;
  enrolledCourseIds: number[] = [];



  private courseImages = [
    '1.jpg',  // Programming Basics
    '2.jpg',  // Web Development
    '3.jpg',  // Data Structures
    '4.jpg',  // Algorithms
    '5.jpg'   // Database Design
  ];

  constructor(
    private courseService: CourseService,
    private snackBar: MatSnackBar,
    private router: Router,
    @Inject(AuthService) private authService: AuthService,
    public dialog: MatDialog
  ) {
    this.userId = this.authService.currentUser?.id || 0;
  }

  getCourseImage(index: number): string {
    // Use modulo to cycle through images if there are more courses than images
    const imageIndex = index % this.courseImages.length;
    return this.courseImages[imageIndex];
  }

  loadCourses(): void {
    this.courseService.getCourses().subscribe({
      next: courses => {
        this.courses = courses;
      },
      error: err => {
        console.error('Error loading courses:', err);
      }
    });
  }
  
  get userRole(): string {
    const role = this.authService.currentUser?.role || 'student';
    console.log('Current user role:', role);
    return role;
  }
ngOnInit(): void {
  console.log('User Role:', this.userRole);

  if (this.authService.isAuthenticated()) {
    // First, load all available courses
    this.getCourses();
    
    // Then, load the courses the student is enrolled in
    // This is important for showing enrollment status
    if (this.userId) {
      this.loadEnrolledCourses();
    } else {
      console.error('User ID not available');
    }
  } else {
    console.log('User not authenticated, redirecting to login');
    this.router.navigate(['/login']);
  }
}


  getCourses(): void {
    this.loading = true;
    this.courseService.getCourses().subscribe({
      next: (data) => {
        this.courses = data;
        this.loading = false;       
      },
      error: (error) => {
        
        this.error = error.message;
        this.loading = false;
        console.error('Error loading courses:', error);
        this.snackBar.open(`שגיאה: ${this.error}`, 'סגור', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }
  openCourseDetails(courseId: number): void {
    this.courseService.getCourseById(courseId).subscribe({
      next: (course) => {
        // Open the details dialog with smaller, more centered sizing
        const dialogRef = this.dialog.open(DetailsComponent, {
          maxWidth: '550px',
          width: '90%',
          maxHeight: '80vh',
          panelClass: ['responsive-dialog', 'centered-dialog'],
          data: { courseId, course }
        });
        
        // Add overlay class to make courses component appear with reduced opacity
        document.body.classList.add('dialog-open');
        
        // Remove the overlay class when dialog is closed
        dialogRef.afterClosed().subscribe(() => {
          document.body.classList.remove('dialog-open');
        });

      },
      error: (error) => {
        this.snackBar.open(`an error occurred: ${error.message}`, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });
  }

  enrollInCourse(courseId: number): void {
    this.courseService.enrollInCourse(courseId, this.userId).subscribe({
      next: (response) => {
        // Show success message with better styling
        this.snackBar.open(response.message, 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        this.loadEnrolledCourses(); // רענון קורסים רשומים לאחר הרשמה
      },
      error: (error) => {
        this.error = error.message;
        this.snackBar.open(`Error: ${this.error}`, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  unenrollFromCourse(courseId: number): void {
    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to unenroll from this course? Your progress may be lost.');
    
    if (!confirmed) {
      return; // User canceled the operation
    }
    
    this.courseService.unenrollFromCourse(courseId, this.userId).subscribe({
      next: (response) => {
        // Show the "sorry to see you go" message
        this.snackBar.open('Sorry to see you go 🥹 We hope you return soon!', 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['info-snackbar']
        });
        this.loadEnrolledCourses(); // רענון קורסים רשומים לאחר ביטול הרשמה
      },
      error: (error) => {
        this.error = error.message;
        this.snackBar.open(`Error: ${this.error}`, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadEnrolledCourses(): void {
      this.courseService.getUserCourses(this.userId).subscribe({
      next: (enrolledCourses) => {
              this.enrolledCourseIds = enrolledCourses.map(course => course.id);
        console.log("userId:", this.userId);
      },
     error: (error: any) => {
        console.error("Failed to load enrolled courses", error);
        this.snackBar.open(`Error loading enrolled courses: ${error.message}`, 'Close', {
          duration: 5000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      }
    });

  }
  

  isEnrolled(courseId: number): boolean {
    return this.enrolledCourseIds.includes(courseId);
  }
  
  // editCourse(courseId: number): void {
  //   // Navigate to a course edit form (you need to have a route for this)
  //   this.router.navigate(['/courses', courseId, 'edit']);
  // }
  
  deleteCourse(courseId: number): void {
    if (!confirm('Are you sure you want to delet the course?')) return;
  
    this.courseService.deleteCourse(courseId).subscribe({
      next: () => {
        // After deletion, refresh the list
        this.loadCourses();
      },
      error: err => {
        console.error('שגיאה במחיקת קורס:', err);
      }
    });
  }
  
}

