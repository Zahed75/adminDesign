import { TestBed } from '@angular/core/testing';

import { DesignerTaskService } from './designer-task.service';

describe('DesignerTaskService', () => {
  let service: DesignerTaskService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DesignerTaskService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
