import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcerptAnnotationComponent } from './excerpt-annotation.component';

describe('ExcerptAnnotationComponent', () => {
  let component: ExcerptAnnotationComponent;
  let fixture: ComponentFixture<ExcerptAnnotationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ExcerptAnnotationComponent]
    });
    fixture = TestBed.createComponent(ExcerptAnnotationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
