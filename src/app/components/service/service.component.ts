import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { MultiSelectModule } from 'primeng/multiselect';
import { EditorModule } from 'primeng/editor';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { RequestService } from "../../../services/request/request.service";

@Component({
  selector: 'app-service',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MultiSelectModule,
    EditorModule,
    FileUploadModule,
    ToastModule
  ],
  templateUrl: './service.component.html',
  styleUrls: ['./service.component.css'],
  providers: [MessageService]
})
export class ServiceComponent implements OnInit {
  // Default image path
  defaultImage = '/assets/images/preview/default.svg';

  // Service Model
  service = {
    requestName: '',
    description: '', // Stores plain text
    fileDeliverables: [] as string[],
    attachment: null as File | null,
  };

  // Rich text editor content (HTML)
  richTextDescription: string = '';

  // Data from API
  allBrands: any[] = [];
  userBrands: any[] = [];
  categories: any[] = [];
  products: any[] = [];

  fileDeliverables = [
    { label: 'PSD', value: 'PSD' },
    { label: 'AI', value: 'AI' },
    { label: 'JPG', value: 'JPG' },
    { label: 'PNG', value: 'PNG' }
  ];

  // Selected Items
  selectedBrand: any = null;
  selectedCategory: any = null;
  selectedProduct: any = null;

  // Loading states
  loading = false;
  loadingBrands = false;
  loadingCategories = false;
  loadingProducts = false;

  activeBrandTab: 'user' | 'all' = 'user';

  constructor(
      private requestService: RequestService,
      private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.loadUserBrands();
    this.loadAllBrands();
    this.loadCategories();
    this.loadProducts();
  }

  loadUserBrands(): void {
    this.loadingBrands = true;
    this.requestService.getUserBrands().subscribe({
      next: (response) => {
        this.userBrands = this.mapBrands(response.data || response);
      },
      error: (error) => this.handleError(error, 'Failed to load your brands'),
      complete: () => this.loadingBrands = false
    });
  }

  loadAllBrands(): void {
    this.loadingBrands = true;
    this.requestService.getAllBrands().subscribe({
      next: (response) => {
        this.allBrands = this.mapBrands(response.data || response);
      },
      error: (error) => this.handleError(error, 'Failed to load all brands'),
      complete: () => this.loadingBrands = false
    });
  }

  loadCategories(): void {
    this.loadingCategories = true;
    this.requestService.getAllCategories().subscribe({
      next: (response) => {
        this.categories = this.mapCategories(response.data || response);
      },
      error: (error) => this.handleError(error, 'Failed to load categories'),
      complete: () => this.loadingCategories = false
    });
  }

  loadProducts(): void {
    this.loadingProducts = true;
    this.requestService.getAllProducts().subscribe({
      next: (response) => {
        this.products = this.mapProducts(response.data || response);
      },
      error: (error) => this.handleError(error, 'Failed to load products'),
      complete: () => this.loadingProducts = false
    });
  }

  private mapBrands(brands: any[]): any[] {
    return brands?.map(brand => ({
      id: brand.id,
      name: brand.industryName || brand.name,
      image: brand.brandLogo || this.defaultImage,
      requests: 0
    })) || [];
  }

  private mapCategories(categories: any[]): any[] {
    return categories?.map(category => ({
      id: category.id,
      name: category.name,
      image: category.categoryImage || this.defaultImage
    })) || [];
  }

  private mapProducts(products: any[]): any[] {
    return products?.map(product => ({
      id: product.id,
      name: product.productName || product.name,
      image: product.productImage || this.defaultImage
    })) || [];
  }

  handleImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = this.defaultImage;
    img.onerror = null;
  }

  selectBrand(brand: any): void {
    this.selectedBrand = brand;
  }

  selectCategory(category: any): void {
    this.selectedCategory = category;
  }

  selectProduct(product: any): void {
    this.selectedProduct = product;
  }

  onFileUpload(event: { files: File[] }): void {
    if (event.files && event.files.length > 0) {
      this.service.attachment = event.files[0];
    }
  }

  // Convert HTML to plain text
  private htmlToPlainText(html: string): string {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  }

  // Handle editor content changes
  onDescriptionChange(event: any): void {
    if (event?.htmlValue) {
      this.service.description = this.htmlToPlainText(event.htmlValue);
    }
  }

  onSubmit(): void {
    if (!this.validateForm()) return;

    this.loading = true;
    const formData = this.prepareFormData();

    this.requestService.createServiceRequest(formData).subscribe({
      next: () => {
        this.showSuccess('Service request created successfully');
        this.resetForm();
      },
      error: (error) => this.handleError(error, 'Failed to create service request'),
      complete: () => this.loading = false
    });
  }

  private validateForm(): boolean {
    if (!this.selectedBrand || !this.selectedCategory || !this.selectedProduct) {
      this.showWarning('Please select brand, category, and product');
      return false;
    }
    if (!this.service.requestName || !this.service.description) {
      this.showWarning('Please provide request name and description');
      return false;
    }
    return true;
  }

  private prepareFormData(): FormData {
    const formData = new FormData();
    formData.append('name', this.service.requestName);
    formData.append('brand', this.selectedBrand.id);
    formData.append('category', this.selectedCategory.id);
    formData.append('choose_product', this.selectedProduct.id);
    formData.append('description', this.service.description);

    if (this.service.attachment) {
      formData.append('attachment', this.service.attachment);
    }

    formData.append('file_deliveryOption', this.service.fileDeliverables.join(','));
    return formData;
  }

  private resetForm(): void {
    this.service = {
      requestName: '',
      description: '',
      fileDeliverables: [],
      attachment: null,
    };
    this.richTextDescription = '';
    this.selectedBrand = null;
    this.selectedCategory = null;
    this.selectedProduct = null;
  }

  private showSuccess(message: string): void {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: 3000
    });
  }

  private showWarning(message: string): void {
    this.messageService.add({
      severity: 'warn',
      summary: 'Warning',
      detail: message,
      life: 3000
    });
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