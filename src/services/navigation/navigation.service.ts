import { Injectable } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  getMenuItems(role: string): MenuItem[] {
    const baseItems = [
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
        label: 'Team',
        items: [{ label: 'Invitation', icon: 'pi pi-fw pi-user-plus', routerLink: ['/app/team'] }]
      },
      {
        label: 'Chat',
        items: [{ label: 'Chat', icon: 'pi pi-fw pi-comments', routerLink: ['/app/chat'] }]
      }
    ];

    const designerItems = [
      {
        label: 'Designer',
        items: [
          { label: 'Designer', icon: 'pi pi-fw pi-palette', routerLink: ['/app/designer'] },
          { label: 'Chat', icon: 'pi pi-fw pi-comments', routerLink: ['/app/chat'] }
        ]
      }
    ];

    switch(role) {
      case 'AD': // Admin - show everything
        return baseItems.concat([
          {
            label: 'Designer',
            items: [{ label: 'Designer', icon: 'pi pi-fw pi-palette', routerLink: ['/app/designer'] }]
          }
        ]);

      case 'DES': // Designer - only show designer and chat
        return designerItems;

      case 'CUS': // Customer - show everything except designer
      case 'TM':  // Team Member - show everything except designer
      default:
        return baseItems;
    }
  }
}