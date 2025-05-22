import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { User } from '../models/user.model';


interface AuthResponse {
  message: string;
  userId: number;
  token: string;
  role: string;
  name?: string;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrlRegister = 'http://localhost:3000/api/auth/register';
  private apiUrlLogin = 'http://localhost:3000/api/auth/login';
  private apiUrlUpdate = 'http://localhost:3000/api/users';  // URL לעדכון משתמש
  private apiUrlDelete = 'http://localhost:3000/api/users';  // URL למחיקת משתמש
  // private currentUserKey = 'currentUser';
  private _token: string | null = null;
  private _currentUser: User | null = null;
  private authChanged = new BehaviorSubject<boolean>(this.isAuthenticated());
  authChanged$ = this.authChanged.asObservable();
  private authStatusListener = new BehaviorSubject<boolean>(false);
  constructor(private http: HttpClient, private router: Router) { }

  private saveUserData(user: User, token: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('userData', JSON.stringify(user));
    this._token = token;
    this._currentUser = user;
    this.authChanged.next(true); // Notify subscribers
  }

  get currentUser(): User | null {
    if (!this._currentUser) {
      const userData = localStorage.getItem('userData');
      if (userData) {
        this._currentUser = JSON.parse(userData);
      }
    }
    return this._currentUser;
  }
  
