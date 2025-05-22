import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { Course } from '../../models/course.model';
import { Lesson } from '../../models/lesson.model';
import { ManagementService } from '../../services/managment.service';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-management',
  templateUrl: './management.component.html',
  styleUrls: ['./management.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule
  ]
})
export class ManagementComponent implements OnInit {
closeEditCourseModal(): void {
    this.showEditCourseModal = false;
    this.selectedCourse = null;
}

openEditCourseModal(course: Course): void {
    this.selectedCourse = { ...course };
    this.showEditCourseModal = true;
}
  courses: Course[] = [];
  showAddCourseModal = false;
  newCourse: Course = { id: 0, title: '', description: '', teacherId: 1 };
  showEditCourseModal = false;
  selectedCourse: Course | null = null;
  showAddLessonModal = false;
  newLesson: Lesson = { title: '', content: '', courseId: 0 }; // ללא id
  selectedCourseIdForLesson: number | null = null;
  showEditLessons = false;
  selectedCourseIdForLessons: number | null = null;
  lessons: Lesson[] = [];
  showEditLessonModal = false;
  selectedLesson: Lesson | null = null;
  showFloatingButton = false;
  teacherId: number | null = null;

  deleteLesson(courseId: number, lessonId: number): void {
    if (confirm('Are you sure you want to delete this lesson?')) {
      this.ManagementService.deleteLesson(courseId, lessonId).subscribe(
        () => {
          this.snackBar.open('Lesson deleted successfully', '', {
            duration: 10000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          // Refresh the courses to update the lessons list
          this.fetchCourses();
        },
        error => {
          this.snackBar.open(`Error deleting lesson: ${error.message}`, '', {
            duration: 10000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        }
      );
    }
  }

  constructor(
    private ManagementService: ManagementService,
    private router: Router,
    private snackBar: MatSnackBar,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.checkTeacherToken();
    this.fetchCourses();
    // Initial check for scroll position
    this.checkScroll();
  }
  
  // Listen for scroll events to show/hide the floating action button
  @HostListener('window:scroll', [])
  checkScroll(): void {
    // Get the header element
    const header = document.querySelector('.management-header') as HTMLElement;
    if (header) {
      // Get the bottom position of the header
      const headerBottom = header.getBoundingClientRect().bottom;
      // Show the floating button when the header is out of view (negative bottom position)
      this.showFloatingButton = headerBottom < 0;
    }
  }

  checkTeacherToken(): void {
    const token = localStorage.getItem('teacherToken');
    if (!token) {
      this.router.navigate(['/login']);
    }
    
    // Get the teacher ID from the token or user info
    this.teacherId = this.authService.getCurrentTeacherId();
    if (!this.teacherId) {
      this.snackBar.open('Unable to identify teacher. Please log in again.', '', {
        duration: 10000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      this.router.navigate(['/login']);
    }
  }

  fetchCourses(): void {
    if (this.teacherId) {
      // Only fetch courses that belong to the current teacher
      this.ManagementService.getCoursesByTeacher(this.teacherId).subscribe(
        data => {
          this.courses = data;
          // Load lessons for each course
          this.courses.forEach(course => {
            this.ManagementService.getLessonsForCourse(course.id).subscribe(lessons => {
              course.lessons = lessons;
            });
          });
        },
        error => this.snackBar.open(`an error accured when fetching courses: ${error.error?.message || 'unknown error'}`, '', {
          duration: 10000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        })
      );
    } else {
      this.snackBar.open('Unable to identify teacher ID. Please log in again.', '', {
        duration: 10000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      });
      this.router.navigate(['/login']);
    }
  }

  // פתיחת מודל הוספת קורס
  openAddCourseModal(): void {
    this.showAddCourseModal = true;
  }

  closeAddCourseModal(): void {
    this.showAddCourseModal = false;
    this.newCourse = { id: 0, title: '', description: '', teacherId: 1 };
  }

  addCourse(): void {
    this.ManagementService.addCourse(this.newCourse).subscribe(
      () => {
        this.closeAddCourseModal();
        this.fetchCourses();
        this.snackBar.open('Course added successfully', '', {
          duration: 10000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      },
      error => this.snackBar.open(`Error adding course: ${error.error?.message || 'Unknown error'}`, '', {
        duration: 10000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      })
    );
  }

  // פתיחת מודל הוספת שיעור
  openAddLessonModal(courseId: number): void {
    this.selectedCourseIdForLesson = courseId;
    this.newLesson = { title: '', content: '', courseId };
    this.showAddLessonModal = true;
  }

  closeAddLessonModal(): void {
    this.showAddLessonModal = false;
    this.selectedCourseIdForLesson = null;
    this.newLesson = { title: '', content: '', courseId: 0 };
  }

  addLesson(): void {
    console.log("add lesson on component");
    
    if (this.selectedCourseIdForLesson) {
      this.ManagementService.addLesson(this.selectedCourseIdForLesson, this.newLesson).subscribe({
        next: () => {
          this.snackBar.open('lesson added successfully!', '', {
            duration: 10000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.closeAddLessonModal();
          this.fetchCourses(); // Refresh the courses/lessons list
        },
        error: (error) => {
          this.snackBar.open(`error adding lesson: ${error.error?.message || 'error adding lesson'}`, '', {
            duration: 10000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        }
      });
    }
  }

  // פתיחת מודל עריכת שיעור
  openEditLessonModal(lesson: Lesson, courseId: number): void {
    this.selectedLesson = { ...lesson };
    this.selectedCourseIdForLessons = courseId;
    this.showEditLessonModal = true;
  }

  closeEditLessonModal(): void {
    this.showEditLessonModal = false;
    this.selectedLesson = null;
    this.selectedCourseIdForLessons = null;
  }

  updateLesson(): void {
    if (this.selectedLesson && this.selectedLesson.id && this.selectedCourseIdForLessons) {
      this.ManagementService.updateLesson(this.selectedCourseIdForLessons, this.selectedLesson.id, this.selectedLesson).subscribe(
        () => {
          this.closeEditLessonModal();
          this.fetchCourses(); // Refresh all courses and their lessons
          this.snackBar.open('השיעור עודכן בהצלחה!', '', {
            duration: 10000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        },
        error => this.snackBar.open(`error updating lesson: ${error.error?.message || 'error updating lesson'}`, '', {
          duration: 10000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        })
      );
    }
  }

  updateCourse(): void {
    if (this.selectedCourse && this.selectedCourse.id) {
      this.ManagementService.updateCourse(this.selectedCourse.id, this.selectedCourse).subscribe(
        () => {
          this.showEditCourseModal = false;
          this.selectedCourse = null;
          this.fetchCourses();
          this.snackBar.open('Course updated successfully', '', {
            duration: 10000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
        },
        error => this.snackBar.open(`Error updating course: ${error.error?.message || 'Unknown error'}`, '', {
          duration: 10000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        })
      );
    }
  }

  // מחיקת קורס
  deleteCourse(courseId: number): void {
    const confirmed = window.confirm('Are you sure you want to delete this course? Press "Delete" to confirm.');
    if (!confirmed) return;

    this.ManagementService.deleteCourse(courseId).subscribe(
      () => {
        this.fetchCourses();  // רענן את רשימת הקורסים
        this.snackBar.open('Course deleted successfully', '', { 
          duration: 10000,
          horizontalPosition: 'center',
          verticalPosition: 'top'
        });
      },
      error => this.snackBar.open(`Error deleting course: ${error.error?.message || 'Unknown error'}`, '', {
        duration: 10000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      })
    );
  }



  // סגירת המודל של עריכת שיעורים
  closeEditLessons(): void {
    this.showEditLessons = false;
    this.selectedCourseIdForLessons = null;
  }

  // טעינת שיעורים עבור קורס
  fetchLessonsForCourse(courseId: number): void {
    this.ManagementService.getLessonsForCourse(courseId).subscribe(
      lessons => this.lessons = lessons,
      error => this.snackBar.open(`error loading lessons: ${error.error?.message || 'error loading lessons'}`, '', {
        duration: 10000,
        horizontalPosition: 'center',
        verticalPosition: 'top'
      })
    );
  }
}
