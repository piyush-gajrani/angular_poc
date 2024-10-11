import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadFlowModalComponent } from './upload-flow-modal.component';

describe('UploadFlowModalComponent', () => {
  let component: UploadFlowModalComponent;
  let fixture: ComponentFixture<UploadFlowModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadFlowModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UploadFlowModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
