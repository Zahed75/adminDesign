// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { BrandService } from '../../../services/brand/brand.service';
// import { Router } from '@angular/router';
// import { HttpErrorResponse } from '@angular/common/http';
//
// interface Brand {
//   id?: number;
//   industryName: string;
//   description: string;
//   website: string;
//   brandColor: string | null;
//   brandLogo?: string;
//   brandGuide?: string;
//   brandFonts?: string;
//   logo?: File;
//   guidelines?: File;
//   fonts?: File;
// }
//
// interface ApiResponse {
//   data: Brand[];
// }
//
// @Component({
//   selector: 'app-brands',
//   standalone: true,
//   imports: [CommonModule, FormsModule],
//   templateUrl: './brands.component.html',
//   styleUrls: ['./brands.component.css'],
// })
// export class BrandsComponent implements OnInit {
//   brands: Brand[] = [];
//   brand: Brand = {
//     industryName: '',
//     description: '',
//     website: '',
//     brandColor: null
//   };
//   isEditMode = false;
//   isLoading = false;
//   errorMessage: string | null = null;
//   successMessage: string | null = null;
//
//   predefinedColors = [
//     '#FF5733', '#33FF57', '#3357FF', '#F3FF33',
//     '#FF33F3', '#33FFF3', '#FF8333', '#33FF83'
//   ];
//
//   constructor(
//       private brandService: BrandService,
//       private router: Router
//   ) {}
//
//   ngOnInit() {
//     this.loadBrands();
//   }
//
//   loadBrands() {
//     this.isLoading = true;
//     this.brandService.getBrandsByUser().subscribe({
//       next: (response: ApiResponse) => {
//         this.brands = response.data;
//         this.isLoading = false;
//       },
//       error: (error: HttpErrorResponse) => {
//         this.handleError(error);
//         this.isLoading = false;
//       }
//     });
//   }
//
//   editBrand(brand: Brand) {
//     this.isEditMode = true;
//     this.brand = {
//       ...brand,
//       brandColor: brand.brandColor || null,
//       logo: undefined,
//       guidelines: undefined,
//       fonts: undefined
//     };
//     window.scrollTo(0, 0);
//   }
//
//   prepareFormData(): FormData {
//     const formData = new FormData();
//
//     // Append text fields
//     formData.append('industryName', this.brand.industryName);
//     formData.append('description', this.brand.description);
//     formData.append('website', this.brand.website);
//
//     // Append brandColor only if it exists
//     if (this.brand.brandColor) {
//       formData.append('brandColor', this.brand.brandColor);
//     }
//
//     // Append files with proper field names that match your backend expectations
//     if (this.brand.logo) {
//       formData.append('brandLogo', this.brand.logo, this.brand.logo.name);
//     }
//     if (this.brand.guidelines) {
//       formData.append('brandGuide', this.brand.guidelines, this.brand.guidelines.name);
//     }
//     if (this.brand.fonts) {
//       formData.append('brandFonts', this.brand.fonts, this.brand.fonts.name);
//     }
//
//     return formData;
//   }
//
//   onFileSelected(event: Event, field: 'logo' | 'guidelines' | 'fonts') {
//     const input = event.target as HTMLInputElement;
//     if (input.files && input.files.length) {
//       this.brand[field] = input.files[0];
//     }
//   }
//
//   selectColor(color: string) {
//     const colors = this.brand.brandColor ? this.brand.brandColor.split(',') : [];
//     if (!colors.includes(color)) {
//       colors.push(color);
//       this.brand.brandColor = colors.join(',');
//     }
//   }
//
//   removeColor(color: string) {
//     if (!this.brand.brandColor) return;
//     const colors = this.brand.brandColor.split(',');
//     this.brand.brandColor = colors.filter(c => c !== color).join(',');
//   }
//
//   resetColors() {
//     this.brand.brandColor = null;
//   }
//
//   resetForm() {
//     this.brand = {
//       industryName: '',
//       description: '',
//       website: '',
//       brandColor: null
//     };
//     this.isEditMode = false;
//     this.errorMessage = null;
//     this.successMessage = null;
//   }
//
//   onSubmit() {
//     this.isLoading = true;
//     this.errorMessage = null;
//     this.successMessage = null;
//
//     const formData = this.prepareFormData();
//
//     if (this.isEditMode && this.brand.id) {
//       this.brandService.updateBrand(this.brand.id, formData).subscribe({
//         next: () => {
//           this.handleSuccess('Brand updated successfully!');
//         },
//         error: (error: HttpErrorResponse) => {
//           this.handleError(error);
//         }
//       });
//     } else {
//       this.brandService.createBrand(formData).subscribe({
//         next: () => {
//           this.handleSuccess('Brand created successfully!');
//         },
//         error: (error: HttpErrorResponse) => {
//           this.handleError(error);
//         }
//       });
//     }
//   }
//
//   deleteBrand(id: number) {
//     if (confirm('Are you sure you want to delete this brand?')) {
//       this.isLoading = true;
//       this.brandService.deleteBrand(id).subscribe({
//         next: () => {
//           this.handleSuccess('Brand deleted successfully!');
//         },
//         error: (error: HttpErrorResponse) => {
//           if (error.status === 404) {
//             this.errorMessage = 'Brand not found. It may have already been deleted.';
//           } else {
//             this.handleError(error);
//           }
//           this.isLoading = false;
//           this.loadBrands();
//         }
//       });
//     }
//   }
//
//   private handleSuccess(message: string) {
//     this.successMessage = message;
//     this.resetForm();
//     this.loadBrands();
//     this.isLoading = false;
//   }
//
//   private handleError(error: HttpErrorResponse) {
//     if (error.status === 401) {
//       this.handleAuthError(error);
//     } else {
//       this.errorMessage = error.error?.message || 'An unexpected error occurred';
//     }
//     this.isLoading = false;
//   }
//
//   private handleAuthError(error: HttpErrorResponse) {
//     this.errorMessage = 'Authentication failed. Please login again.';
//     // this.router.navigate(['/login']);
//   }
// }




