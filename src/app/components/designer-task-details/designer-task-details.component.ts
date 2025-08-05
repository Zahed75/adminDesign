import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DesignerTaskService } from '../../../services/designer-task/designer-task.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

@Component({
  selector: 'app-designer-task-details',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    ToastModule,
    ProgressSpinnerModule,
    DatePipe
  ],
  templateUrl: './designer-task-details.component.html',
  styleUrls: ['./designer-task-details.component.css'],
  providers: [MessageService]
})
export class DesignerTaskDetailsComponent implements OnInit {
  taskId!: number;
  taskDetails: any;
  loading: boolean = false;

  constructor(
      private route: ActivatedRoute,
      private taskService: DesignerTaskService,
      private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.taskId = +this.route.snapshot.params['id'];
    this.loadTaskDetails();
  }

  loadTaskDetails(): void {
    this.loading = true;
    this.taskService.getRequestDetails(this.taskId).subscribe({
      next: (response) => {
        this.taskDetails = response.data;
        this.loading = false;
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load task details'
        });
        this.loading = false;
      }
    });
  }

  getSeverity(status: string): Severity {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('progress')) return 'warn';
    if (statusLower.includes('pending')) return 'danger';
    if (statusLower.includes('delivered')) return 'success';
    if (statusLower.includes('accept')) return 'info';
    if (statusLower.includes('rejected')) return 'danger';
    return 'info';
  }
}
