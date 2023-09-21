import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatasetExportComponent } from './dataset-export.component';

describe('DatasetExportComponent', () => {
  let component: DatasetExportComponent;
  let fixture: ComponentFixture<DatasetExportComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DatasetExportComponent]
    });
    fixture = TestBed.createComponent(DatasetExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
