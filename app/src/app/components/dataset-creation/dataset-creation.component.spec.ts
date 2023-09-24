import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatasetCreationComponent } from './dataset-creation.component';

describe('DatasetCreationComponent', () => {
  let component: DatasetCreationComponent;
  let fixture: ComponentFixture<DatasetCreationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DatasetCreationComponent]
    });
    fixture = TestBed.createComponent(DatasetCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
