import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { AuthService } from '../../../services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
        </ng-container>
    </ul>`,
})
export class AppMenu implements OnInit {
    model: MenuItem[] = [];
    private authService = inject(AuthService);
    private router = inject(Router);

    ngOnInit() {
        this.buildMenuBasedOnRole();
    }

    private buildMenuBasedOnRole() {
        const role = this.authService.getCurrentRole();

        // Common menu items for all roles except designer
        const commonMenuItems: MenuItem[] = [
            {
                label: 'Home',
                items: [{ label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/app/dashboard'] }]
            },
            {
                label: 'Brand',
                items: [{ label: 'Brands', icon: 'pi pi-fw pi-hammer', routerLink: ['/app/brands'] }]
            },
            {
                label: 'Service',
                items: [{ label: 'Service', icon: 'pi pi-fw pi-warehouse', routerLink: ['/app/service'] }]
            },
            {
                label: 'Service List',
                items: [{ label: 'List Service', icon: 'pi pi-fw pi-file-edit', routerLink: ['/app/service-list'] }]
            },
            {
                label: 'Team',
                items: [{ label: 'Invitation', icon: 'pi pi-fw pi-user-plus', routerLink: ['/app/team'] }]
            },
            {
                label: 'Chat',
                items: [{ label: 'Chat', icon: 'pi pi-fw pi-comments', routerLink: ['/app/chat'] }]
            },
            {
                label: 'Settings',
                items: [{
                    label: 'Logout',
                    icon: 'pi pi-power-off',
                    command: () => this.logout()
                }]
            }
        ];

        // Admin specific items (everything)
        if (role === 'AD') {
            this.model = [
                ...commonMenuItems,
                {
                    label: 'Designer',
                    items: [{ label: 'Designer', icon: 'pi pi-fw pi-palette', routerLink: ['/app/designer'] }]
                }
            ];
        }
        // Designer specific items (only designer and chat)
        else if (role === 'DES') {
            this.model = [
                {
                    label: 'Designer',
                    items: [
                        { label: 'Designer', icon: 'pi pi-fw pi-palette', routerLink: ['/app/designer'] },
                        { label: 'Chat', icon: 'pi pi-fw pi-comments', routerLink: ['/app/chat'] }
                    ]
                },
                {
                    label: 'Settings',
                    items: [{
                        label: 'Logout',
                        icon: 'pi pi-power-off',
                        command: () => this.logout()
                    }]
                }
            ];
        }
        // Customer and Team Member (everything except designer)
        else if (role === 'CUS' || role === 'TM') {
            this.model = commonMenuItems;
        }
        // Default for unauthenticated or unknown roles
        else {
            this.model = [];
        }
    }

    private logout(): void {
        this.authService.logout();
        this.router.navigate(['/sign-in']);
    }
}
