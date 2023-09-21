import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcerptClassificationComponent } from './excerpt-classification.component';

describe('ExcerptClassificationComponent', () => {
  let component: ExcerptClassificationComponent;
  let fixture: ComponentFixture<ExcerptClassificationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExcerptClassificationComponent]
    });
    fixture = TestBed.createComponent(ExcerptClassificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
