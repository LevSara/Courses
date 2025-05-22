// import { NgModule } from '@angular/core';
// import { RouterModule, Routes } from '@angular/router';
// import { AuthComponent } from './auth/auth.component';
// import { CoursesComponent } from './courses/courses.component';
// import { DetailsComponent } from './details/details.component';
// import { ManagementComponent } from './management/management.component';

// export const routes: Routes = [
//     { path: '', redirectTo: 'auth', pathMatch: 'full' },
//     { path: 'auth', component: AuthComponent },
//     { path: 'courses', component: CoursesComponent },
//     { path: 'details', component: DetailsComponent },
//     { path: 'management', component: ManagementComponent },
//     { path: 'login', component: AuthComponent }, // הוספת נתיב עבור '/login'
// ];

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './components/auth/auth.component';
import { CoursesComponent } from './components/courses/courses.component';
import { DetailsComponent } from './components/details/details.component';
import { ManagementComponent } from './components/management/management.component';
import { HeaderComponent } from './components/header/header.component'; // ייבוא קומפוננטת ה-Header
import { AccountSettingsComponent } from './components/account-settings/account-settings.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard'; // ייבוא ה-RoleGuard
import { AdminComponent } from './components/admin/admin.component';
export const routes: Routes = [

  { path: 'auth', component: AuthComponent },
  // your combined login/register component
    { path: 'login', component: AuthComponent },    // maybe use params to switch forms
    // { path: 'courses', component: CoursesComponent },
    // { path: 'courses/:id', component: DetailsComponent, canActivate: [AuthGuard] },
    { path: 'my-courses', component: CoursesComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['student'] } },
    { path: 'management', component: ManagementComponent, canActivate: [AuthGuard, RoleGuard], data: { roles: ['teacher'] } },
   // { path: 'account', component: AccountSettingsComponent, canActivate: [AuthGuard] },
    { path: '', redirectTo: '/auth', pathMatch: 'full' }  ,
    { path: 'courses/:id', component: DetailsComponent },
  { path: 'courses', component: CoursesComponent },
  {path:'admin',component:AdminComponent, canActivate:[AuthGuard,RoleGuard],data:{roles:['admin']}},
  { path: 'details/:id', component: DetailsComponent }, // הנחיה שיש פרמטר id לפרטי הקורס
  { path: '**', redirectTo: '/auth' }, // always last
];



@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }