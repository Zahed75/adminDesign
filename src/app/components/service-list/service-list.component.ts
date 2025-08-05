import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RequestService } from '../../../services/request/request.service';
import { Router, RouterLink } from '@angular/router';


@Component({
  selector: 'app-service-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    FormsModule,
    DatePipe,
    ConfirmDialogModule,
    ToastModule,
    ProgressSpinnerModule,
    RouterLink
  ],
  templateUrl: './service-list.component.html',
  styleUrls: ['./service-list.component.css'],
  providers: [ConfirmationService, MessageService]
})
export class ServiceListComponent implements OnInit {
  services: any[] = [];
  loading: boolean = true;
  deleteLoading: boolean = false;

  statusFilters = ['All', 'Ongoing', 'Submitted', 'Paused', 'Completed', 'Accept', 'Reject', 'Pending', 'Progress'];
  selectedStatus: string = 'All';

  constructor(
      private confirmationService: ConfirmationService,
      private messageService: MessageService,
      private requestService: RequestService,
      private router: Router
  ) {}

  ngOnInit(): void {
    this.loadServices();
  }

  loadServices(): void {
    this.loading = true;
    this.requestService.getServicesByUser().subscribe({
      next: (response) => {
        this.services = response.data || response;
        if (!Array.isArray(this.services)) {
          this.services = [this.services];
        }
        this.loading = false;
      },
      error: (error) => {
        this.handleError(error, 'Failed to load services');
        this.loading = false;
      }
    });
  }

  get filteredServices() {
    if (this.selectedStatus === 'All') return this.services;
    return this.services.filter(service => service.status === this.selectedStatus);
  }


  getSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (status) {
      case 'Completed':
      case 'Accept':
        return 'success';
      case 'Reject':
        return 'danger';
      case 'Pending':
        return 'warn';
      case 'Progress':
      case 'Ongoing':
        return 'info';
      case 'Paused':
        return 'secondary'; // previously 'help', changed to valid value
      case 'Submitted':
        return 'contrast'; // or undefined if you want default
      default:
        return undefined;
    }
  }


  editService(service: any) {
    this.router.navigate(['/app/service', service.id]);
  }



  deleteService(service: any) {
    this.deleteLoading = true;
    this.requestService.deleteServiceRequest(service.id).subscribe({
      next: () => {
        this.deleteLoading = false;
        this.refreshServices(); // refresh list after deletion
      },
      error: (err: any) => {
        console.error('Failed to delete service:', err);
        this.deleteLoading = false;
      }
    });
  }




  refreshServices() {
    this.loadServices();
  }

  private handleError(error: any, userMessage: string): void {
    console.error('Error:', error);
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: userMessage,
      life: 3000
    });
  }
}