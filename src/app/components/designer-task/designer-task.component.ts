import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { DesignerTaskService } from '../../../services/designer-task/designer-task.service';
import { Router } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

type TaskStatus = 'Ongoing' | 'Submitted' | 'Paused' | 'Completed' | 'Accept' | 'Reject' | 'Pending' | 'Progress';
type Severity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

interface Task {
  id: number;
  serviceName: string;
  customerName: string;
  requestedDate: Date;
  status: TaskStatus;
  originalData: any;
}

@Component({
  selector: 'app-designer-task',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule,
    DatePipe,
    DropdownModule,
    FormsModule
  ],
  templateUrl: './designer-task.component.html',
  styleUrls: ['./designer-task.component.css'],
  providers: [ConfirmationService, MessageService],
})
export class DesignerTaskComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  loading: boolean = false;
  rowsPerPage: number = 10; // Default to 10 items
  currentPage: number = 0;
  statusFilter: TaskStatus | null = null;
  private destroy$ = new Subject<void>();

  statusOptions = [
    { label: 'All', value: null },
    { label: 'Pending', value: 'Pending' },
    { label: 'Accepted', value: 'Accept' },
    { label: 'Rejected', value: 'Reject' },
    { label: 'In Progress', value: 'Progress' },
    { label: 'Submitted', value: 'Submitted' },
    { label: 'Paused', value: 'Paused' },
    { label: 'Completed', value: 'Completed' },
    { label: 'Ongoing', value: 'Ongoing' }
  ];

  constructor(
      private confirmationService: ConfirmationService,
      private messageService: MessageService,
      private taskService: DesignerTaskService,
      private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTasks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTasks(): void {
    this.loading = true;
    this.taskService.getAllServiceRequests()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (!response?.data) {
              throw new Error('Invalid API response format');
            }

            this.tasks = response.data
                .map((task: any) => ({
                  id: task.id,
                  serviceName: task.name,
                  customerName: `User ${task.user}`,
                  requestedDate: new Date(task.created_at),
                  status: task.status as TaskStatus,
                  originalData: task
                }))
                .sort((taskA: Task, taskB: Task) =>
                    taskB.requestedDate.getTime() - taskA.requestedDate.getTime()
                );

            this.applyFilter();
            this.loading = false;
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to load tasks'
            });
            this.loading = false;
            this.tasks = [];
            this.filteredTasks = [];
          }
        });
  }








  applyFilter(): void {
    if (!this.statusFilter) {
      this.filteredTasks = [...this.tasks];
    } else {
      this.filteredTasks = this.tasks.filter(task =>
          task.status.toLowerCase() === this.statusFilter?.toLowerCase()
      );
    }
    this.currentPage = 0;
  }

  getSeverity(status: TaskStatus): Severity {
    switch (status) {
      case 'Accept':
      case 'Completed':
        return 'success';
      case 'Reject':
        return 'danger';
      case 'Pending':
        return 'warn';
      case 'Progress':
      case 'Ongoing':
        return 'info';
      case 'Submitted':
        return 'secondary';
      case 'Paused':
        return 'contrast';
      default:
        return 'info';
    }
  }

  acceptTask(task: Task) {
    this.confirmationService.confirm({
      key: 'globalConfirm',
      message: `Are you sure you want to accept "${task.serviceName}"?`,
      header: 'Confirm Acceptance',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.updateTaskStatus(task, 'Accept');
      }
    });
  }

  rejectTask(task: Task) {
    this.confirmationService.confirm({
      key: 'globalConfirm',
      message: `Are you sure you want to reject "${task.serviceName}"?`,
      header: 'Confirm Rejection',
      icon: 'pi pi-times-circle',
      accept: () => {
        this.updateTaskStatus(task, 'Reject');
      }
    });
  }

  startProgress(task: Task) {
    this.confirmationService.confirm({
      key: 'globalConfirm',
      message: `Are you sure you want to start progress on "${task.serviceName}"?`,
      header: 'Confirm Start Progress',
      icon: 'pi pi-play',
      accept: () => {
        this.updateTaskStatus(task, 'Progress');
      }
    });
  }

  pauseTask(task: Task) {
    this.confirmationService.confirm({
      key: 'globalConfirm',
      message: `Are you sure you want to pause "${task.serviceName}"?`,
      header: 'Confirm Pause',
      icon: 'pi pi-pause',
      accept: () => {
        this.updateTaskStatus(task, 'Paused');
      }
    });
  }

  completeTask(task: Task) {
    this.confirmationService.confirm({
      key: 'globalConfirm',
      message: `Are you sure you want to complete "${task.serviceName}"?`,
      header: 'Confirm Completion',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.updateTaskStatus(task, 'Completed');
      }
    });
  }

  submitTask(task: Task) {
    this.confirmationService.confirm({
      key: 'globalConfirm',
      message: `Are you sure you want to submit "${task.serviceName}"?`,
      header: 'Confirm Submission',
      icon: 'pi pi-send',
      accept: () => {
        this.updateTaskStatus(task, 'Submitted');
      }
    });
  }

  private updateTaskStatus(task: Task, status: TaskStatus) {
    this.loading = true;
    this.taskService.updateRequestStatus(task.id, status)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            const updatedTask = { ...task, status };
            this.tasks = this.tasks.map(t => t.id === task.id ? updatedTask : t);
            this.filteredTasks = this.filteredTasks.map(t => t.id === task.id ? updatedTask : t);

            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: response.message || 'Status updated successfully'
            });
            this.loading = false;
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: err.error?.message || 'Failed to update status'
            });
            this.loading = false;
          }
        });
  }

  viewDetails(task: Task) {
    this.router.navigate(['/app/designer', task.id]);
  }

  refreshTasks() {
    this.loadTasks();
    this.messageService.add({
      severity: 'info',
      summary: 'Refreshed',
      detail: 'Task list has been refreshed.'
    });
  }
}
