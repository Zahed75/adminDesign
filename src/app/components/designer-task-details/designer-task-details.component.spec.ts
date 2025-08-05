import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DesignerTaskDetailsComponent } from './designer-task-details.component';

describe('DesignerTaskDetailsComponent', () => {
  let component: DesignerTaskDetailsComponent;
  let fixture: ComponentFixture<DesignerTaskDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesignerTaskDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DesignerTaskDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