import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrandService } from '../../../services/brand/brand.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

interface Brand {
  id?: number;
  industryName: string;
  description: string;
  website: string;
  brandColor: string | null;
  brandLogo?: string;
  brandGuide?: string;
  brandFonts?: string;
  logo?: File;
  guidelines?: File;
  fonts?: File;
}

interface ApiResponse {
  data: Brand[];
}

@Component({
  selector: 'app-brands',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule],
  templateUrl: './brands.component.html',
  styleUrls: ['./brands.component.css'],
  providers: [MessageService]
})
export class BrandsComponent implements OnInit {
  brands: Brand[] = [];
  brand: Brand = {
    industryName: '',
    description: '',
    website: '',
    brandColor: null
  };
  isEditMode = false;
  isLoading = false;
  predefinedColors = [
    '#FF5733', '#33FF57', '#3357FF', '#F3FF33',
    '#FF33F3', '#33FFF3', '#FF8333', '#33FF83'
  ];

  constructor(
      private brandService: BrandService,
      private router: Router,
      private messageService: MessageService
  ) {}

  ngOnInit() {
    this.loadBrands();
  }

  loadBrands() {
    this.isLoading = true;
    this.brandService.getBrandsByUser().subscribe({
      next: (response: ApiResponse) => {
        this.brands = response.data;
        this.isLoading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(error);
        this.isLoading = false;
      }
    });
  }

  editBrand(brand: Brand) {
    this.isEditMode = true;
    this.brand = {
      ...brand,
      brandColor: brand.brandColor || null,
      logo: undefined,
      guidelines: undefined,
      fonts: undefined
    };
    window.scrollTo(0, 0);
  }

  prepareFormData(): FormData {
    const formData = new FormData();
    formData.append('industryName', this.brand.industryName);
    formData.append('description', this.brand.description);
    formData.append('website', this.brand.website);

    if (this.brand.brandColor) {
      formData.append('brandColor', this.brand.brandColor);
    }

    if (this.brand.logo) {
      formData.append('brandLogo', this.brand.logo, this.brand.logo.name);
    }
    if (this.brand.guidelines) {
      formData.append('brandGuide', this.brand.guidelines, this.brand.guidelines.name);
    }
    if (this.brand.fonts) {
      formData.append('brandFonts', this.brand.fonts, this.brand.fonts.name);
    }

    return formData;
  }

  onFileSelected(event: Event, field: 'logo' | 'guidelines' | 'fonts') {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.brand[field] = input.files[0];
    }
  }

  selectColor(color: string) {
    const colors = this.brand.brandColor ? this.brand.brandColor.split(',') : [];
    if (!colors.includes(color)) {
      colors.push(color);
      this.brand.brandColor = colors.join(',');
    }
  }

  removeColor(color: string) {
    if (!this.brand.brandColor) return;
    const colors = this.brand.brandColor.split(',');
    this.brand.brandColor = colors.filter(c => c !== color).join(',');
  }

  resetColors() {
    this.brand.brandColor = null;
  }

  resetForm() {
    this.brand = {
      industryName: '',
      description: '',
      website: '',
      brandColor: null
    };
    this.isEditMode = false;
  }

  onSubmit() {
    // Validate required fields
    if (!this.brand.industryName || !this.brand.description || !this.brand.website) {
      this.showError('Please fill all required fields');
      return;
    }

    if (!this.brand.logo && !this.isEditMode) {
      this.showError('Brand logo is required');
      return;
    }

    this.isLoading = true;
    const formData = this.prepareFormData();

    if (this.isEditMode && this.brand.id) {
      this.brandService.updateBrand(this.brand.id, formData).subscribe({
        next: () => {
          this.showSuccess('Brand updated successfully');
          this.resetForm();
          this.loadBrands();
        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error);
        }
      });
    } else {
      this.brandService.createBrand(formData).subscribe({
        next: () => {
          this.showSuccess('Brand created successfully');
          this.resetForm();
          this.loadBrands();
        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error);
        }
      });
    }
  }

  deleteBrand(id: number) {
    if (confirm('Are you sure you want to delete this brand?')) {
      this.isLoading = true;
      this.brandService.deleteBrand(id).subscribe({
        next: () => {
          this.showSuccess('Brand deleted successfully');
          this.loadBrands();
        },
        error: (error: HttpErrorResponse) => {
          this.handleError(error);
          this.loadBrands();
        }
      });
    }
  }

  private showSuccess(message: string) {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: message,
      life: 3000
    });
    this.isLoading = false;
  }

  private showError(message: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 3000
    });
  }

  private handleError(error: HttpErrorResponse) {
    this.isLoading = false;

    if (error.status === 401) {
      this.showError('Authentication failed. Please login again.');
    } else if (error.error?.errors) {
      // Handle validation errors
      const errors = error.error.errors;
      Object.keys(errors).forEach(key => {
        this.showError(errors[key][0]);
      });
    } else {
      this.showError(error.error?.message || 'An unexpected error occurred');
    }
  }
}