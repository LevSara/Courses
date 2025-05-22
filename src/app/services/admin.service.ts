import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { Course } from '../models/course.model';
import { Lesson } from '../models/lesson.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:3000/api'; // Base URL with /api

  constructor(private http: HttpClient) { }

  // Get auth headers with token
  private getAuthHeaders(): HttpHeaders {
    // Try to get any valid token in order of preference
    const adminToken = localStorage.getItem('adminToken');
    const teacherToken = localStorage.getItem('teacherToken');
    const studentToken = localStorage.getItem('studentToken');
    const generalToken = localStorage.getItem('token');
    
    // Use the first available token
    const token = adminToken || teacherToken || studentToken || generalToken;
    
    if (!token) {
      throw new Error('No authentication token available. Please log in.');
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // Get teacher auth headers for course operations
  private getTeacherHeaders(): HttpHeaders {
    // First try to get a teacher token
    const teacherToken = localStorage.getItem('teacherToken');
    
    // If no teacher token is available, try to use the admin token as a fallback
    if (!teacherToken) {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('No authentication token available. Please log in.');
      }
      
      // Log a warning but still proceed with the admin token
      console.warn('Using admin token for teacher operations. Some operations may fail due to permission restrictions.');
      
      return new HttpHeaders({
        'Authorization': `Bearer ${adminToken}`
      });
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${teacherToken}`
    });
  }



  // ===== USER MANAGEMENT =====

  // Get all users
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get all teachers (users with teacher role)
  getTeachers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users?role=teacher`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get a single user by ID
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Create a new user
  createUser(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/auth/register`, user, {
      headers: this.getAuthHeaders()
    });
  }

  // Update an existing user
  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/users/${id}`, user, {
      headers: this.getAuthHeaders()
    });
  }

  // Delete a user
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // ===== COURSE MANAGEMENT =====

  // Get all courses
  getCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/courses`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get courses by teacher ID
  getCoursesByTeacher(teacherId: number): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/courses?teacherId=${teacherId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get a single course by ID
  getCourseById(id: number): Observable<Course> {
    return this.http.get<Course>(`${this.apiUrl}/courses/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Create a new course
  createCourse(course: Course): Observable<Course> {
    // Course operations require teacher token
    return this.http.post<Course>(`${this.apiUrl}/courses`, course, {
      headers: this.getTeacherHeaders()
    });
  }

  // Update an existing course
  updateCourse(id: number, course: Course): Observable<Course> {
    // Course operations require teacher token
    return this.http.put<Course>(`${this.apiUrl}/courses/${id}`, course, {
      headers: this.getTeacherHeaders()
    });
  }

  // Delete a course
  deleteCourse(id: number): Observable<void> {
    // Course operations require teacher token
    return this.http.delete<void>(`${this.apiUrl}/courses/${id}`, {
      headers: this.getTeacherHeaders()
    });
  }

  // ===== LESSON MANAGEMENT =====

  // Get all lessons for a course
  getLessons(courseId: number): Observable<Lesson[]> {
    return this.http.get<Lesson[]>(`${this.apiUrl}/courses/${courseId}/lessons`, {
      headers: this.getAuthHeaders()
    });
  }

  // Get a single lesson by ID
  getLessonById(courseId: number, lessonId: number): Observable<Lesson> {
    return this.http.get<Lesson>(`${this.apiUrl}/courses/${courseId}/lessons/${lessonId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Create a new lesson
  createLesson(lesson: Lesson): Observable<Lesson> {
    // Lesson operations require teacher token
    return this.http.post<Lesson>(`${this.apiUrl}/courses/${lesson.courseId}/lessons`, lesson, {
      headers: this.getTeacherHeaders()
    });
  }

  // Update an existing lesson
  updateLesson(id: number, lesson: Lesson): Observable<Lesson> {
    // Lesson operations require teacher token
    return this.http.put<Lesson>(`${this.apiUrl}/courses/${lesson.courseId}/lessons/${id}`, lesson, {
      headers: this.getTeacherHeaders()
    });
  }

  // Delete a lesson
  deleteLesson(courseId: number, lessonId: number): Observable<void> {
    // Lesson operations require teacher token
    return this.http.delete<void>(`${this.apiUrl}/courses/${courseId}/lessons/${lessonId}`, {
      headers: this.getTeacherHeaders()
    });
  }
}
