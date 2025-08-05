import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DesignerTaskComponent } from './designer-task.component';

describe('DesignerTaskComponent', () => {
  let component: DesignerTaskComponent;
  let fixture: ComponentFixture<DesignerTaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DesignerTaskComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DesignerTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