  // Get user data as an Observable
  getUserData(): Observable<User | null> {
    return new Observable<User | null>(observer => {
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData) as User;
          this._currentUser = user;
          observer.next(user);
        } else if (this._currentUser) {
          observer.next(this._currentUser);
        } else {
          observer.next(null);
        }
        observer.complete();
      } catch (error) {
        console.error('Error getting user data:', error);
        observer.error(error);
      }
    });
  }
  
  // Update current user data
  updateCurrentUser(user: User): void {
    if (!user) return;
    
    // Get the current token
    const token = this.token;
    if (!token) return;
    
    // Save updated user data with the existing token
    this.saveUserData(user, token);
    
    // Notify subscribers that user data has been updated
    this.authChanged.next(true);
  }

  get token(): string | null {
    if (!this._token) {
      this._token = localStorage.getItem('token');
    }
    return this._token;
  }
  get isLoginUser(): boolean {
    return !!this.token;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getCurrentUserName(): string {
    return this.currentUser ? this.currentUser.name : 'not logined';
  }
  getCurrentUserRole(): string {
    return this.currentUser?.role || '';
  }
  
  getCurrentTeacherId(): number | null {
    if (this.currentUser && this.currentUser.role === 'teacher' && this.currentUser.id !== undefined) {
      return this.currentUser.id;
    }
    return null;
  }

  // what does this function do?

  auth(credentials: { email: string; password: string }): Observable<AuthResponse> {
    // Ensure credentials are properly formatted
    const payload = {
      email: credentials.email.trim(),
      password: credentials.password
    };
    
    console.log('Sending auth request to:', this.apiUrlLogin);
    
    return this.http.post<AuthResponse>(this.apiUrlLogin, payload).pipe(
      tap(response => {
        console.log('Auth response received:', response);
        
        const user: User = {
          id: response.userId,
          name: response.name || '', // Use name from response, not email as fallback
          email: credentials.email,
          role: response.role,
          password: ''
        };
        this.saveUserData(user, response.token);

        // Store the token in localStorage for all user types
        localStorage.setItem('token', response.token);
        localStorage.setItem('userRole', response.role);
        
        // Also store role-specific tokens for backward compatibility
        if (response.role === 'teacher') {
          localStorage.setItem('teacherToken', response.token);
          console.log('Teacher logged in successfully, navigating to management');
          this.router.navigate(['/management']);
        } else if (response.role === 'student') {
          localStorage.setItem('studentToken', response.token);
          console.log('Student logged in successfully, navigating to courses');
          this.router.navigate(['/courses']);
        } else if (response.role === 'admin') {
          localStorage.setItem('adminToken', response.token);
          console.log('Admin logged in successfully, navigating to admin panel');
          this.router.navigate(['/admin']);
        } else {
          console.log('Unknown role, navigating to auth page');
          this.router.navigate(['/auth']);
        }
      }),
      catchError((error) => {
        console.error('Auth request failed:', error);
        return this.handleError(error);
      })
    );  
  }

  register(userData: { name: string; email: string; password: string; role: string }): Observable<AuthResponse> {
    const payload = {
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role // Include role in the payload
    };

    return this.http.post<AuthResponse>(this.apiUrlRegister, payload).pipe(
      tap(response => {
        const user: User = {
          id: response.userId,
          name: userData.name,
          email: userData.email,
          role: userData.role, // Use the role from form data
          password: ''
        };
        this.saveUserData(user, response.token);
        
        // Store role-specific tokens
        if (userData.role === 'admin') {
          localStorage.setItem('adminToken', response.token);
          localStorage.setItem('userRole', 'admin');
        } else if (userData.role === 'teacher') {
          localStorage.setItem('teacherToken', response.token);
        } else if (userData.role === 'student') {
          localStorage.setItem('studentToken', response.token);
        }
      }),
      catchError(this.handleError)
    );
  }

  // Get auth headers with token
  private getAuthHeaders(): HttpHeaders {
    const token = this.token;
    if (!token) {
      throw new Error('No authentication token available. Please log in.');
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  updateUser(userData: { name?: string; email?: string; password?: string }): Observable<AuthResponse> {
    const userId = this.currentUser?.id;
    if (!userId) {
      return throwError(() => new Error('User not logged in'));
    }

    console.log('Updating user with data:', userData);

    return this.http.put<AuthResponse>(`${this.apiUrlUpdate}/${userId}`, userData, { headers: this.getAuthHeaders() }).pipe(
      tap(response => {
        console.log('User update response:', response);
        
        // Create updated user with the new information from the form
        const updatedUser: User = {
          id: userId,
          // Use the provided name from the form, fallback to existing name
          name: userData.name || this.currentUser?.name || '',
          // Use the provided email from the form, fallback to existing email
          email: userData.email || this.currentUser?.email || '',
          role: this.currentUser?.role || '',
          password: userData.password || this.currentUser?.password || ''
        };
        
        console.log('Saving updated user data:', updatedUser);
        this.saveUserData(updatedUser, response.token || this.token || '');
      }),
      catchError(error => {
        console.error('Error updating user:', error);
        return this.handleError(error);
      })
    );
  }

  deleteUser(): Observable<AuthResponse> {
    const userId = this.currentUser?.id;
    if (!userId) {
      return throwError(() => new Error('User not logged in'));
    }

    return this.http.delete<AuthResponse>(`${this.apiUrlDelete}/${userId}`, { headers: this.getAuthHeaders() }).pipe(
      tap(() => {
        // localStorage .removeItem(this.currentUserKey);
        this.router.navigate(['/auth']);  // הפניית המשתמש לדף התחברות
      }),
      catchError(this.handleError)
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('studentToken');
    localStorage.removeItem('teacherToken');
    this._token = null;
    this._currentUser = null;
    this.authChanged.next(false); // Notify subscribers
    this.router.navigate(['/auth']);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('❌ AuthService Error:', error);
    
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 0) {
        errorMessage = 'Server is unreachable. Please check your connection';
      } else if (error.status === 400) {
        errorMessage = error.error?.message || 'Invalid request. Please check your credentials';
      } else if (error.status === 401) {
        errorMessage = 'Unauthorized. Please check your credentials';
      } else if (error.status === 404) {
        errorMessage = 'Resource not found. Please check the API endpoint';
      } else {
        errorMessage = `Server Error: ${error.error?.message || ''} (Status: ${error.status})`;
      }
    }
    
    console.error('Formatted error message:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }  

}
