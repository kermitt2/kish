import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatasetMetricsComponent } from './dataset-metrics.component';

describe('DatasetMetricsComponent', () => {
  let component: DatasetMetricsComponent;
  let fixture: ComponentFixture<DatasetMetricsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DatasetMetricsComponent]
    });
    fixture = TestBed.createComponent(DatasetMetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
