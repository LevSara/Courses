// courses.service.ts
// This service is responsible for making HTTP requests to the backend API

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, map, shareReplay } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { Course } from '../models/course.model';
import { Lesson } from '../models/lesson.model';

interface EnrollmentResponse {
  message: string;
}



@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = 'http://localhost:3000/api/courses'; // URL to web API
  
  // Cache for courses and course details
  private coursesCache: Observable<Course[]> | null = null;
  private courseCache: Map<number, Observable<Course>> = new Map();
  private lessonsCache: Map<number, Observable<Lesson[]>> = new Map();
  private userCoursesCache: Map<number, Observable<Course[]>> = new Map();

  constructor(private http: HttpClient, private authService: AuthService) { }

  // Only get the auth header with the token
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.token;
    if (!token) {
      throw new Error("No token available. User must be logged in.");
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

    // Get the user role to determine the correct endpoint
    const userRole = this.authService.getCurrentUserRole();
    console.log('Getting courses for user role:', userRole);
    
    // For all users, use the main courses endpoint
    // This ensures students can see all available courses
    this.coursesCache = this.http.get<Course[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(courses => console.log(`Fetched ${courses.length} courses`)),
      shareReplay(1),
      catchError(error => {
        console.error('Error fetching courses:', error);
        this.coursesCache = null; // Reset cache on error
        return this.handleError(error);
      })
    );

    return this.coursesCache;
  }
  
  getCourseById(courseId: number): Observable<Course> {
    // Return cached data if available
    if (this.courseCache.has(courseId)) {
      return this.courseCache.get(courseId)!;
    }

    // Otherwise fetch from API and cache the result
    const url = `${this.apiUrl}/${courseId}`;
    const course$ = this.http.get<Course>(url, {
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

  getLessonsByCourseId(courseId: number): Observable<Lesson[]> {
    // Return cached data if available
    if (this.lessonsCache.has(courseId)) {
      return this.lessonsCache.get(courseId)!;
    }

    // Otherwise fetch from API and cache the result
    const url = `${this.apiUrl}/${courseId}/lessons`;
    const lessons$ = this.http.get<Lesson[]>(url, {
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

  // Enroll in a course
  enrollInCourse(courseId: number, userId: number): Observable<EnrollmentResponse> {
    const body = { userId };
    return this.http.post<EnrollmentResponse>(`${this.apiUrl}/${courseId}/enroll`, body, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        // Invalidate caches that might be affected
        this.userCoursesCache.delete(userId);
        this.coursesCache = null;
      }),
      catchError(this.handleError)
    );
  }

  // Unenroll from a course
  unenrollFromCourse(courseId: number, userId: number): Observable<EnrollmentResponse> {
    const body = { userId };
    return this.http.delete<EnrollmentResponse>(`${this.apiUrl}/${courseId}/unenroll`, {
      headers: this.getAuthHeaders(),
      body: body
    }).pipe(
      tap(() => {
        // Invalidate caches that might be affected
        this.userCoursesCache.delete(userId);
        this.coursesCache = null;
      }),
      catchError(this.handleError)
    );
  }

  // Get courses for a specific user
  getUserCourses(userId: number): Observable<Course[]> {
    // Return cached data if available
    if (this.userCoursesCache.has(userId)) {
      return this.userCoursesCache.get(userId)!;
    }

    // Otherwise fetch from API and cache the result
    const courses$ = this.http.get<Course[]>(`http://localhost:3000/api/courses/student/${userId}/`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(courses => console.log(`Fetched ${courses.length} courses for user id=${userId}`)),
      shareReplay(1),
      catchError(error => {
        this.userCoursesCache.delete(userId); // Remove from cache on error
        return this.handleError(error);
      })
    );

    this.userCoursesCache.set(userId, courses$);
    return courses$;
  }
  // Delete a course
  deleteCourse(courseId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${courseId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      tap(() => {
        // Invalidate caches that might be affected
        this.coursesCache = null;
        this.courseCache.delete(courseId);
        this.lessonsCache.delete(courseId);
        // Also clear user courses cache as it might be affected
        this.userCoursesCache.clear();
      })
    );
  }
  
  // Clear all caches (useful for logout)
  clearCaches(): void {
    this.coursesCache = null;
    this.courseCache.clear();
    this.lessonsCache.clear();
    this.userCoursesCache.clear();
  }
  


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