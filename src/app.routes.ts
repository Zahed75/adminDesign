import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Notfound } from './app/pages/notfound/notfound';
import { SignInComponent } from './app/components/sign-in/sign-in.component';
import { SignUpComponent } from './app/components/sign-up/sign-up.component';
import { OtpVerificationComponent } from './app/components/otp-verification/otp-verification.component';
import { ForgetPassComponent } from './app/components/forget-pass/forget-pass.component';
import { BrandsComponent } from './app/components/brands/brands.component';
import { ServiceComponent } from './app/components/service/service.component';
import { ServiceListComponent } from './app/components/service-list/service-list.component';
import { TeamComponent } from './app/components/team/team.component';
import { DesignerTaskComponent } from './app/components/designer-task/designer-task.component';
import { ChatSystemComponent } from './app/components/chat-system/chat-system.component';
import { ServiceDetailsComponent } from './app/components/service-details/service-details.component';
import { authGuard } from './guard/auth.guard';
import {DesignerTaskDetailsComponent} from "./app/components/designer-task-details/designer-task-details.component";

export const appRoutes: Routes = [
    {
        path: '',
        redirectTo: 'sign-in',
        pathMatch: 'full',
    },
    {
        path: 'sign-in',
        component: SignInComponent,
    },
    {
        path: 'sign-up',
        component: SignUpComponent,
    },
    {
        path: 'otp-verification',
        component: OtpVerificationComponent,
    },
    {
        path: 'forgot-password',
        component: ForgetPassComponent,
    },
    {
        path: 'app',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            {
                path: 'dashboard',
                component: Dashboard,
                data: { roles: ['AD', 'CUS', 'TM', 'DES'] }
            },
            {
                path: 'brands',
                component: BrandsComponent,
                data: { roles: ['AD', 'CUS', 'TM'] },
            },
            {
                path: 'service',
                component: ServiceComponent,
                data: { roles: ['AD', 'CUS', 'TM'] },
            },
            {
                path: 'service-list',
                component: ServiceListComponent,
                data: { roles: ['AD', 'CUS'] },
            },
            {
                path: 'service/:id',
                component: ServiceDetailsComponent,
                data: { roles: ['AD', 'CUS', 'TM', 'DES'] }, // Adjust roles as needed
            },
            {
                path: 'team',
                component: TeamComponent,
                data: { roles: ['AD', 'TM'] },
            },
            {
                path: 'designer',
                component: DesignerTaskComponent,
                data: { roles: ['AD', 'DES'] },
            },
            {
                path: 'chat',
                component: ChatSystemComponent,
                data: { roles: ['AD', 'CUS', 'TM', 'DES'] },
            },
            {
                path: 'designer/:id',
                component: DesignerTaskDetailsComponent,
                data: { roles: ['AD', 'DES'] },
            },
            {
                path: 'pages',
                loadChildren: () => import('./app/pages/pages.routes'),
                data: { roles: ['AD'] }
            },
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
        ],
    },
    { path: 'notfound', component: Notfound },
    { path: '**', redirectTo: '/notfound' },
];
