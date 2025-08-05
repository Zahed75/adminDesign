import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { EditorModule } from 'primeng/editor';
import { RequestService } from '../../../services/request/request.service';
import { TagModule } from "primeng/tag";
import { ButtonDirective } from "primeng/button";
import { FileUploadModule } from 'primeng/fileupload';

@Component({
  selector: 'app-service-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DatePipe,
    ConfirmDialogModule,
    ToastModule,
    ProgressSpinnerModule,
    InputTextModule,
    DropdownModule,
    EditorModule,
    TagModule,
    ButtonDirective,
    FileUploadModule
  ],
  templateUrl: './service-details.component.html',
  styleUrls: ['./service-details.component.css'],
  providers: [
    MessageService,
    ConfirmationService
  ]
})
export class ServiceDetailsComponent implements OnInit {
  service: any = {};
  loading: boolean = true;
  saving: boolean = false;
  deleting: boolean = false;
  error: string | null = null;
  editMode: boolean = false;
  newAttachment: File | null = null;

  // Dropdown data
  brands: any[] = [];
  categories: any[] = [];
  products: any[] = [];
  loadingBrands: boolean = true;
  loadingCategories: boolean = true;
  loadingProducts: boolean = true;

  // Dropdown options
  statusOptions = [
    { label: 'Pending', value: 'Pending' },
    { label: 'In Progress', value: 'Progress' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Rejected', value: 'Reject' }
  ];

  deliveryOptions = [
    { label: 'AI File', value: 'AI' },
    { label: 'PSD File', value: 'PSD' },
    { label: 'PDF File', value: 'PDF' },
    { label: 'Source Files', value: 'SOURCE' }
  ];

  constructor(
      private route: ActivatedRoute,
      private router: Router,
      private requestService: RequestService,
      private messageService: MessageService,
      private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    const serviceId = this.route.snapshot.paramMap.get('id');
    if (serviceId) {
      this.loadServiceDetails(+serviceId);
      this.loadDropdownData();
    } else {
      this.error = 'Invalid service ID';
      this.loading = false;
    }
  }

  loadServiceDetails(serviceId: number): void {
    this.loading = true;
    this.requestService.getServiceDetailsById(serviceId).subscribe({
      next: (response) => {
        this.service = response.data || response;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load service details';
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load service details'
        });
      }
    });
  }

  loadDropdownData(): void {
    // Load brands
    this.loadingBrands = true;
    this.requestService.getUserBrands().subscribe({
      next: (response) => {
        const data = response.data || response;
        this.brands = Array.isArray(data) ?
            data.map(brand => ({
              id: brand.id,
              name: brand.industryName || 'Unnamed Brand',
              ...brand
            })) :
            [{ id: data.id, name: data.industryName || 'Unnamed Brand', ...data }];
        this.loadingBrands = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load brands'
        });
        this.loadingBrands = false;
      }
    });

    // Load products
    this.loadingProducts = true;
    this.requestService.getAllProducts().subscribe({
      next: (response) => {
        const data = response.data || response;
        this.products = Array.isArray(data) ?
            data.map(product => ({
              id: product.id,
              name: product.productName || 'Unnamed Product',
              ...product
            })) :
            [{ id: data.id, name: data.productName || 'Unnamed Product', ...data }];
        this.loadingProducts = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load products'
        });
        this.loadingProducts = false;
      }
    });

    // Load categories
    this.loadingCategories = true;
    this.requestService.getAllCategories().subscribe({
      next: (response) => {
        const data = response.data || response;
        this.categories = Array.isArray(data) ? data : [data];
        this.loadingCategories = false;
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load categories'
        });
        this.loadingCategories = false;
      }
    });
  }

  getBrandName(id: number): string {
    const brand = this.brands.find(b => b.id === id);
    return brand?.industryName || brand?.name || 'Unknown Brand';
  }

  getCategoryName(id: number): string {
    const category = this.categories.find(c => c.id === id);
    return category?.name || 'Unknown Category';
  }

  getProductName(id: number): string {
    const product = this.products.find(p => p.id === id);
    return product?.productName || product?.name || 'Unknown Product';
  }

  onAttachmentUpload(event: any): void {
    if (event.files && event.files.length > 0) {
      this.newAttachment = event.files[0];
    }
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.newAttachment = null;
    }
  }




  saveChanges(): void {
    if (!this.service.id) return;

    this.saving = true;
    const formData = new FormData();

    // Append all fields to FormData
    formData.append('name', this.service.name);
    formData.append('brand', this.service.brand);
    formData.append('category', this.service.category);
    formData.append('choose_product', this.service.choose_product);
    formData.append('description', this.service.description);
    formData.append('file_deliveryOption', this.service.file_deliveryOption);

    // Append new attachment if exists
    if (this.newAttachment) {
      formData.append('attachment', this.newAttachment);
    }

    this.requestService.updateServiceRequest(this.service.id, formData).subscribe({
      next: (response) => {
        this.service = response.data || response;
        this.editMode = false;
        this.newAttachment = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Service updated successfully'
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to update service'
        });
        this.saving = false;
      },
      complete: () => {
        this.saving = false;
      }
    });
  }




  deleteService(): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this service?',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleting = true;
        this.requestService.deleteServiceRequest(this.service.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Service deleted successfully'
            });
            this.router.navigate(['/app/service-list']);
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete service'
            });
          },
          complete: () => {
            this.deleting = false;
          }
        });
      }
    });
  }

  getSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'accept':
        return 'success';
      case 'reject':
        return 'danger';
      case 'pending':
        return 'warn';
      case 'progress':
      case 'ongoing':
        return 'info';
      case 'paused':
        return 'secondary';
      case 'submitted':
        return 'contrast';
      default:
        return undefined;
    }
  }
}