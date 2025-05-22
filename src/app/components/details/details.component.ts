import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CourseService } from '../../services/courses.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Course } from '../../models/course.model';
import { MatDialog } from '@angular/material/dialog';
// Removed unnecessary import of DetailsComponent
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
// Removed redundant import of DetailsComponent
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css'],

  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule,
    MatCardModule, FormsModule,
    MatButtonModule, MatListModule,
    MatIconModule]
})
export class DetailsComponent implements OnInit {
  courseId: number;
  title: string = '';
  description: string = '';

  teacherName: string = '';
  lessons: any[] = [];
  isEditing: boolean = false;
  loading: boolean = false;
  error: string | null = null;
  isTeacher = !!localStorage.getItem('teacherToken');
  
  // Course images for the details view
  private courseImages = [
    '1.jpg',  // Programming Basics
    '2.jpg',  // Web Development
    '3.jpg',  // Data Structures
    '4.jpg',  // Algorithms
    '5.jpg'   // Database Design
  ];
  
  // Get course image based on course ID - exact match with courses component
  getCourseImage(courseId: number): string {
    // Use the exact same index calculation as in the courses component
    // Subtract 1 from courseId since our IDs start at 1 but array indices start at 0
    const index = (courseId - 1);
    const imageIndex = index % this.courseImages.length;
    console.log(`Details component - Course ID: ${courseId}, Image Index: ${imageIndex}, Image: ${this.courseImages[imageIndex]}`);
    return this.courseImages[imageIndex];
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any, 
    public dialogRef: MatDialogRef<DetailsComponent>,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute, private courseService: CourseService
  ) {
    this.courseId = data.courseId;
  }

  ngOnInit(): void {
    if (this.courseId) {
      this.loadCourseDetails();
      this.loadLessons();
    } else {
      // Fallback to route params if courseId wasn't provided in dialog data
      const routeId = this.route.snapshot.paramMap.get('id');
      if (routeId) {
        this.courseId = +routeId;
        this.loadCourseDetails();
        this.loadLessons();
      }
    }
  }

  // טוען את פרטי הקורס
  loadCourseDetails() {
    this.loading = true;
    this.courseService.getCourseById(this.courseId).subscribe(
      (course: Course) => {
        this.title = course.title;
        this.description = course.description;
  
        this.teacherName = course.teacherName || '';
        this.loading = false;
      },
      (error) => {
        console.error('Error loading course:', error);
        this.error = 'Failed to load course details';
        this.loading = false;
      }
    );
  }

  loadLessons(): void {
    this.courseService.getLessonsByCourseId(this.courseId).subscribe(
      (lessons) => {
        this.lessons = lessons;
      },
      (error) => {
        console.error('Error loading lessons:', error);
        this.error = 'Failed to load lessons';
      }
    );
  }
  // // מבצע עדכון של פרטי הקורס
  // saveChanges(): void {
  //   const updatedCourse = {
  //     id: this.courseId,
  //     title: this.title,
  //     description: this.description,
  //     teacherId: this.data.teacherId // Assuming teacherId is passed in the data object
  //   };

  //   this.courseService.updateCourse(updatedCourse).subscribe(
  //     (response) => {
  //       this.snackBar.open('הקורס עודכן בהצלחה', 'סגור', {
  //         duration: 3000,
  //         horizontalPosition: 'center',
  //         verticalPosition: 'top'
  //       });
  //       this.dialogRef.close(); // סוגר את הדיאלוג
  //     },
  //     (error) => {
  //       this.snackBar.open(`שגיאה בעדכון הקורס: ${error.message}`, 'סגור', {
  //         duration: 5000,
  //         horizontalPosition: 'center',
  //         verticalPosition: 'top'
  //       });
  //     }
  //   );
  // }

  // מאפשר שינוי בין מצב הצגה למצב עריכה
  toggleEdit(): void {
    this.isEditing = !this.isEditing;
  }

  // סוגר את הדיאלוג בלי לשמור שינויים
  cancel(): void {
    this.dialogRef.close();
  }
  
}
