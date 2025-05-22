import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatSnackBarModule
  ],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css']
})
export class AuthComponent implements OnInit {
  authForm: FormGroup;
  registerForm: FormGroup;
  error: string = '';
  loading = false;
  isLoginMode = true;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private ngZone: NgZone
  ) {
    this.authForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.registerForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['student', Validators.required]
    });
  }

  ngOnInit(): void {}

  onSubmit(): void {
    this.error = '';
    if (this.isLoginMode) {
      if (this.authForm.invalid) return;
      this.loading = true;
      const credentials = this.authForm.value;

      this.authService.auth(credentials).subscribe({
        next: (response) => {
          this.snackBar.open('Login successful!', 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });

          this.loading = false;

          if (response.role === 'teacher') {
            localStorage.setItem('teacherToken', response.token);
            this.ngZone.run(() => {
              this.router.navigate(['/management']);
            });
          } else if (response.role === 'student') {
            localStorage.setItem('studentToken', response.token);
            this.ngZone.run(() => {
              this.router.navigate(['/courses']);
            });
          }  else if (response.role === 'admin') {
            localStorage.setItem('adminToken', response.token);
            localStorage.setItem('teacherToken', response.token); // Also store the admin token as a teacher token
            localStorage.setItem('userRole', 'admin'); // Store the role explicitly
            this.ngZone.run(() => {
              this.router.navigate(['/admin']);
            });
          }
           else {
            this.ngZone.run(() => {
              this.router.navigate(['/auth']);
            });
          }
        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error);
        }
      });
    } else {
      if (this.registerForm.invalid) return;

      this.loading = true;
      const formData = this.registerForm.value;

      this.authService.register(formData).subscribe({
        next: (response: any) => {
          this.loading = false;
          this.snackBar.open('User registered successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });

          // Save token and handle different roles
          if (response.token && response.role) {
            if (response.role === 'teacher') {
              localStorage.setItem('teacherToken', response.token);
              this.ngZone.run(() => {
                this.router.navigate(['/management']);
              });
            } else if (response.role === 'student') {
              localStorage.setItem('studentToken', response.token);
              this.ngZone.run(() => {
                this.router.navigate(['/courses']);
              });
            } else if (response.role === 'admin') {
              localStorage.setItem('adminToken', response.token);
              // Also store the admin token as a teacher token so admin can perform teacher operations
              localStorage.setItem('teacherToken', response.token);
              localStorage.setItem('userRole', 'admin'); // Store the role explicitly
              this.ngZone.run(() => {
                this.router.navigate(['/admin']);
              });
            }
          } else {
            this.ngZone.run(() => {
              this.router.navigate(['/auth']);
            });
          }
        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error);
        }
      });
    }
  }

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.error = '';
  }

  private handleError(error: HttpErrorResponse) {
    this.loading = false;
    this.error = error?.error?.message || 'An error occurred. Please try again.';
    this.snackBar.open(`Error: ${this.error}`, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
    console.error('Auth error:', error);
  }
}
