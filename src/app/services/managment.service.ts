import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, shareReplay } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { Course } from '../models/course.model';
import { Lesson } from '../models/lesson.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ManagementService {
  private apiUrl = 'http://localhost:3000/api';

  // Cache for courses and lessons
  private coursesCache: Observable<Course[]> | null = null;
  private courseCache: Map<number, Observable<Course>> = new Map();
  private lessonsCache: Map<number, Observable<Lesson[]>> = new Map();

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.token;
    if (!token) {
      throw new Error("No token available. Teacher must be logged in.");
    }
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getCourses(): Observable<Course[]> {
    // Return cached data if available
    if (this.coursesCache) {
      return this.coursesCache;
    }

    // Otherwise fetch from API and cache the result
    console.log("Fetching courses from API");
    this.coursesCache = this.http.get<Course[]>(`${this.apiUrl}/courses`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(courses => console.log(`Fetched ${courses.length} courses`)),
      shareReplay(1),
      catchError(error => {
        this.coursesCache = null; // Reset cache on error
        return this.handleError(error);
      })
    );

    return this.coursesCache;
  }
  
  getCoursesByTeacher(teacherId: number): Observable<Course[]> {
    // We don't cache teacher-specific courses to ensure we always get the latest data
    console.log(`Fetching courses for teacher ID: ${teacherId}`);
    // Filter courses by teacher ID on the client side since the API doesn't support direct filtering
    return this.http.get<Course[]>(`${this.apiUrl}/courses`, {
      headers: this.getAuthHeaders()
    }).pipe(
      map(courses => courses.filter(course => course.teacherId === teacherId)),
      tap(courses => console.log(`Fetched ${courses.length} courses for teacher ID: ${teacherId}`)),
      catchError(this.handleError)
    );
  }

  getCourse(courseId: number): Observable<Course> {
    // Return cached data if available
    if (this.courseCache.has(courseId)) {
      return this.courseCache.get(courseId)!;
    }

    // Otherwise fetch from API and cache the result
    const course$ = this.http.get<Course>(`${this.apiUrl}/courses/${courseId}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(course => console.log(`Fetched course id=${courseId}`)),
      shareReplay(1),
      catchError(error => {
        this.courseCache.delete(courseId); // Remove from cache on error
        return this.handleError(error);
      })
    );

    this.courseCache.set(courseId, course$);
    return course$;
  }

  addCourse(course: Omit<Course, 'id'>): Observable<any> {
    return this.http.post(`${this.apiUrl}/courses`, course, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(() => {
        // Invalidate courses cache when adding a new course
        this.coursesCache = null;
      }),
      catchError(this.handleError)
    );
  }

  updateCourse(courseId: number, course: Omit<Course, 'id'>): Observable<any> {
    return this.http.put(`${this.apiUrl}/courses/${courseId}`, course, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(() => {
        // Invalidate affected caches
        this.coursesCache = null;
        this.courseCache.delete(courseId);
      }),
      catchError(this.handleError)
    );
  }

  deleteCourse(courseId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/courses/${courseId}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(() => {
        // Invalidate affected caches
        this.coursesCache = null;
        this.courseCache.delete(courseId);
        this.lessonsCache.delete(courseId);
      }),
      catchError(this.handleError)
    );
  }

  addLesson(courseId: number, lesson: Omit<Lesson, 'id'>): Observable<any> {
    console.log("Adding lesson to course", courseId);
    return this.http.post(`${this.apiUrl}/courses/${courseId}/lessons`, lesson, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(() => {
        // Invalidate lessons cache for this course
        this.lessonsCache.delete(courseId);
      }),
      catchError(this.handleError)
    );
  }

  // Get lessons for a specific course
  getLessonsForCourse(courseId: number): Observable<Lesson[]> {
    // Return cached data if available
    if (this.lessonsCache.has(courseId)) {
      return this.lessonsCache.get(courseId)!;
    }

    // Otherwise fetch from API and cache the result
    const lessons$ = this.http.get<Lesson[]>(`${this.apiUrl}/courses/${courseId}/lessons`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(lessons => console.log(`Fetched ${lessons.length} lessons for course id=${courseId}`)),
      shareReplay(1),
      catchError(error => {
        this.lessonsCache.delete(courseId); // Remove from cache on error
        return this.handleError(error);
      })
    );

    this.lessonsCache.set(courseId, lessons$);
    return lessons$;
  }

  updateLesson(courseId: number, lessonId: number, lesson: Omit<Lesson, 'id'>): Observable<any> {
    return this.http.put(`${this.apiUrl}/courses/${courseId}/lessons/${lessonId}`, lesson, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(() => {
        // Invalidate lessons cache for this course
        this.lessonsCache.delete(courseId);
      }),
      catchError(this.handleError)
    );
  }

  deleteLesson(courseId: number, lessonId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/courses/${courseId}/lessons/${lessonId}`, { 
      headers: this.getAuthHeaders() 
    }).pipe(
      tap(() => {
        // Invalidate lessons cache for this course
        this.lessonsCache.delete(courseId);
      }),
      catchError(this.handleError)
    );
  }

  // Clear all caches (useful for logout)
  clearCaches(): void {
    this.coursesCache = null;
    this.courseCache.clear();
    this.lessonsCache.clear();
  }

  // Error handling
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      errorMessage = `Server error (code ${error.status}): ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}